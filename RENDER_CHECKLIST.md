# Render Deployment Checklist

Follow these steps to deploy your GitHub RAG Microservice to Render.

## Pre-Deployment

- [ ] **Get API Keys**
  - [ ] Groq API key from [console.groq.com](https://console.groq.com)
  - [ ] Pinecone API key from [app.pinecone.io](https://app.pinecone.io)
  - [ ] Note your Pinecone environment (e.g., `us-east-1-aws`)

- [ ] **Create Pinecone Index**
  - [ ] Go to Pinecone Console
  - [ ] Create new index:
    - Name: `github-code-search`
    - Dimensions: `384`
    - Metric: `cosine`
    - Pod Type: `s1` or `serverless`

- [ ] **Push Code to Git**
  ```bash
  git add .
  git commit -m "Ready for Render deployment"
  git push origin main
  ```

## Deployment Steps

- [ ] **Create Render Account**
  - [ ] Sign up at [render.com](https://render.com)
  - [ ] Connect your Git provider (GitHub/GitLab/Bitbucket)

- [ ] **Deploy with Blueprint**
  - [ ] Go to Render Dashboard
  - [ ] Click "New" → "Blueprint"
  - [ ] Select your repository
  - [ ] Render detects `render.yaml` automatically

- [ ] **Configure Environment Variables**
  
  Set these required variables:
  - [ ] `GROQ_API_KEY` = your Groq API key
  - [ ] `PINECONE_API_KEY` = your Pinecone API key
  - [ ] `PINECONE_ENVIRONMENT` = your Pinecone environment
  
  Optional (for private repos):
  - [ ] `GITHUB_TOKEN` = your GitHub personal access token

- [ ] **Apply Blueprint**
  - [ ] Click "Apply" to create service
  - [ ] Wait for build to complete (5-10 minutes)
  - [ ] Web service will be created (no Redis needed - uses in-memory cache)

## Post-Deployment

- [ ] **Test Health Endpoint**
  ```bash
  curl https://your-app-name.onrender.com/api/v1/health
  ```
  Expected response: `{"status":"ok",...}`

- [ ] **Test Ingestion**
  ```bash
  curl -X POST https://your-app-name.onrender.com/api/v1/ingest \
    -H "Content-Type: application/json" \
    -d '{
      "repoUrl": "https://github.com/octocat/Hello-World",
      "branch": "master"
    }'
  ```

- [ ] **Check Job Status**
  ```bash
  curl https://your-app-name.onrender.com/api/v1/status/JOB_ID
  ```

- [ ] **Test Query**
  ```bash
  curl -X POST https://your-app-name.onrender.com/api/v1/query \
    -H "Content-Type: application/json" \
    -d '{
      "query": "What does this repository do?",
      "repoUrl": "https://github.com/octocat/Hello-World"
    }'
  ```

## Optional Configuration

- [ ] **Custom Domain**
  - [ ] Go to service settings
  - [ ] Add custom domain
  - [ ] Update DNS records

- [ ] **Monitoring**
  - [ ] Set up alerts for errors
  - [ ] Configure uptime monitoring
  - [ ] Set up log aggregation

- [ ] **Scaling**
  - [ ] Upgrade plan if needed (Starter → Standard)
  - [ ] Enable auto-scaling
  - [ ] Adjust Redis memory

- [ ] **Chrome Extension**
  - [ ] Update extension API URL
  - [ ] Test extension with deployed service
  - [ ] See `SETUP_CHROME_EXTENSION.md`

## Troubleshooting

If deployment fails:

1. **Check Build Logs**
   - Go to service → Logs tab
   - Look for build errors

2. **Verify Environment Variables**
   - All required variables set?
   - API keys valid?
   - Pinecone environment correct?

3. **Verify Pinecone Index**
   - Index exists?
   - Correct dimensions (384)?
   - Correct metric (cosine)?

## Support Resources

- 📖 [Full Deployment Guide](docs/RENDER_DEPLOYMENT.md)
- 🌐 [Render Documentation](https://render.com/docs)
- 💬 [Render Community](https://community.render.com)
- 🤖 [Groq Documentation](https://console.groq.com/docs)
- 📊 [Pinecone Documentation](https://docs.pinecone.io)

## Cost Estimate

**Free Tier:**
- Web Service: Free (with spin-down)
- Total: $0/month

**Starter Tier (Recommended):**
- Web Service: $7/month (no spin-down)
- Total: $7/month

**Plus External Costs:**
- Groq API: Pay per token (very affordable)
- Pinecone: Free tier or ~$70/month for s1 pod

---

✅ **Deployment Complete!** Your service is now live at `https://your-app-name.onrender.com`
