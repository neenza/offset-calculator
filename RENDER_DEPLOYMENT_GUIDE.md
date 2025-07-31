# Render Deployment Guide for Offset Calculator Backend

## Prerequisites

1. **GitHub Repository**: Your code should be pushed to a GitHub repository
2. **Render Account**: Create a free account at [render.com](https://render.com)
3. **MongoDB Atlas**: Set up a free MongoDB cluster at [mongodb.com](https://cloud.mongodb.com)

## Step-by-Step Deployment Process

### 1. Prepare Your MongoDB Database

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (free tier is sufficient for testing)
3. Create a database user with read/write permissions
4. Get your connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
5. Whitelist `0.0.0.0/0` in Network Access (for Render to connect)

### 2. Push Your Code to GitHub

```bash
# If you haven't already, initialize git and push to GitHub
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 3. Deploy on Render

#### Option A: Using render.yaml (Automatic)

1. Go to [render.com](https://render.com) and sign in
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Review the services that will be created:
   - Web Service (your FastAPI backend)
   - MongoDB database
   - Redis database
6. Click "Apply" to start deployment

#### Option B: Manual Setup

1. **Create Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Set the following:
     - **Name**: `offset-calc-backend`
     - **Root Directory**: `backend`
     - **Environment**: `Docker`
     - **Dockerfile Path**: `./Dockerfile`
     - **Plan**: Free (for testing)

2. **Add Environment Variables**:
   Go to the Environment tab and add:
   ```
   MONGODB_URI=your-mongodb-connection-string
   REDIS_URL=your-redis-connection-string
   SECRET_KEY=generate-a-strong-secret-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   SINGLE_DEVICE_LOGIN=true
   SESSION_FINGERPRINTING=true
   ENVIRONMENT=production
   FRONTEND_URL=https://your-frontend-domain.com
   ```

3. **Create Databases**:
   - Click "New" → "PostgreSQL" (for Redis, use Redis service)
   - Or use external services like MongoDB Atlas and Redis Cloud

### 4. Configure Environment Variables

In your Render dashboard, set these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGODB_URI` | Your MongoDB connection string | Database connection |
| `REDIS_URL` | Your Redis connection string | Session storage |
| `SECRET_KEY` | Generate a strong secret | JWT token signing |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token expiration |
| `SINGLE_DEVICE_LOGIN` | `true` | Security feature |
| `SESSION_FINGERPRINTING` | `true` | Security feature |
| `ENVIRONMENT` | `production` | Environment type |
| `FRONTEND_URL` | Your frontend URL | CORS configuration |

### 5. Generate a Strong Secret Key

Use this Python script to generate a secure secret key:

```python
import secrets
secret_key = secrets.token_urlsafe(32)
print(f"SECRET_KEY={secret_key}")
```

### 6. Update Frontend API URL

Once deployed, update your frontend to use the Render URL:

```typescript
// In your frontend api.ts file
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-render-app-name.onrender.com'
  : 'http://localhost:8000';
```

## Deployment Verification

1. **Check Service Status**: In Render dashboard, ensure your service is "Live"
2. **Test Health Endpoint**: Visit `https://your-app.onrender.com/` in browser
3. **Check Logs**: Review logs in Render dashboard for any errors
4. **Test API Endpoints**: Use tools like Postman to test your API

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are in `requirements.txt`
   - Verify Docker syntax in `Dockerfile`
   - Review build logs for specific errors

2. **Database Connection Issues**:
   - Verify MongoDB connection string is correct
   - Check that MongoDB Atlas allows connections from `0.0.0.0/0`
   - Ensure database user has proper permissions

3. **CORS Issues**:
   - Update `FRONTEND_URL` environment variable
   - Check CORS configuration in `main.py`

4. **Authentication Issues**:
   - Verify `SECRET_KEY` is set and strong
   - Check Redis connection for session storage

### Monitoring and Logs

- **View Logs**: Render dashboard → Your service → Logs tab
- **Health Checks**: The Dockerfile includes health checks
- **Metrics**: Monitor response times and errors in Render dashboard

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **HTTPS**: Render provides free SSL certificates
3. **Database Security**: Use strong passwords and restrict IP access
4. **Secret Rotation**: Regularly update your SECRET_KEY

## Scaling and Performance

1. **Free Tier Limitations**: 
   - 512MB RAM
   - Service sleeps after 15 minutes of inactivity
   - 750 build hours per month

2. **Upgrading**: 
   - Consider paid plans for production use
   - Enable autoscaling for high traffic

## Cost Estimation

- **Web Service**: Free tier available, $7/month for starter plan
- **Databases**: Free tiers available for PostgreSQL and Redis
- **MongoDB Atlas**: Free tier (512MB storage)

## Next Steps

1. Deploy your frontend (Vercel, Netlify, or Render)
2. Set up custom domain names
3. Configure CI/CD for automatic deployments
4. Set up monitoring and alerting
5. Implement database backups

## Support

- [Render Documentation](https://render.com/docs)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
