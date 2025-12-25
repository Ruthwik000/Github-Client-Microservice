# Deployment Guide

## Local Development

### Prerequisites

- Node.js 18 or higher
- Redis server
- Git
- OpenAI API key
- Pinecone account

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd github-rag-microservice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

4. **Start Redis**
   ```bash
   # Windows (WSL)
   wsl redis-server
   
   # macOS
   brew services start redis
   
   # Linux
   sudo systemctl start redis
   ```

5. **Run the service**
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

6. **Verify it's running**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Create .env file**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

3. **Check logs**
   ```bash
   docker-compose logs -f app
   ```

4. **Stop services**
   ```bash
   docker-compose down
   ```

### Using Docker only

1. **Build image**
   ```bash
   docker build -t github-rag-microservice .
   ```

2. **Run Redis**
   ```bash
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   ```

3. **Run application**
   ```bash
   docker run -d \
     --name github-rag-app \
     -p 3000:3000 \
     --link redis:redis \
     -e OPENAI_API_KEY=your_key \
     -e PINECONE_API_KEY=your_key \
     -e PINECONE_ENVIRONMENT=your_env \
     -e REDIS_HOST=redis \
     github-rag-microservice
   ```

## Cloud Deployment

### AWS ECS

1. **Push image to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   docker tag github-rag-microservice:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/github-rag-microservice:latest
   
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/github-rag-microservice:latest
   ```

2. **Create ECS task definition** with:
   - Container image from ECR
   - Environment variables for API keys
   - Link to ElastiCache Redis
   - Health check endpoint: `/api/v1/health`

3. **Create ECS service** with:
   - Load balancer
   - Auto-scaling based on CPU/memory
   - Multiple availability zones

### Google Cloud Run

1. **Build and push to GCR**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/github-rag-microservice
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy github-rag-microservice \
     --image gcr.io/PROJECT_ID/github-rag-microservice \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars OPENAI_API_KEY=your_key,PINECONE_API_KEY=your_key \
     --memory 2Gi \
     --timeout 300
   ```

3. **Connect to Cloud Memorystore (Redis)**
   - Create VPC connector
   - Set REDIS_HOST environment variable

### Kubernetes

1. **Create secrets**
   ```bash
   kubectl create secret generic api-keys \
     --from-literal=openai-api-key=your_key \
     --from-literal=pinecone-api-key=your_key
   ```

2. **Apply deployment**
   ```yaml
   # k8s/deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: github-rag-microservice
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: github-rag-microservice
     template:
       metadata:
         labels:
           app: github-rag-microservice
       spec:
         containers:
         - name: app
           image: your-registry/github-rag-microservice:latest
           ports:
           - containerPort: 3000
           env:
           - name: OPENAI_API_KEY
             valueFrom:
               secretKeyRef:
                 name: api-keys
                 key: openai-api-key
           - name: PINECONE_API_KEY
             valueFrom:
               secretKeyRef:
                 name: api-keys
                 key: pinecone-api-key
           - name: REDIS_HOST
             value: redis-service
           resources:
             requests:
               memory: "1Gi"
               cpu: "500m"
             limits:
               memory: "2Gi"
               cpu: "1000m"
           livenessProbe:
             httpGet:
               path: /api/v1/health
               port: 3000
             initialDelaySeconds: 30
             periodSeconds: 10
           readinessProbe:
             httpGet:
               path: /api/v1/health
               port: 3000
             initialDelaySeconds: 10
             periodSeconds: 5
   ```

3. **Apply service and ingress**
   ```bash
   kubectl apply -f k8s/
   ```

## Environment Variables

### Required

- `OPENAI_API_KEY`: OpenAI API key
- `PINECONE_API_KEY`: Pinecone API key
- `PINECONE_ENVIRONMENT`: Pinecone environment (e.g., `us-east-1-aws`)

### Optional

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password
- `PINECONE_INDEX_NAME`: Pinecone index name (default: github-code-search)
- `OPENAI_MODEL`: GPT model (default: gpt-4-turbo-preview)
- `OPENAI_EMBEDDING_MODEL`: Embedding model (default: text-embedding-3-small)
- `CACHE_DIR`: Cache directory (default: ./cache)
- `MAX_FILE_SIZE_MB`: Max file size (default: 10)
- `MAX_REPO_SIZE_MB`: Max repo size (default: 1000)
- `CHUNK_SIZE`: Chunk size (default: 1000)
- `CHUNK_OVERLAP`: Chunk overlap (default: 200)
- `LOG_LEVEL`: Log level (default: info)

## Monitoring

### Health Checks

```bash
# Basic health check
curl http://localhost:3000/api/v1/health

# Detailed stats
curl http://localhost:3000/api/v1/stats
```

### Logs

```bash
# Docker Compose
docker-compose logs -f app

# Kubernetes
kubectl logs -f deployment/github-rag-microservice

# Local
# Logs are output to stdout in JSON format
```

### Metrics (Future)

- Prometheus metrics endpoint
- Grafana dashboards
- Alert rules

## Scaling

### Horizontal Scaling

The service is designed to be stateless and can be scaled horizontally:

1. **Load Balancer**: Distribute traffic across multiple instances
2. **Shared Redis**: All instances connect to same Redis
3. **Shared Pinecone**: All instances use same Pinecone index
4. **Auto-scaling**: Scale based on CPU/memory/request rate

### Vertical Scaling

For large repositories:

- Increase memory limits
- Increase CPU limits
- Adjust `MAX_FILE_SIZE_MB` and `MAX_REPO_SIZE_MB`

## Backup and Recovery

### Redis Backup

```bash
# Enable AOF persistence
redis-cli CONFIG SET appendonly yes

# Manual backup
redis-cli BGSAVE
```

### Pinecone Backup

Pinecone handles backups automatically. To backup metadata:

```bash
# Export repository metadata from Redis
redis-cli --scan --pattern "repo:*" | xargs redis-cli MGET > repos-backup.json
```

## Troubleshooting

### Service won't start

1. Check environment variables are set
2. Verify Redis is running
3. Check Pinecone API key is valid
4. Review logs for errors

### Ingestion fails

1. Check repository URL is valid
2. Verify repository is public or credentials are provided
3. Check disk space for cache directory
4. Review file size and repo size limits

### Queries return no results

1. Verify ingestion completed successfully
2. Check `minScore` isn't too high
3. Try broader query terms
4. Check scope filter is correct

### High memory usage

1. Reduce `CHUNK_SIZE`
2. Lower `MAX_FILE_SIZE_MB`
3. Process smaller repositories
4. Increase container memory limits

## Security Checklist

- [ ] API keys stored in secrets, not in code
- [ ] Environment variables properly configured
- [ ] Rate limiting enabled
- [ ] HTTPS enabled (use reverse proxy)
- [ ] Firewall rules configured
- [ ] Redis password set (production)
- [ ] Regular security updates
- [ ] Monitoring and alerting configured

## Performance Tuning

### Redis

- Use Redis Cluster for high availability
- Enable persistence (AOF or RDB)
- Set appropriate maxmemory policy

### Pinecone

- Use appropriate pod type for workload
- Monitor query latency
- Optimize metadata filters

### Application

- Adjust `CHUNK_SIZE` and `CHUNK_OVERLAP`
- Tune batch sizes in embedding generation
- Use connection pooling
- Enable compression

## Cost Optimization

1. **OpenAI**: Monitor token usage, use cheaper models where possible
2. **Pinecone**: Right-size pod type, use serverless tier
3. **Compute**: Auto-scale down during low traffic
4. **Storage**: Clean up old repositories regularly
5. **Redis**: Use managed service with appropriate tier
