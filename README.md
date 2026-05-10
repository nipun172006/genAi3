# 📓 NotebookLM RAG Clone

A full-stack **Retrieval-Augmented Generation (RAG)** application that lets you upload PDF documents and ask questions about them. The AI answers exclusively from the content of your uploaded documents — no hallucination.

---

## 🏗️ Architecture

```
Frontend (React + Vite)
        ↓  HTTP (Axios)
Backend API (Node.js + Express)
        ↓  PDF Parsing & Chunking (LangChain)
HuggingFace Inference API (Embeddings)
        ↓  Vector Storage
Qdrant Cloud (Vector Database)
        ↑  Similarity Search
Groq API (LLM — llama-3.3-70b-versatile)
        ↓
Grounded Answer returned to User
```

---

## 🚀 RAG Pipeline

The application implements a complete 4-step RAG pipeline:

1. **Chunking** — Uploaded PDFs are parsed and split into overlapping 1000-character chunks using `RecursiveCharacterTextSplitter` (200-character overlap) to preserve context.

2. **Embedding** — Each chunk is converted into a 384-dimensional vector using HuggingFace's `sentence-transformers/all-MiniLM-L6-v2` model.

3. **Retrieval** — On a user query, the question is embedded and the top 6 most semantically similar chunks are retrieved from Qdrant via cosine similarity search.

4. **Generation** — The retrieved chunks + the user's question are sent to `llama-3.3-70b-versatile` via the Groq API. A strict system prompt ensures the model answers only from the provided context, preventing hallucination.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Axios |
| Backend | Node.js, Express, Multer |
| PDF Parsing | LangChain Community (`PDFLoader`) |
| Chunking | LangChain (`RecursiveCharacterTextSplitter`) |
| Embeddings | HuggingFace Inference API (`all-MiniLM-L6-v2`) |
| Vector DB | Qdrant Cloud |
| LLM | Groq API (`llama-3.3-70b-versatile`) |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- A free [Groq API Key](https://console.groq.com)
- A free [HuggingFace Token](https://huggingface.co/settings/tokens) (with Inference permissions)
- A free [Qdrant Cloud](https://cloud.qdrant.io) cluster

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```env
PORT=5001
GROQ_API_KEY=your_groq_api_key
HUGGINGFACE_API_KEY=your_hf_token
QDRANT_URL=your_qdrant_cluster_url
QDRANT_API_KEY=your_qdrant_api_key
```

```bash
node server.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
genAi3/
├── backend/
│   ├── utils/
│   │   ├── pdfParser.js      # PDF text extraction using LangChain PDFLoader
│   │   ├── chunker.js        # Text splitting with RecursiveCharacterTextSplitter
│   │   ├── vectorStore.js    # HuggingFace embeddings + Qdrant storage
│   │   ├── retriever.js      # Semantic similarity search from Qdrant
│   │   └── generator.js      # Groq LLM answer generation with grounded prompt
│   ├── uploads/              # Temporary PDF storage
│   ├── server.js             # Express API server (upload + ask routes)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx           # Main React component (upload + chat UI)
    │   └── App.css           # Premium dark theme styles
    └── package.json
```

---

## 🔑 Key Design Decisions

- **Hallucination Prevention**: The system prompt strictly instructs the LLM to answer only from provided context. If no relevant content is found, it responds: *"I could not find this in the uploaded document."*
- **Multi-PDF Support**: Up to 25 PDFs can be uploaded simultaneously. All chunks are stored in the same Qdrant collection, enabling cross-document retrieval.
- **Chunk Overlap**: A 200-character overlap between chunks prevents important information from being lost at chunk boundaries.
