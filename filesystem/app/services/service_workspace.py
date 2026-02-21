import os
import json
import uuid
import shutil
from datetime import datetime

WORKSPACES_DIR = "data/workspaces"
WORKSPACE_META_FILE = "workspace.json"
PROJECT_DIR = "project"
NODES_DIR = "nodes"


def _safe_join(base: str, *paths: str) -> str:
    target = os.path.abspath(os.path.join(base, *paths))
    if not target.startswith(os.path.abspath(base)):
        raise ValueError("Path traversal detected")
    return target


def _workspace_root(workspace_id: str) -> str:
    return _safe_join(WORKSPACES_DIR, workspace_id)


def _project_root(workspace_id: str) -> str:
    return _safe_join(_workspace_root(workspace_id), PROJECT_DIR)


def _nodes_root(workspace_id: str) -> str:
    return _safe_join(_workspace_root(workspace_id), NODES_DIR)


def create_workspace(name: str, description: str | None, category: str = "General"):
    workspace_id = str(uuid.uuid4())
    root = _workspace_root(workspace_id)
    project_root = _project_root(workspace_id)
    nodes_root = _nodes_root(workspace_id)

    os.makedirs(project_root, exist_ok=False)
    os.makedirs(nodes_root, exist_ok=False)

    workspace_meta = {
        "uuid": workspace_id,
        "name": name,
        "description": description,
        "category": category,
        "lastUpdated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "thumbnailUrl": "/api/placeholder/400/225",
        "isDarkThumbnail": True,
        "shorthand": workspace_id,
        "settings": {},
        "builder": {
            "nodes_dir": nodes_root,
            "node_templates": [],
        }
    }

    with open(os.path.join(root, WORKSPACE_META_FILE), "w", encoding="utf-8") as f:
        json.dump(workspace_meta, f, indent=2)

    return workspace_meta


def list_workspaces():
    if not os.path.isdir(WORKSPACES_DIR):
        return []

    result = []
    for wid in os.listdir(WORKSPACES_DIR):
        meta_path = os.path.join(WORKSPACES_DIR, wid, WORKSPACE_META_FILE)
        if os.path.isfile(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                result.append(json.load(f))
    return result


def get_workspace(workspace_id: str):
    meta_path = os.path.join(_workspace_root(workspace_id), WORKSPACE_META_FILE)
    if not os.path.isfile(meta_path):
        raise FileNotFoundError
    with open(meta_path, "r", encoding="utf-8") as f:
        return json.load(f)


def update_workspace(workspace_id: str, updates: dict):
    meta = get_workspace(workspace_id)

    updates["lastUpdated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    meta.update({k: v for k, v in updates.items() if v is not None})

    meta_path = os.path.join(_workspace_root(workspace_id), WORKSPACE_META_FILE)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    return meta


def delete_workspace(workspace_id: str):
    shutil.rmtree(_workspace_root(workspace_id))


def list_project_tree(workspace_id: str):
    base = _project_root(workspace_id)
    result = []

    for root, dirs, files in os.walk(base):
        rel = os.path.relpath(root, base)
        result.append({
            "path": "" if rel == "." else rel,
            "folders": dirs,
            "files": files
        })
    return result


def save_workflow(workspace_id: str, path: str, payload: dict):
    target = _safe_join(_project_root(workspace_id), path)
    os.makedirs(os.path.dirname(target), exist_ok=True)

    with open(target, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    update_workspace(workspace_id, {})


def load_workflow(workspace_id: str, path: str):
    target = _safe_join(_project_root(workspace_id), path)
    if not os.path.isfile(target):
        raise FileNotFoundError
    with open(target, "r", encoding="utf-8") as f:
        return json.load(f)


def delete_path(workspace_id: str, path: str):
    target = _safe_join(_project_root(workspace_id), path)
    if os.path.isfile(target):
        os.remove(target)
    elif os.path.isdir(target):
        shutil.rmtree(target)
    else:
        raise FileNotFoundError

    update_workspace(workspace_id, {})


def rename_path(workspace_id: str, path: str, new_name: str):
    src = _safe_join(_project_root(workspace_id), path)
    dst = _safe_join(os.path.dirname(src), new_name)
    os.rename(src, dst)

    update_workspace(workspace_id, {})


def move_path(workspace_id: str, source: str, target: str):
    src = _safe_join(_project_root(workspace_id), source)
    dst = _safe_join(_project_root(workspace_id), target)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.move(src, dst)

    update_workspace(workspace_id, {})