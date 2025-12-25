# Quick Start Example

This guide will walk you through ingesting a repository and querying it.

## Prerequisites

Make sure the service is running:

```bash
npm run dev
# or
docker-compose up
```

## Step 1: Ingest a Repository

Let's ingest the Express.js repository as an example:

```bash
curl -X POST http://localhost:3000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/expressjs/express",
    "branch": "master"
  }'
```

Response:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "repoId": "expressjs/express",
  "message": "Ingestion started"
}
```

## Step 2: Check Ingestion Status

Use the `jobId` from the previous response:

```bash
curl http://localhost:3000/api/v1/status/550e8400-e29b-41d4-a716-446655440000
```

Response:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "repoId": "expressjs/express",
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

Wait until `status` is `"completed"` before querying.

## Step 3: Query the Repository

Now you can ask questions about the code:

### Example 1: General Question

```bash
curl -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "repoId": "expressjs/express",
    "query": "How does middleware work in Express?",
    "topK": 5
  }'
```

### Example 2: Scoped to a Folder

```bash
curl -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "repoId": "expressjs/express",
    "query": "How are routes defined?",
    "scope": {
      "type": "folder",
      "path": "lib"
    },
    "topK": 5
  }'
```

### Example 3: Specific File

```bash
curl -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "repoId": "expressjs/express",
    "query": "What does this file do?",
    "scope": {
      "type": "file",
      "path": "lib/application.js"
    },
    "topK": 3
  }'
```

Response:
```json
{
  "answer": "Express middleware works by creating a chain of functions...",
  "sources": [
    {
      "file": "lib/application.js",
      "chunk": "app.use = function use(fn) {...",
      "score": 0.92,
      "startLine": 186,
      "endLine": 220,
      "language": "javascript"
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

## Step 4: Try Your Own Repository

```bash
curl -X POST http://localhost:3000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/YOUR_USERNAME/YOUR_REPO",
    "branch": "main"
  }'
```

## Using JavaScript/TypeScript

```typescript
const API_BASE = 'http://localhost:3000/api/v1';

async function main() {
  // 1. Start ingestion
  const ingestResponse = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repoUrl: 'https://github.com/expressjs/express',
      branch: 'master',
    }),
  });
  const { jobId, repoId } = await ingestResponse.json();
  console.log('Job started:', jobId);

  // 2. Wait for completion
  let status = 'processing';
  while (status !== 'completed' && status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
    
    const statusResponse = await fetch(`${API_BASE}/status/${jobId}`);
    const jobStatus = await statusResponse.json();
    status = jobStatus.status;
    console.log(`Progress: ${jobStatus.progress}%`);
  }

  if (status === 'failed') {
    console.error('Ingestion failed');
    return;
  }

  console.log('Ingestion completed!');

  // 3. Query the repository
  const queryResponse = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repoId,
      query: 'How does middleware work?',
      topK: 5,
    }),
  });
  const result = await queryResponse.json();
  
  console.log('Answer:', result.answer);
  console.log('\nSources:');
  result.sources.forEach((source, i) => {
    console.log(`${i + 1}. ${source.file} (lines ${source.startLine}-${source.endLine})`);
  });
}

main();
```

## Using Python

```python
import requests
import time

API_BASE = 'http://localhost:3000/api/v1'

# 1. Start ingestion
response = requests.post(f'{API_BASE}/ingest', json={
    'repoUrl': 'https://github.com/expressjs/express',
    'branch': 'master'
})
data = response.json()
job_id = data['jobId']
repo_id = data['repoId']
print(f'Job started: {job_id}')

# 2. Wait for completion
status = 'processing'
while status not in ['completed', 'failed']:
    time.sleep(5)
    response = requests.get(f'{API_BASE}/status/{job_id}')
    job_status = response.json()
    status = job_status['status']
    print(f"Progress: {job_status['progress']}%")

if status == 'failed':
    print('Ingestion failed')
    exit(1)

print('Ingestion completed!')

# 3. Query the repository
response = requests.post(f'{API_BASE}/query', json={
    'repoId': repo_id,
    'query': 'How does middleware work?',
    'topK': 5
})
result = response.json()

print(f"\nAnswer: {result['answer']}")
print("\nSources:")
for i, source in enumerate(result['sources'], 1):
    print(f"{i}. {source['file']} (lines {source['startLine']}-{source['endLine']})")
```

## Common Queries to Try

1. **Architecture**: "What is the overall architecture of this codebase?"
2. **Authentication**: "How does authentication work?"
3. **Database**: "How is the database accessed?"
4. **API Endpoints**: "What API endpoints are available?"
5. **Error Handling**: "How are errors handled?"
6. **Testing**: "How is testing set up?"
7. **Configuration**: "How is the application configured?"
8. **Specific Feature**: "How does [feature name] work?"

## Tips for Better Results

1. **Be Specific**: Ask targeted questions about specific functionality
2. **Use Scope**: Narrow down to relevant folders or files
3. **Adjust topK**: Increase for broader context, decrease for focused answers
4. **Adjust minScore**: Lower for more results, higher for more precise matches
5. **Iterate**: Refine your query based on the initial results

## Cleanup

To delete a repository and free up resources:

```bash
curl -X DELETE http://localhost:3000/api/v1/repo/expressjs/express
```

## Next Steps

- Read the [API Documentation](./API.md)
- Explore the [Architecture](./ARCHITECTURE.md)
- Check the [Deployment Guide](./DEPLOYMENT.md)
