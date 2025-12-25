# Architecture Overview

## System Design

The GitHub RAG Microservice is designed as a production-grade, scalable system for semantic code search and Q&A over large repositories.

### Core Principles

1. **Incremental Processing**: Process files one at a time to avoid memory issues
2. **Cache-Aware**: Use Redis and disk caching to avoid redundant processing
3. **Memory-Safe**: Stream processing, no full-repo loading into memory
4. **Scalable**: Pinecone for distributed vector storage
5. **Fault-Tolerant**: Comprehensive error handling and retry logic

## Architecture Layers

### 1. API Layer (`src/server.ts`, `src/routes/`)

**Responsibilities:**
- HTTP request handling
- Request validation
- Rate limiting
- Authentication (future)
- Response formatting

**Technologies:**
- Express.js for HTTP server
- Helmet for security headers
- CORS for cross-origin requests
- Rate limiting middleware

### 2. Controller Layer (`src/controllers/`)

**Responsibilities:**
- Request/response transformation
- Input validation
- Calling service layer
- Error handling

**Controllers:**
- `ingestionController`: Handle repository ingestion
- `queryController`: Handle RAG queries
- `healthController`: Health checks and stats

### 3. Service Layer (`src/services/`)

**Responsibilities:**
- Business logic
- Orchestration of multiple operations
- Data transformation

**Services:**

#### IngestionService
- Orchestrates the entire ingestion pipeline
- Manages job state and progress
- Coordinates Git, Chunking, Embedding, and Vector Store services

#### GitService
- Clone repositories with shallow cloning (depth=1)
- Pull updates
- Manage local repository cache
- Calculate repository size

#### ChunkingService
- Semantic code chunking
- Language-aware block detection
- Fallback to simple line-based chunking
- Configurable chunk size and overlap

#### EmbeddingService
- Generate embeddings using OpenAI
- Batch processing for efficiency
- Retry logic with exponential backoff
- Rate limiting

#### VectorStoreService
- Pinecone index management
- Vector upsert in batches
- Semantic search
- Metadata filtering

#### RAGService
- Query embedding generation
- Semantic search
- Context building
- Answer generation using GPT-4
- Source reference tracking

#### CacheService
- Redis connection management
- Key-value caching
- Hash operations
- Set operations
- TTL management

### 4. Data Layer

**Pinecone (Vector Database):**
- Stores embeddings with metadata
- Enables semantic search
- Scalable and distributed
- Metadata filtering for scoped queries

**Redis (Cache):**
- Job state management
- Repository metadata
- Temporary data storage
- Fast lookups

**Local Disk:**
- Cloned repositories
- Temporary file storage
- Configurable cache directory

## Data Flow

### Ingestion Flow

```
1. API receives ingest request
   ↓
2. Create job and return job ID
   ↓
3. Clone repository (GitService)
   ↓
4. Walk directory tree
   ↓
5. For each file:
   - Check if should process (not binary, not ignored)
   - Read file content
   - Chunk file (ChunkingService)
   ↓
6. Batch chunks
   ↓
7. Generate embeddings (EmbeddingService)
   ↓
8. Upsert to Pinecone (VectorStoreService)
   ↓
9. Update job status and stats
```

### Query Flow

```
1. API receives query request
   ↓
2. Generate query embedding (EmbeddingService)
   ↓
3. Build metadata filter (scope)
   ↓
4. Search Pinecone (VectorStoreService)
   ↓
5. Filter by minimum score
   ↓
6. Build context from top results
   ↓
7. Generate answer (RAGService + GPT-4)
   ↓
8. Return answer with sources
```

## Scalability Considerations

### Memory Management

- **Streaming**: Files processed one at a time
- **Batching**: Embeddings generated in batches
- **Limits**: Configurable max file size and repo size
- **Cleanup**: Automatic cleanup of old repositories

### Performance Optimization

- **Shallow Cloning**: Git depth=1 for faster clones
- **Parallel Processing**: Batch embedding generation
- **Caching**: Redis for frequently accessed data
- **Indexing**: Pinecone for fast semantic search

### Horizontal Scaling

The service is designed to be stateless (except for Redis and Pinecone):

- **Multiple Instances**: Can run multiple API servers
- **Load Balancer**: Distribute requests across instances
- **Shared State**: Redis and Pinecone shared across instances
- **Job Queue**: Future enhancement for distributed job processing

## Error Handling

### Retry Logic

- **Embedding Generation**: 3 retries with exponential backoff
- **Git Operations**: Automatic retry on network errors
- **Pinecone Operations**: Built-in retry in SDK

### Graceful Degradation

- **Partial Failures**: Continue processing other files if one fails
- **Job Recovery**: Jobs can be resumed from last checkpoint
- **Health Checks**: Monitor service dependencies

## Security

### Current Implementation

- **Helmet**: Security headers
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Zod schemas
- **Error Sanitization**: Don't leak internal details

### Future Enhancements

- API key authentication
- User-based rate limiting
- Repository access control
- Audit logging

## Monitoring

### Logging

- **Pino**: Structured JSON logging
- **Request Logging**: All HTTP requests
- **Error Logging**: Detailed error context
- **Performance Logging**: Timing information

### Metrics (Future)

- Request latency
- Embedding generation time
- Vector search performance
- Cache hit rates
- Job completion rates

## Configuration

All configuration is environment-based:

- **Server**: Port, environment
- **OpenAI**: API key, models
- **Pinecone**: API key, index name
- **Redis**: Connection details
- **Storage**: Limits and paths
- **Chunking**: Size and overlap
- **Rate Limiting**: Window and max requests

## Testing Strategy

### Unit Tests

- Service layer logic
- Utility functions
- Validation schemas

### Integration Tests

- API endpoints
- Service integration
- Database operations

### End-to-End Tests

- Full ingestion flow
- Query flow
- Error scenarios

## Deployment

### Prerequisites

- Node.js 18+
- Redis server
- Pinecone account
- OpenAI API key

### Environment

- Development: Local with hot reload
- Staging: Docker container
- Production: Kubernetes or cloud platform

### CI/CD

1. Lint and type check
2. Run tests
3. Build TypeScript
4. Build Docker image
5. Deploy to environment

## Future Enhancements

1. **Authentication**: API key or OAuth
2. **Job Queue**: Bull or BullMQ for distributed jobs
3. **Webhooks**: Notify on job completion
4. **Incremental Updates**: Only process changed files
5. **Multi-Language Support**: More embedding models
6. **Advanced Chunking**: AST-based chunking
7. **Caching**: Cache embeddings for unchanged files
8. **Metrics**: Prometheus metrics
9. **Tracing**: OpenTelemetry integration
10. **Admin UI**: Monitor jobs and repositories
