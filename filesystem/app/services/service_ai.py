from typing import List

import httpx
import json
from app.services import service_settings as settings_service
from app.services import service_workspace as workspace_service


async def process_ai_query(prompt: str, provider_id: str, workspace_ids: List[str]):
    settings = settings_service.get_all_settings()
    providers = settings.get("ai_providers", [])

    provider = next((p for p in providers if p.get("id") == provider_id), None)
    if not provider or not provider.get("enabled"):
        raise ValueError("Selected AI provider is disabled or not found")

    context_data = ""
    if workspace_ids:
        context_data = _assemble_context(workspace_ids)

    full_prompt = f"Context from projects:\n{context_data}\n\nUser Query: {prompt}"

    service_type = provider.get("service_type")
    api_key = provider.get("api_key")

    if service_type == "chatgpt":
        return await _call_openai(api_key, full_prompt)
    elif service_type == "gemini":
        return await _call_gemini(api_key, full_prompt)
    elif service_type == "claude":
        return await _call_claude(api_key, full_prompt)
    elif service_type == "ollama":
        return await _call_ollama(provider.get("base_url", "http://localhost:11434"), full_prompt)
    elif service_type == "custom_api":
        return await _call_custom_api(provider.get("endpoint_url"), api_key, full_prompt)
    else:
        raise ValueError(f"Unsupported service type: {service_type}")


def _assemble_context(workspace_ids: List[str]) -> str:
    combined_context = []
    for wid in workspace_ids:
        try:
            meta = workspace_service.get_workspace(wid)
            tree = workspace_service.list_project_tree(wid)
            combined_context.append(f"Project: {meta.get('name')}\nStructure: {json.dumps(tree)}")
        except:
            continue
    return "\n---\n".join(combined_context)


async def _call_openai(api_key: str, prompt: str):
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "gpt-4-turbo",
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=60.0
        )
        return res.json()["choices"][0]["message"]["content"]


async def _call_gemini(api_key: str, prompt: str):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={api_key}"
    async with httpx.AsyncClient() as client:
        res = await client.post(
            url,
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=60.0
        )
        return res.json()["candidates"][0]["content"]["parts"][0]["text"]


async def _call_claude(api_key: str, prompt: str):
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-3-opus-20240229",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=60.0
        )
        return res.json()["content"][0]["text"]


async def _call_ollama(base_url: str, prompt: str):
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{base_url}/api/generate",
            json={"model": "llama3", "prompt": prompt, "stream": False},
            timeout=120.0
        )
        return res.json()["response"]


async def _call_custom_api(url: str, api_key: str, prompt: str):
    if not url:
        raise ValueError("Custom API URL is missing")
    async with httpx.AsyncClient() as client:
        res = await client.post(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            json={"prompt": prompt},
            timeout=60.0
        )
        return res.text