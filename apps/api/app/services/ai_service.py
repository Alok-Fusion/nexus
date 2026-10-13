from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.ai.provider import OllamaProvider
from app.models.page import Page, Block
from app.models.database import DatabaseModel, DatabaseRow, DatabaseCell
from app.schemas.ai import AIChatRequest, AIChatResponse, AIStatusResponse, AIActionPreview
import json
import re

ollama_provider = OllamaProvider()

class AIService:
    @staticmethod
    async def get_status() -> AIStatusResponse:
        status_dict = await ollama_provider.get_status()
        return AIStatusResponse(
            status=status_dict["status"],
            provider=status_dict["provider"],
            model=status_dict["model"],
            base_url=status_dict["base_url"],
            message=status_dict["message"]
        )

    @staticmethod
    async def chat(db: AsyncSession, workspace_id: str, request: AIChatRequest) -> AIChatResponse:
        status_dict = await ollama_provider.get_status()
        
        # Build workspace context
        context_text = ""
        sources = []
        
        if request.page_id:
            p_stmt = select(Page).where(Page.id == request.page_id)
            page = (await db.execute(p_stmt)).scalar_one_or_none()
            if page:
                b_stmt = select(Block).where(Block.page_id == page.id).order_by(Block.position)
                blocks = (await db.execute(b_stmt)).scalars().all()
                page_content = "\n".join([
                    f"- {b.type}: {b.content.get('text', '') if isinstance(b.content, dict) else ''}"
                    for b in blocks
                ])
                context_text += f"\nCurrent Open Page: '{page.title}'\n{page_content}\n"
                sources.append({"title": page.title, "url": f"/p/{page.id}"})
        else:
            # Gather top pages
            pages_stmt = select(Page).where(Page.workspace_id == workspace_id, Page.is_archived == False).limit(5)
            pages = (await db.execute(pages_stmt)).scalars().all()
            for p in pages:
                context_text += f"- Page: {p.title} (ID: {p.id})\n"
                sources.append({"title": p.title, "url": f"/p/{p.id}"})

        # If Ollama is offline, return honest offline status with guidance (No fake hallucination)
        if status_dict["status"] == "offline":
            return AIChatResponse(
                message=(
                    "Local AI runtime is currently offline. "
                    f"To enable AI workspace analysis, start Ollama locally (`ollama serve` and `ollama run {status_dict['model']}`). "
                    "All your pages, databases, search, and core workspace functions remain completely functional offline."
                ),
                suggested_actions=[],
                sources=sources,
                model_used=status_dict["model"],
                is_fallback=True
            )

        # Call local Ollama
        system_prompt = (
            "You are NEXUS AI, a private, local-first workspace assistant. "
            "Help the user organize knowledge, summarize documents, plan projects, and structure tasks. "
            "Use the provided workspace context. Be concise, direct, and intelligent."
        )
        full_prompt = f"Workspace Context:\n{context_text}\n\nUser Question:\n{request.prompt}"

        try:
            raw_response = await ollama_provider.generate(full_prompt, system=system_prompt)
            return AIChatResponse(
                message=raw_response,
                suggested_actions=[],
                sources=sources,
                model_used=status_dict["model"],
                is_fallback=False
            )
        except Exception as e:
            return AIChatResponse(
                message=f"Local AI encountered an error: {str(e)}. Core workspace functionality is unaffected.",
                suggested_actions=[],
                sources=sources,
                model_used=status_dict["model"],
                is_fallback=True
            )
