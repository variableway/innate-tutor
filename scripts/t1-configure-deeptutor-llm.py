#!/usr/bin/env python3
"""Configure DeepTutor single-user LLM catalog from root .env (no Embedding/KB)."""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
BASE = "http://127.0.0.1:8001"


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip()
    return out


def http_json(method: str, url: str, body=None, timeout: float = 60):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw) if raw else {}
        except Exception:
            payload = {"error": raw}
        return e.code, payload


def build_llm_only_catalog(api_key: str, base_url: str, model: str) -> dict:
    return {
        "version": 1,
        "services": {
            "llm": {
                "active_profile_id": "llm-profile-default",
                "active_model_id": "llm-model-default",
                "profiles": [
                    {
                        "id": "llm-profile-default",
                        "name": "Innate T1 MiniMax",
                        "binding": "openai",
                        "base_url": base_url.rstrip("/"),
                        "api_key": api_key,
                        "api_version": "",
                        "extra_headers": {},
                        "models": [
                            {
                                "id": "llm-model-default",
                                "name": model,
                                "model": model,
                            }
                        ],
                    }
                ],
            },
            "embedding": {
                "active_profile_id": None,
                "active_model_id": None,
                "profiles": [],
            },
            "search": {"active_profile_id": None, "profiles": []},
        },
    }


def main() -> int:
    env = load_env(ENV_PATH)
    api_key = env.get("LLM_API_KEY", "").strip()
    base_url = env.get("LLM_BASE_URL", "https://api.minimaxi.com/v1").strip()
    model = env.get("LLM_MODEL", "MiniMax-M3").strip()
    if not api_key:
        print("LLM_API_KEY missing in .env", file=sys.stderr)
        return 1

    st, health = http_json("GET", f"{BASE}/")
    print("health", st, health)
    if st != 200:
        return 1

    catalog = build_llm_only_catalog(api_key, base_url, model)
    st, put_body = http_json("PUT", f"{BASE}/api/v1/settings/catalog", {"catalog": catalog})
    print("put_catalog", st, "active", (put_body.get("catalog") or {}).get("services", {}).get("llm", {}).get("active_profile_id"))
    if st >= 400:
        print(put_body, file=sys.stderr)
        return 2

    st, apply_body = http_json("POST", f"{BASE}/api/v1/settings/apply", {"catalog": catalog})
    print("apply", st, apply_body.get("message"))
    if st >= 400:
        print(apply_body, file=sys.stderr)
        return 3

    st, opts = http_json("GET", f"{BASE}/api/v1/settings/llm-options")
    print("llm_options", st, opts if isinstance(opts, list) else str(opts)[:200])

    # Start LLM connectivity test (no embedding)
    # Connectivity test endpoint streams SSE; skip parsing here. WS smoke validates answers.
    st, test_start = http_json(
        "POST",
        f"{BASE}/api/v1/settings/tests/llm/start",
        {"catalog": catalog},
        timeout=120,
    )
    print("llm_test_start", st, "run_id", test_start.get("run_id"))

    masked = api_key[:4] + "****" + api_key[-4:] if len(api_key) >= 8 else "****"
    print(
        json.dumps(
            {
                "configured": True,
                "base_url": base_url,
                "model": model,
                "api_key": masked,
                "embedding": "disabled",
                "knowledge_bases": [],
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
