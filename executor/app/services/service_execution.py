import os
import sys
import importlib.util
import inspect
import uuid
import asyncio
from typing import List, Dict, Any, Callable, Optional

from app.api.dtos.execution import (
    DeploymentRequest,
    Deployment,
    WorkflowTreeNodeDataClass,
)

ACTIVE_DEPLOYMENTS: Dict[str, Deployment] = {}
ACTIVE_INSTANCES: Dict[str, Dict[str, Any]] = {}


class ResultObserver:
    def __init__(self):
        self._callbacks: List[Callable[[List[Dict[str, Any]]], Any]] = []

    def subscribe(self, callback: Callable[[List[Dict[str, Any]]], Any]):
        self._callbacks.append(callback)

    async def notify(self, results: List[Dict[str, Any]]):
        for callback in self._callbacks:
            if inspect.iscoroutinefunction(callback):
                await callback(results)
            else:
                callback(results)


result_observer = ResultObserver()


class NodeLoader:
    @staticmethod
    def load_from_directory(directory_path: str) -> Dict[str, type]:
        registry: Dict[str, type] = {}
        if not directory_path or not os.path.exists(directory_path):
            return registry

        for filename in os.listdir(directory_path):
            if not filename.endswith(".py") or filename == "__init__.py":
                continue

            file_path = os.path.join(directory_path, filename)
            module_name = f"nodes_{uuid.uuid4().hex}"

            spec = importlib.util.spec_from_file_location(module_name, file_path)
            if not spec or not spec.loader:
                continue

            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module

            try:
                spec.loader.exec_module(module)
            except Exception:
                del sys.modules[module_name]
                continue

            for _, obj in inspect.getmembers(module, inspect.isclass):
                if obj.__module__ == module.__name__ and hasattr(obj, "execute"):
                    registry[filename[:-3]] = obj
                    break

        return registry


def get_best_node_match(node_type: str, registry: Dict[str, type]):
    node_type_lower = node_type.lower()
    matches = [key for key in registry.keys() if key in node_type_lower]
    if not matches:
        return None
    return registry[max(matches, key=len)]


def _create_trigger(
        connections: Dict[str, List[Any]],
        node_instances: Dict[str, Any],
) -> Callable:
    async def trigger(output_handle: str, payload: Any = None) -> List[Any]:
        results: List[Any] = []
        targets = connections.get(output_handle, [])

        for target in targets:
            child = node_instances.get(target.targetNode.id)
            if not child:
                continue

            if hasattr(child, "inject_parameter"):
                for param in target.targetNode.data.connectedParams:
                    child.inject_parameter(param, payload)

        for target in targets:
            child = node_instances.get(target.targetNode.id)
            if not child:
                continue

            res = None
            if target.targetHandle == "activation":
                if inspect.iscoroutinefunction(child.execute):
                    res = await child.execute(result_observer)
                else:
                    res = child.execute(result_observer)
            elif hasattr(child, "on_trigger"):
                if inspect.iscoroutinefunction(child.on_trigger):
                    res = await child.on_trigger(target.targetHandle, payload)
                else:
                    res = child.on_trigger(target.targetHandle, payload)

            if res is not None:
                node_result = {"node_id": child.id, "result": res}
                results.append(node_result)
                await result_observer.notify([node_result])

            if hasattr(child, "trigger"):
                next_handle = "activation"
                if target.targetHandle != "activation":
                    if res is True or str(res).upper() == "TRUE":
                        next_handle = "true"
                    elif res is False or str(res).upper() == "FALSE":
                        next_handle = "false"
                    else:
                        next_handle = target.targetHandle

                downstream_results = await child.trigger(next_handle, payload if res is None else res)
                results.extend(downstream_results)

        return results

    return trigger


def _hydrate_tree(
        node_data: WorkflowTreeNodeDataClass,
        node_instances: Dict[str, Any],
        registry: Dict[str, type],
):
    if node_data.id in node_instances:
        return

    node_class = get_best_node_match(node_data.type, registry)
    if not node_class:
        raise RuntimeError(f"No node implementation for type '{node_data.type}'")

    instance = node_class()
    instance.id = node_data.id
    instance.data = node_data.data
    node_instances[node_data.id] = instance

    for handle_id in node_data.connections:
        for connection in node_data.connections[handle_id]:
            _hydrate_tree(connection.targetNode, node_instances, registry)


def _inject_triggers(
        node_data: WorkflowTreeNodeDataClass,
        node_instances: Dict[str, Any],
        visited: set,
):
    if node_data.id in visited:
        return
    visited.add(node_data.id)

    instance = node_instances[node_data.id]
    instance.trigger = _create_trigger(node_data.connections, node_instances)

    for handle_id in node_data.connections:
        for connection in node_data.connections[handle_id]:
            _inject_triggers(connection.targetNode, node_instances, visited)


def deploy(deployments: List[DeploymentRequest]) -> List[str]:
    reference_ids = []

    for req in deployments:
        reference_id = str(uuid.uuid4())
        ctx = Deployment(
            forest=req.forest,
            metadata=req.metadata,
            reference_id=reference_id,
        )
        ACTIVE_DEPLOYMENTS[reference_id] = ctx
        reference_ids.append(reference_id)

    return reference_ids


def activate_deployment(deployment_id: str):
    deployment = ACTIVE_DEPLOYMENTS.get(deployment_id)
    if not deployment:
        return {"status": "failed"}

    def report_error(error_msg: str):
        deployment.metadata.status = "error"
        print(f"Error in deployment {deployment_id}: {error_msg}")

    for key in list(sys.modules.keys()):
        if key.startswith("nodes_"):
            del sys.modules[key]

    registry = NodeLoader.load_from_directory(
        deployment.metadata.workspace.builder.nodes_dir
    )

    node_instances: Dict[str, Any] = {}

    for root in deployment.forest:
        _hydrate_tree(root, node_instances, registry)

    visited = set()
    for root in deployment.forest:
        _inject_triggers(root, node_instances, visited)

    ACTIVE_INSTANCES[deployment_id] = node_instances

    for root in deployment.forest:
        instance = node_instances[root.id]

        if inspect.iscoroutinefunction(instance.execute):
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(instance.execute(result_observer, report_error))
            except RuntimeError:
                asyncio.run(instance.execute(result_observer, report_error))
        else:
            instance.execute(result_observer, report_error)

    deployment.metadata.status = "active"

    return {"status": "activated"}


async def stop_deployment(deployment_id: str):
    deployment = ACTIVE_DEPLOYMENTS.get(deployment_id)
    instances = ACTIVE_INSTANCES.get(deployment_id, {})

    for instance in instances.values():
        if hasattr(instance, "on_trigger"):
            try:
                await instance.on_trigger("stop", None)
            except Exception:
                pass

    if deployment:
        deployment.metadata.status = "idle"

    ACTIVE_INSTANCES.pop(deployment_id, None)


async def force_kill_all():
    for dep_id in list(ACTIVE_INSTANCES.keys()):
        await stop_deployment(dep_id)

    ACTIVE_DEPLOYMENTS.clear()
    ACTIVE_INSTANCES.clear()


async def clear_deployments():
    await force_kill_all()


def get_active_deployments():
    return list(ACTIVE_DEPLOYMENTS.values())