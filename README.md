# NEXUS ⚡
### Local-First AI-Native Sovereign Workspace

---

## 0. Overview
**NEXUS** is an offline-first, AI-native productivity and knowledge workspace. It blends the structural block flexibility of Notion, the keyboard-first speed and density of Linear, and the sovereign, local-first graph philosophy of Obsidian.

100% of your documents, relational databases, full-text search indexes, attachments, and AI inferences run on your local machine with **zero external cloud API dependencies**.

---

## 1. Quick Start (Zero-Friction Local Boot)

### Prerequisites
- Node.js 18+ (tested with Node 22)
- Python 3.10+
- (Optional) Docker for PostgreSQL 16 containerization
- (Optional) Ollama for local LLM inference

### Single-Command Start (Windows CMD or PowerShell)
In **Command Prompt (CMD)**:
```cmd
run_local.bat
```
or
```cmd
npm start
```

In **PowerShell**:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run_local.ps1
```

### Manual Step-by-Step Start
1. **Initialize Backend**:
   ```bash
   cd apps/api
   python -m venv .venv
   .\.venv\Scripts\pip install -r requirements.txt
   cd ../..
   ```

2. **Seed Local Database & Workspace**:
   ```bash
   .\apps\api\.venv\Scripts\python scripts/seed_data.py
   ```

3. **Start FastAPI Backend (Port 8000)**:
   ```bash
   .\apps\api\.venv\Scripts\uvicorn app.main:app --port 8000 --app-dir apps/api --reload
   ```

4. **Start Next.js Frontend (Port 3000)**:
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

5. **Open NEXUS**:
   Navigate to [http://localhost:3000](http://localhost:3000).
   - Demo User: `alex@nexus.local`
   - Demo Password: `nexus123` (or click "Quick Launch Demo Workspace")

---

## 2. Universal Keyboard Navigation & Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Cmd/Ctrl + K` | Universal Command Center & Hybrid Search | Global |
| `Cmd/Ctrl + Shift + Space` | Quick Capture Modal (Note / Task / Idea) | Global |
| `/` | Trigger Slash Block Inserter Menu | Document Canvas |
| `Cmd/Ctrl + Z` / `Cmd/Ctrl + Shift + Z` | Undo / Redo mutations | Editor |
| `Cmd/Ctrl + Enter` | Toggle To-Do check | Editor |
| `ESC` | Dismiss modals and active popovers | Global |

---

## 3. Architecture & Monorepo Structure

```
nexus/
├── apps/
│   ├── api/                      # FastAPI Modular Monolith (Python 3.10+)
│   │   ├── app/
│   │   │   ├── core/             # Argon2 Security, JWT, Pydantic Settings
│   │   │   ├── db/               # Async SQLAlchemy Engine & SessionMaker
│   │   │   ├── models/           # User, Workspace, Page, Block, Database, Cell
│   │   │   ├── schemas/          # Pydantic V2 DTOs
│   │   │   ├── services/         # Fractional Indexing, Auth, Page, Database, Search, AI
│   │   │   ├── ai/               # LocalAIProvider interface & Ollama client
│   │   │   └── api/v1/           # REST endpoints
│   │   └── requirements.txt
│   │
│   └── web/                      # Next.js 14 App Router (TypeScript + Tailwind)
│       ├── app/                  # Dashboard (/), Page Canvas (/p/[id]), Database (/d/[id]), Login (/login)
│       ├── components/           # Sidebar, DocumentEditor, DatabaseView, CommandPalette, AIAssistant
│       └── lib/                  # Typed API client & Lexorank utilities
│
├── data/                         # Local Persistent Filesystem
│   ├── nexus.db                  # Local SQLite Database (or PostgreSQL via Docker)
│   ├── uploads/                  # Local attachments
│   └── backups/                  # Local snapshots
│
├── scripts/
│   ├── seed_data.py              # Realistic sample workspace seeder
│   └── run_local.ps1             # Local startup orchestrator
│
├── docker-compose.yml            # PostgreSQL 16 + pgvector containerized deployment
└── README.md
```

---

## 4. Local AI Runtime Integration (Ollama)

NEXUS contains an agnostic `AIProvider` contract. If Ollama is offline or uninstalled, NEXUS continues functioning 100% normally without crashing or generating fake hallucinations.

To enable local AI synthesis and workspace Q&A:
1. Install [Ollama](https://ollama.ai).
2. Pull the default model:
   ```bash
   ollama run llama3:8b
   ```
3. NEXUS automatically detects the local instance at `http://localhost:11434` and enables live streaming and workspace RAG!
"# nexus" 
