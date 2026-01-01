# Render Deployment Optimization Guide

## Current Issues & Solutions

### 🐌 Issue 1: Slow Connection (30-60 seconds)
**Cause**: Render Free Tier spins down after 15 minutes of inactivity

**Solutions**:

#### Option A: Keep Service Warm (Free)
Use a service to ping your backend every 10 minutes:

1. **UptimeRobot** (Recommended - Free):
   - Sign up at https://uptimerobot.com
   - Add new monitor:
     - Type: HTTP(s)
     - URL: `https://github-client-microservice-evqm.onrender.com/api/v1/health`
     - Interval: 10 minutes
   - This keeps your service awake 24/7

2. **Cron-job.org** (Alternative):
   - Sign up at https://cron-job.org
   - Create job to hit your health endpoint every 10 minutes

#### Option B: Upgrade to Paid Tier ($7/month)
- No cold starts
- Always-on service
- Better performance
- More resources

### 🔌 Issue 2: Random Disconnections
**Causes**: 
- Timeout during long operations
- Network issues with external services
- Limited resources on free tier

**Solutions**:

#### 1. Optimize Timeouts
Add these to your Render environment variables:

```bash
# Increase timeouts for long operations
REQUEST_TIMEOUT=120000
PINECONE_CONNECTION_TIMEOUT=60000
GROQ_TIMEOUT=30000
```

#### 2. Add Health Check Configuration
In Render Dashboard:
- Go to your service settings
- Set Health Check Path: `/api/v1/health`
- This helps Render know when service is ready

#### 3. Optimize Repository Ingestion
Large repos can timeout. Add streaming/chunking:

```typescript
// Process in smaller batches to avoid timeouts
const BATCH_SIZE = 50; // Process 50 files at a time
```

### 🐢 Issue 3: Slow Responses
**Causes**:
- Limited CPU/memory on free tier
- Geographic distance
- Shared infrastructure

**Solutions**:

#### 1. Enable Response Caching
Your app already has Redis support. Use a free Redis service:

**Upstash Redis** (Free tier - Perfect for Render):
1. Sign up at https://upstash.com
2. Create Redis database
3. Copy connection details
4. Add to Render environment variables:
   ```bash
   REDIS_HOST=your-redis-host.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=your-password
   REDIS_DB=0
   ```

#### 2. Optimize Pinecone Queries
```bash
# Add to Render environment variables
PINECONE_TOP_K=5  # Reduce from 10 to 5 for faster queries
PINECONE_BATCH_SIZE=100
```

#### 3. Reduce Chunk Size for Faster Processing
```bash
CHUNK_SIZE=800  # Reduce from 1000
CHUNK_OVERLAP=150  # Reduce from 200
MAX_CHUNKS_PER_FILE=50  # Reduce from 100
```

#### 4. Choose Closer Render Region
In Render Dashboard:
- Check your service region
- If possible, choose region closest to:
  - Your location
  - Pinecone region (us-east-1)
  - Most users

## Render Environment Variables Setup

### Required Variables (Already Set):
```bash
GROQ_API_KEY=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
GROQ_MODEL=llama-3.1-8b-instant
PINECONE_API_KEY=pcsk_4KNLde_Uw8Fr7BhLEC5xU5un9MTyDVcqw3vyCR2KFpxJXe4s9kjZUMo2mkegy7RU6W6cdb
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=github-client
GITHUB_TOKEN=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
NODE_ENV=production
```

