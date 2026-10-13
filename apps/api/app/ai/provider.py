from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

class AIProvider(ABC):
    @abstractmethod
    async def get_status(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def generate(self, prompt: str, system: Optional[str] = None) -> str:
        pass


class OllamaProvider(AIProvider):
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.LOCAL_LLM_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def get_status(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    models = res.json().get("models", [])
                    model_names = [m.get("name") for m in models]
                    return {
                        "status": "connected",
                        "provider": "Ollama",
                        "model": self.model,
                        "base_url": self.base_url,
                        "available_models": model_names,
                        "message": f"Connected to local Ollama runtime ({len(models)} models found)."
                    }
        except Exception as e:
            pass

        return {
            "status": "offline",
            "provider": "Ollama",
            "model": self.model,
            "base_url": self.base_url,
            "available_models": [],
            "message": "Local AI runtime (Ollama) is currently unreachable on localhost:11434. NEXUS workspace remains fully functional offline."
        }

    async def generate(self, prompt: str, system: Optional[str] = None) -> str:
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }
            if system:
                payload["system"] = system
            res = await client.post(f"{self.base_url}/api/generate", json=payload)
            res.raise_for_status()
            return res.json().get("response", "")
