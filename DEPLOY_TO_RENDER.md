# 🚀 Quick Deploy to Render

Deploy your GitHub RAG Microservice to Render in 5 minutes!

## What You Need

1. **Groq API Key** - Get free at [console.groq.com](https://console.groq.com)
2. **Pinecone Account** - Sign up at [pinecone.io](https://www.pinecone.io)
3. **Git Repository** - Push your code to GitHub/GitLab/Bitbucket

## Step 1: Create Pinecone Index

Go to [Pinecone Console](https://app.pinecone.io) and create an index:

- **Name**: `github-code-search`
- **Dimensions**: `384`
- **Metric**: `cosine`
- **Pod Type**: `s1` or `serverless`

## Step 2: Push to Git

```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

## Step 3: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your Git repository
4. Render will detect `render.yaml` automatically
5. Set these environment variables:
   - `GROQ_API_KEY` = your Groq API key
   - `PINECONE_API_KEY` = your Pinecone API key
   - `PINECONE_ENVIRONMENT` = your Pinecone environment (e.g., `us-east-1-aws`)
6. Click **"Apply"**

## Step 4: Wait for Build

Build takes ~5-10 minutes. Watch the logs for progress.

## Step 5: Test Your Deployment

Once deployed, test it:

```bash
# Replace YOUR-APP-NAME with your actual Render app name
curl https://YOUR-APP-NAME.onrender.com/api/v1/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "services": {
    "cache": "up",
    "pinecone": "up"
  }
}
```

## Test Ingestion

```bash
curl -X POST https://YOUR-APP-NAME.onrender.com/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/octocat/Hello-World",
    "branch": "master"
  }'
```

## Test Query

```bash
curl -X POST https://YOUR-APP-NAME.onrender.com/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What does this code do?",
    "repoUrl": "https://github.com/octocat/Hello-World"
  }'
```

## 🎉 Done!

Your service is now live at: `https://YOUR-APP-NAME.onrender.com`

## Important Notes

- **Free Tier**: Service spins down after 15 min of inactivity (cold starts)
- **Upgrade**: $7/month for Starter plan (no spin-down)
- **Cache**: Uses in-memory cache (no Redis needed)
- **Scaling**: Each instance has its own cache

## Next Steps

- [ ] Set up custom domain
- [ ] Configure monitoring alerts
- [ ] Deploy Chrome extension
- [ ] Upgrade to paid plan for production

## Need Help?

- 📖 [Full Deployment Guide](docs/RENDER_DEPLOYMENT.md)
- ✅ [Deployment Checklist](RENDER_CHECKLIST.md)
- 🌐 [Render Docs](https://render.com/docs)

## Troubleshooting

**Build fails?**
- Check Dockerfile syntax
- Verify all dependencies in package.json

**Service crashes?**
- Check environment variables are set
- Verify API keys are valid
- Check logs in Render dashboard

**No results from queries?**
- Verify Pinecone index exists
- Check index dimensions (must be 384)
- Ensure ingestion completed successfully