### Recommended Additions:
```bash
# Performance Optimizations
CHUNK_SIZE=800
CHUNK_OVERLAP=150
MAX_CHUNKS_PER_FILE=50
REQUEST_TIMEOUT=120000
PINECONE_CONNECTION_TIMEOUT=60000

# Rate Limiting (Protect your service)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Redis (Optional - Add if using Upstash)
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

### Remove These (Not needed on Render):
```bash
# Don't set these - Render doesn't need them
PORT  # Render sets this automatically
CACHE_DIR  # Use /tmp on Render
```

## Step-by-Step Optimization

### Step 1: Set Up UptimeRobot (5 minutes)
1. Go to https://uptimerobot.com
2. Sign up (free)
3. Add monitor for your health endpoint
4. Set interval to 10 minutes
5. ✅ No more cold starts!

### Step 2: Add Redis Caching (10 minutes)
1. Go to https://upstash.com
2. Create free Redis database
3. Copy connection details
4. Add to Render environment variables
5. Restart service
6. ✅ Faster responses with caching!

### Step 3: Optimize Configuration (2 minutes)
1. Go to Render Dashboard
2. Add recommended environment variables above
3. Restart service
4. ✅ Better performance!

### Step 4: Test Performance
```bash
# Test health endpoint
curl https://github-client-microservice-evqm.onrender.com/api/v1/health

# Should respond in < 1 second (after warm-up)
```

## Performance Comparison

### Before Optimization:
- ❌ Cold start: 30-60 seconds
- ❌ Random disconnections
- ❌ Slow responses: 5-10 seconds
- ❌ Timeouts on large repos

### After Optimization (Free):
- ✅ No cold starts (with UptimeRobot)
- ✅ Fewer disconnections
- ✅ Faster responses: 2-3 seconds
- ✅ Better reliability

### With Paid Tier ($7/month):
- ✅ Instant responses: < 1 second
- ✅ No disconnections
- ✅ Handle large repos easily
- ✅ Professional reliability

## Monitoring Your Service

### Check Render Logs:
```bash
# In Render Dashboard
1. Go to your service
2. Click "Logs" tab
3. Look for errors or slow queries
```

### Check Metrics:
```bash
# In Render Dashboard
1. Go to your service
2. Click "Metrics" tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Response times
```

### Common Log Messages:

**Good**:
```
✅ Server started on port 3000
✅ Services initialized
✅ Pinecone connected
```

**Needs Attention**:
```
⚠️ Redis connection failed (optional, but add for better performance)
⚠️ Request timeout (increase timeout settings)
⚠️ Memory usage high (upgrade tier or optimize)
```

## Cost Analysis

### Free Tier (Current):
- Cost: $0/month
- Cold starts: Yes (30-60s)
- Performance: Moderate
- Best for: Testing, low traffic

### Free Tier + Optimizations:
- Cost: $0/month
- Cold starts: No (with UptimeRobot)
- Performance: Good
- Best for: Personal projects, demos

### Paid Tier ($7/month):
- Cost: $7/month
- Cold starts: No
- Performance: Excellent
- Best for: Production apps, real users

### Paid Tier + Redis ($7 + $0):
- Cost: $7/month (Upstash free tier)
- Cold starts: No
- Performance: Excellent
- Caching: Yes
- Best for: Production with high traffic

## Quick Wins (Do These Now!)

1. **Set up UptimeRobot** (5 min) - Eliminates cold starts
2. **Add timeout settings** (2 min) - Reduces disconnections
3. **Optimize chunk sizes** (2 min) - Faster processing

Total time: 9 minutes
Cost: $0
Impact: 🚀 Massive improvement!

## When to Upgrade to Paid

Upgrade if:
- ✅ You have real users
- ✅ Cold starts are unacceptable
- ✅ You need consistent performance
- ✅ Processing large repositories
- ✅ High traffic (>100 requests/day)

Stay on free if:
- ✅ Personal project
- ✅ Low traffic
- ✅ Can tolerate occasional slowness
- ✅ Using UptimeRobot to keep warm

## Next Steps

1. ✅ Set up UptimeRobot (highest impact, free)
2. ✅ Add recommended environment variables
3. ✅ Test performance
4. ⏳ Consider Redis if still slow
5. ⏳ Consider paid tier if needed

## Support

If issues persist after optimization:
1. Check Render logs for errors
2. Test Pinecone connection
3. Test Groq API
4. Verify all environment variables
5. Check network latency to Render region
