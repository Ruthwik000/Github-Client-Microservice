# Quick Fix for Slow Connection Issues

## The Problem
Your backend on Render Free Tier:
- ❌ Spins down after 15 minutes
- ❌ Takes 30-60 seconds to wake up
- ❌ Random disconnections
- ❌ Slow responses

## The Solution (5 Minutes, Free!)

### Step 1: Keep Your Backend Awake

**Use UptimeRobot to ping your backend every 10 minutes:**

1. Go to: https://uptimerobot.com/signUp
2. Sign up (free account)
3. Click "Add New Monitor"
4. Fill in:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: GitHub Client Backend
   - **URL**: `https://github-client-microservice-evqm.onrender.com/api/v1/health`
   - **Monitoring Interval**: 10 minutes
5. Click "Create Monitor"

**That's it!** Your backend will now stay awake 24/7.

### Step 2: Add These Environment Variables in Render

Go to your Render Dashboard → Your Service → Environment:

```bash
# Add these for better performance
REQUEST_TIMEOUT=120000
PINECONE_CONNECTION_TIMEOUT=60000
CHUNK_SIZE=800
CHUNK_OVERLAP=150
MAX_CHUNKS_PER_FILE=50
LOG_LEVEL=info
```

Click "Save Changes" - Render will automatically redeploy.

### Step 3: Test

Wait 2-3 minutes for Render to redeploy, then:

1. Open your Chrome extension
2. Should connect in < 2 seconds now
3. No more 30-60 second waits!

## Results

### Before:
- First connection: 30-60 seconds ❌
- Random disconnections ❌
- Slow responses ❌

### After:
- First connection: < 2 seconds ✅
- Stable connection ✅
- Faster responses ✅

## Why This Works

**UptimeRobot** pings your backend every 10 minutes, so:
- Backend never spins down
- Always ready to respond
- No cold starts
- Consistent performance

## Cost

**$0/month** - Completely free!

## Alternative: Upgrade to Paid

If you still have issues or need guaranteed performance:

**Render Paid Tier**: $7/month
- No cold starts ever
- More CPU/memory
- Better for production

But try the free solution first - it works great for most cases!

## Troubleshooting

### Still slow after setup?

1. **Check UptimeRobot is working**:
   - Go to UptimeRobot dashboard
   - Should show "Up" status
   - Check "Response Time" graph

2. **Check Render logs**:
   - Go to Render Dashboard
   - Click "Logs" tab
   - Look for errors

3. **Test backend directly**:
   ```bash
   curl https://github-client-microservice-evqm.onrender.com/api/v1/health
   ```
   Should respond in < 1 second

### Random disconnections?

Add Redis caching (also free):
1. Sign up at https://upstash.com
2. Create Redis database
3. Add to Render environment:
   ```bash
   REDIS_HOST=your-host.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=your-password
   ```

## Summary

**Do this now** (5 minutes):
1. ✅ Set up UptimeRobot
2. ✅ Add environment variables
3. ✅ Test connection

**Result**: Fast, reliable backend for $0/month!
