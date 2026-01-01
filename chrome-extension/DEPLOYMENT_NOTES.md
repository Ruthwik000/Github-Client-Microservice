# Chrome Extension - Deployment Notes

## Backend Connection

The extension is configured to connect to the deployed backend:
```
https://github-client-microservice-evqm.onrender.com/api/v1
```

## Important: Render Free Tier Behavior

⚠️ **Cold Start Delay**: The backend is hosted on Render's free tier, which has the following behavior:

- **Spins down after 15 minutes** of inactivity
- **Takes 30-60 seconds to wake up** when first accessed
- During wake-up, you'll see **HTTP 502 errors**

### What This Means for Users

1. **First Use**: If the backend hasn't been used recently, the extension will show "Backend starting..." for 30-60 seconds
2. **The extension automatically retries** 3 times with 2-second delays
3. **Once connected**, the backend stays active for 15 minutes

### User Experience

- Status shows "Connecting..." while checking
- Status shows "Backend starting..." if getting 502 errors (Render waking up)
- Status shows "Connected" once backend responds
- Status shows "Not connected" if all retries fail

## Installation Steps

1. **Load Extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

2. **First Time Setup:**
   - Click the extension icon
   - Wait 30-60 seconds for backend to wake up (first time only)
   - Once connected, you can use all features

3. **Reload After Updates:**
   - Go to `chrome://extensions/`
   - Find "GitHub Repo Assistant"
   - Click the reload button (🔄)

## Troubleshooting

### "Not connected" Status

1. **Wait 60 seconds** - Backend might be waking up
2. **Check backend directly**: Visit https://github-client-microservice-evqm.onrender.com/api/v1/health
3. **Check browser console**:
   - Right-click extension icon → "Inspect popup"
   - Look for error messages in Console tab

### Backend Not Responding

If backend doesn't respond after 60 seconds:
- Check if Render service is running
- Check Render logs for errors
- Verify environment variables are set correctly

### CORS Errors

If you see CORS errors in console:
- Backend needs to be redeployed with updated CORS config
- Check `src/server.ts` has the updated CORS settings

## Configuration

### Change Backend URL

1. Click settings icon (⚙️) in extension
2. Enter new API URL
3. Click "Test Connection"
4. Save settings

### Default URLs

- **Production**: `https://github-client-microservice-evqm.onrender.com/api/v1`
- **Local Development**: `http://localhost:3000/api/v1`

## Features

- ✅ Repository analysis and summarization
- ✅ Q&A about repository code
- ✅ File tree explorer
- ✅ Automatic retry on cold starts
- ✅ Connection status indicator
- ✅ Query history

## Permissions Required

- `activeTab` - Access current GitHub tab
- `storage` - Save settings and history
- `tabs` - Detect GitHub repositories
- `notifications` - Show notifications
- Host permissions for:
  - `https://github.com/*` - GitHub pages
  - `https://api.github.com/*` - GitHub API
  - `https://github-client-microservice-evqm.onrender.com/*` - Backend API
  - `http://localhost:3000/*` - Local development

## Performance Tips

### Keep Backend Warm

To avoid cold starts:
1. Use the extension regularly (within 15-minute intervals)
2. Or upgrade to Render paid tier for always-on service
3. Or use a service like UptimeRobot to ping the health endpoint every 10 minutes

### Faster Responses

- Backend stays warm for 15 minutes after last use
- Subsequent requests are fast (< 1 second)
- Only the first request after sleep is slow

## Upgrading to Paid Tier

If you upgrade Render to a paid plan:
- No more cold starts
- Backend always responds instantly
- Better user experience
- No need for retry logic (but it doesn't hurt)
