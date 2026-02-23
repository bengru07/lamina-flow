import os
import json

SETTINGS_FILE = "data/global_settings.json"

DEFAULT_SETTINGS = {
    "theme": "system",
    "language": "en",
    "suggestions": True,
    "sound_notifications": True,
    "chat_position": "left",
    "ai_providers": [
        {
            "name": "OpenAI",
            "service_type": "chatgpt",
            "api_key": "",
            "enabled": True
        },
        {
            "name": "Google",
            "service_type": "gemini",
            "api_key": "",
            "enabled": False
        },
        {
            "name": "Anthropic",
            "service_type": "claude",
            "api_key": "",
            "enabled": False
        }
    ],
    "telemetry": False
}


def _ensure_settings_exists():
    if not os.path.exists(os.path.dirname(SETTINGS_FILE)):
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)

    if not os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_SETTINGS, f, indent=2)


def get_all_settings():
    _ensure_settings_exists()
    with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def update_settings(new_settings: dict):
    current = get_all_settings()
    current.update(new_settings)

    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2)
    return current


def get_settings_schema():
    return [
        {
            "groupTitle": "Appearance",
            "items": [
                {
                    "id": "theme",
                    "label": "Theme",
                    "description": "Select how the interface looks to you.",
                    "type": "select",
                    "options": [
                        {"label": "Light", "value": "light"},
                        {"label": "Dark", "value": "dark"},
                        {"label": "System", "value": "system"}
                    ]
                }
            ]
        },
        {
            "groupTitle": "AI Configuration",
            "items": [
                {
                    "id": "ai_providers",
                    "label": "AI Service Providers",
                    "description": "Configure keys and services for node intelligence.",
                    "type": "textarea",
                    "placeholder": "JSON configuration for AI providers..."
                }
            ]
        },
        {
            "groupTitle": "General",
            "items": [
                {
                    "id": "suggestions",
                    "label": "Enable Suggestions",
                    "description": "Show smart node suggestions while building.",
                    "type": "toggle"
                },
                {
                    "id": "chat_position",
                    "label": "Chat Position",
                    "description": "Where the help chat bubble should appear.",
                    "type": "select",
                    "options": [
                        {"label": "Left", "value": "left"},
                        {"label": "Right", "value": "right"}
                    ]
                }
            ]
        }
    ]