# GitHub Repository RAG Microservice

A production-grade AI microservice for semantic code search and Q&A over GitHub repositories.

## Features

- 🔍 **Semantic Code Search**: Ingest and understand large codebases
- 🤖 **RAG-based Q&A**: Answer questions about code using retrieval-augmented generation
- 📦 **Incremental Processing**: Cache-aware, memory-safe ingestion
- 🚀 **Scalable**: Built with Pinecone for vector storage and Redis for caching
- 🔌 **Pluggable**: Easy to swap LLM providers

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express
- **Vector Database**: Pinecone
- **Cache**: In-memory (local storage)
- **LLM**: Groq (llama3-70b-8192)
- **Embeddings**: Xenova/all-MiniLM-L6-v2 (local)

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Express API Layer           │
│  /ingest  /query  /status  /health  │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│   Service   │ │   Service   │
│   Layer     │ │   Layer     │
│             │ │             │
│  - Ingest   │ │  - Query    │
│  - Chunk    │ │  - RAG      │
│  - Embed    │ │  - Search   │
└──────┬──────┘ └──────┬──────┘
       │               │
       ▼               ▼
┌─────────────────────────────────────┐
│         Storage Layer               │
│                                     │
│  ┌──────────┐  ┌────────┐  ┌─────┐│
│  │ Pinecone │  │ Redis  │  │Disk ││
│  │ (Vector) │  │(Cache) │  │Cache││
│  └──────────┘  └────────┘  └─────┘│
└─────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Pinecone account
- Groq API key

Note: Redis is not required - the app uses in-memory cache

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=github-code-search

# Storage
CACHE_DIR=./cache
MAX_FILE_SIZE_MB=10
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

Note: Redis is not needed - uses in-memory cache

### Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Documentation

### POST /api/v1/ingest

Ingest a GitHub repository.

**Request:**
```json
{
  "repoUrl": "https://github.com/user/repo",
  "branch": "main"
}
```

**Response:**
```json
{
  "jobId": "uuid",
  "status": "processing",
  "repoId": "user/repo"
}
```

### POST /api/v1/query

Query a repository using RAG.

**Request:**
```json
{
  "repoId": "user/repo",
  "query": "How does authentication work?",
  "scope": {
    "type": "folder",
    "path": "src/auth"
  },
  "topK": 5
}
```

**Response:**
```json
{
  "answer": "Authentication is handled by...",
  "sources": [
    {
      "file": "src/auth/middleware.ts",
      "chunk": "...",
      "score": 0.92
    }
  ],
  "metadata": {
    "tokensUsed": 1500,
    "latencyMs": 850
  }
}
```

### GET /api/v1/status/:jobId

Check ingestion job status.

### GET /health

Health check endpoint.

## Project Structure

```
src/
├── config/           # Configuration management
├── controllers/      # Request handlers
├── services/         # Business logic
│   ├── ingestion/   # Repository ingestion
│   ├── embedding/   # Embedding generation
│   ├── chunking/    # Code chunking
│   └── rag/         # RAG query engine
├── repositories/     # Data access layer
├── models/          # TypeScript types
├── middleware/      # Express middleware
├── utils/           # Utilities
└── server.ts        # Entry point
```

## Deployment

### Deploy to Render

The easiest way to deploy this service is using Render:

1. **Push your code to Git** (GitHub, GitLab, or Bitbucket)

2. **Deploy using Blueprint**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your repository
   - Render will automatically detect `render.yaml`
   - Set your API keys (GROQ_API_KEY, PINECONE_API_KEY, PINECONE_ENVIRONMENT)
   - Click "Apply"

3. **Create Pinecone Index**:
   ```bash
   # Dimensions: 384 (for Xenova/all-MiniLM-L6-v2)
   # Metric: cosine
   ```

4. **Test your deployment**:
   ```bash
   curl https://your-app.onrender.com/api/v1/health
   ```

📖 **Full deployment guide**: See [docs/RENDER_DEPLOYMENT.md](docs/RENDER_DEPLOYMENT.md)

### Other Deployment Options

- **Docker**: `docker-compose up -d`
- **AWS ECS**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Google Cloud Run**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Kubernetes**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Development

```bash
# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run type-check
```
