# API Usage Guide

## Getting Started

### 1. Set up environment variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `PINECONE_API_KEY`: Your Pinecone API key
- `PINECONE_ENVIRONMENT`: Your Pinecone environment (e.g., `us-east-1-aws`)

### 2. Install dependencies

```bash
npm install
```

### 3. Start Redis

Make sure Redis is running locally:

```bash
# On Windows with WSL
wsl redis-server

# On macOS with Homebrew
brew services start redis

# On Linux
sudo systemctl start redis
```

### 4. Run the service

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check

**GET** `/api/v1/health`

Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "redis": "up",
    "pinecone": "up"
  }
}
```

### Ingest Repository

**POST** `/api/v1/ingest`

Start ingesting a GitHub repository.

**Request Body:**
```json
{
  "repoUrl": "https://github.com/username/repository",
  "branch": "main"
}
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "repoId": "username/repository",
  "message": "Ingestion started"
}
```

### Check Ingestion Status

**GET** `/api/v1/status/:jobId`

Check the status of an ingestion job.

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "repoId": "username/repository",
  "status": "completed",
  "progress": 100,
  "startedAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:05:00.000Z",
  "stats": {
    "filesProcessed": 150,
    "chunksCreated": 450,
    "embeddingsGenerated": 450,
    "tokensUsed": 125000,
    "durationMs": 300000
  }
}
```

### Query Repository

**POST** `/api/v1/query`

Ask questions about a repository using RAG.

**Request Body:**
```json
{
  "repoId": "username/repository",
  "query": "How does authentication work in this codebase?",
  "scope": {
    "type": "folder",
    "path": "src/auth"
  },
  "topK": 5,
  "minScore": 0.7
}
```

**Parameters:**
- `repoId` (required): Repository identifier (owner/repo)
- `query` (required): Your question
- `scope` (optional): Limit search to specific folder or file
  - `type`: "repo", "folder", or "file"
  - `path`: Path within repository (for folder/file scope)
- `topK` (optional): Number of chunks to retrieve (default: 5, max: 20)
- `minScore` (optional): Minimum similarity score (default: 0.7, range: 0-1)

**Response:**
```json
{
  "answer": "Authentication in this codebase is handled by...",
  "sources": [
    {
      "file": "src/auth/middleware.ts",
      "chunk": "export function authenticate(req, res, next) {...",
      "score": 0.92,
      "startLine": 15,
      "endLine": 45,
      "language": "typescript"
    }
  ],
  "metadata": {
    "tokensUsed": 1500,
    "latencyMs": 850,
    "model": "gpt-4-turbo-preview",
    "retrievedChunks": 5
  }
}
```

### Delete Repository

**DELETE** `/api/v1/repo/:repoId`

Delete a repository and all its data.

**Response:**
```json
{
  "message": "Repository deleted successfully",
  "repoId": "username/repository"
}
```

## Example Usage

### Using cURL

```bash
# Ingest a repository
curl -X POST http://localhost:3000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/expressjs/express",
    "branch": "master"
  }'

# Check status
curl http://localhost:3000/api/v1/status/YOUR_JOB_ID

# Query the repository
curl -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "repoId": "expressjs/express",
    "query": "How does middleware work?",
    "topK": 5
  }'
```

### Using JavaScript/TypeScript

```typescript
const API_BASE = 'http://localhost:3000/api/v1';

// Ingest repository
async function ingestRepo(repoUrl: string) {
  const response = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl, branch: 'main' }),
  });
  return response.json();
}

// Query repository
async function queryRepo(repoId: string, query: string) {
  const response = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoId, query }),
  });
  return response.json();
}

// Usage
const job = await ingestRepo('https://github.com/user/repo');
console.log('Job ID:', job.jobId);

// Wait for ingestion to complete, then query
const result = await queryRepo('user/repo', 'How does X work?');
console.log('Answer:', result.answer);
```

## Best Practices

1. **Wait for ingestion to complete** before querying
2. **Use specific scopes** to improve query accuracy and speed
3. **Adjust topK and minScore** based on your needs:
   - Higher `topK` for broader context
   - Higher `minScore` for more precise matches
4. **Monitor job status** for large repositories
5. **Handle rate limits** appropriately

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

Common status codes:
- `400`: Bad request (validation error)
- `404`: Resource not found
- `429`: Too many requests (rate limited)
- `500`: Internal server error
- `503`: Service unavailable
