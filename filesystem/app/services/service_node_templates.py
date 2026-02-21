import os
import json
from app.services import service_workspace as workspace_service

TEMPLATES_LIB_DIR = "data/templates_library"


def _ensure_lib_exists():
    if not os.path.exists(TEMPLATES_LIB_DIR):
        os.makedirs(TEMPLATES_LIB_DIR)


def save_template_to_library(name: str, data: dict):
    _ensure_lib_exists()
    file_path = os.path.join(TEMPLATES_LIB_DIR, f"{name}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return {"name": name, "status": "saved"}


def list_library_templates():
    _ensure_lib_exists()
    templates = []
    for filename in os.listdir(TEMPLATES_LIB_DIR):
        if filename.endswith(".json"):
            path = os.path.join(TEMPLATES_LIB_DIR, filename)
            with open(path, "r", encoding="utf-8") as f:
                templates.append(json.load(f))
    return templates


def add_template_to_workspace(workspace_id: str, template_name: str):
    lib_path = os.path.join(TEMPLATES_LIB_DIR, f"{template_name}.json")
    if not os.path.exists(lib_path):
        raise FileNotFoundError("Template not found in library")

    with open(lib_path, "r", encoding="utf-8") as f:
        template_data = json.load(f)

    workspace_meta = workspace_service.get_workspace(workspace_id)

    if "builder" not in workspace_meta:
        workspace_meta["builder"] = {"node_templates": []}

    existing_templates = workspace_meta["builder"].get("node_templates", [])

    exists = False
    for i, t in enumerate(existing_templates):
        if t.get("label") == template_data.get("label") or t.get("type") == template_data.get("type"):
            existing_templates[i] = template_data
            exists = True
            break

    if not exists:
        existing_templates.append(template_data)

    workspace_meta["builder"]["node_templates"] = existing_templates
    return workspace_service.update_workspace(workspace_id, workspace_meta)


def delete_template_from_library(name: str):
    file_path = os.path.join(TEMPLATES_LIB_DIR, f"{name}.json")
    if os.path.exists(file_path):
        os.remove(file_path)