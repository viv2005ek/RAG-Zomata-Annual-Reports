# 🎨 Eternal RAG — Frontend Application

High-performance, dark-mode financial terminal UI built with **React 19**, **Vite**, and **Zustand** for interacting with the Eternal Ltd Annual Report RAG intelligence engine.

---

## 🌟 Key Features

* **Real-Time Server-Sent Events (SSE)**: Streams tokens with sub-second Time to First Token (TTFT).
* **Audited Synthesis & Visual Verification**: Every factual statement is backed by interactive citation chips (e.g. `Doc B · p.176`).
* **Interactive InfoRail Drawer**: Clicking any citation chip opens a slide-out audit drawer displaying the original text excerpt, page number, and document metadata.
* **Dynamic Pipeline Stepper & Timeline**: Live 5-stage horizontal visualizer (`Retrieval` -> `Reranking` -> `Context Assembly` -> `Generation` -> `Verification`) that can expand into an audited execution timeline.
* **4 Specialized Response Cards**:
  * `AnswerCard`: Rich markdown with sticky-header striped tables, citation chips, copy utilities, and regenerate options.
  * `ClarificationCard`: 2-column option chips with inline custom question prompt.
  * `NotFoundCard`: Clean out-of-scope disclosure with rephrase prompts.
  * `BlockedCard`: Security interceptor for injection attempts or adversarial prompts.
* **Obsidian & Emerald Design System**: Sleek `#0B0F12` background, deep `#11161B` glassmorphism panels, and emerald `#10B981` status accents with Google Fonts (*Space Grotesk*, *Inter*, *JetBrains Mono*).

---

## 🚀 Quick Start

### 1. Installation
```bash
cd frontend
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Set the API gateway URL:
```env
# Point to your local FastAPI backend (default) or production backend URL
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```
Generates an optimized, tree-shaken static bundle in `frontend/dist/`.

---

## 📂 Architecture & Directory Structure

```
frontend/
├── src/
│   ├── App.jsx                     # Application root shell
│   ├── index.css                   # Global typography, animations & scrollbar tokens
│   ├── components/
│   │   ├── chat/                   # Core chat experience
│   │   │   ├── ChatWindow.jsx      # Streaming coordinator & message thread
│   │   │   ├── Composer.jsx        # Multi-line input with auto-resize & keyboard shortcuts
│   │   │   ├── EmptyState.jsx      # Hero landing state with suggested starter prompts
│   │   │   ├── Message.jsx         # Message routing container
│   │   │   ├── MessageList.jsx     # Virtualized/scrolling message history
│   │   │   └── ScrollAnchor.jsx    # Smooth jump-to-latest anchor
│   │   ├── layout/
│   │   │   ├── AppShell.jsx        # Responsive sidebar, chat view, and drawer layout
│   │   │   ├── InfoRail.jsx        # Slide-out citation & source chunk audit drawer
│   │   │   └── Sidebar.jsx         # Conversation history & document quick-links
│   │   ├── messages/               # Adaptive response cards
│   │   │   ├── AnswerCard.jsx      # Markdown answer with citation badges & action bar
│   │   │   ├── BlockedCard.jsx     # Guardrail block alert with reason disclosure
│   │   │   ├── ClarificationCard.jsx # Multi-turn disambiguation chips
│   │   │   ├── MessageToolbar.jsx  # Copy, regenerate, and feedback actions
│   │   │   ├── NotFoundCard.jsx    # Missing data disclosure card
│   │   │   └── SourcesRow.jsx      # Clickable citation chip list
│   │   ├── pipeline/               # RAG execution transparency
│   │   │   ├── Stepper.jsx         # Horizontal 5-stage progress indicator
│   │   │   └── Timeline.jsx        # Detailed vertical audit trail with latencies
│   │   └── ui/                     # Primitives (Badge, Icon, Tooltip)
│   ├── lib/
│   │   ├── api.js                  # Fetch client & SSE event stream parser
│   │   └── formatting.js           # Currency, percentage, and text formatters
│   ├── store/
│   │   ├── useChatStore.js         # Zustand thread management & streaming state
│   │   └── useSettingsStore.js     # UI preferences & drawer state
│   └── styles/
│       ├── markdown.css            # Custom CSS for tables, code blocks, and blockquotes
│       └── theme.css               # Color tokens and glassmorphism definitions
├── public/                         # Icons & static SVG assets
├── index.html                      # HTML5 entrypoint with Google Fonts
├── vite.config.js                  # Vite configuration & dev proxy
└── package.json                    # Dependencies & scripts
```

---

## 📡 SSE Streaming Contract

The frontend consumes streaming updates from `POST /api/chat/stream`:

| Event | Payload | Frontend Action |
|---|---|---|
| `event: stage` | `{"id":"retrieval","status":"running\|done","durationMs":180}` | Updates the pipeline stepper/timeline in real time. |
| `event: token` | `{"delta":" word"}` | Appends incoming token to the active streaming bubble. |
| `event: meta` | `{"kind":"answer","citations":[...],"chunksUsed":[...]}` | Attaches verified citations, follow-ups, and source chunks. |
| `event: done` | `{}` | Finalizes the assistant message and commits to persistent thread state. |
