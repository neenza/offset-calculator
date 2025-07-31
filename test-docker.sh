#!/bin/bash
# Local Docker Test Script
# Run this to test your Docker build locally before deploying

echo "🐳 Building Docker image..."
cd backend
docker build -t offset-calc-backend .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    echo "🚀 Running container locally on port 8000..."
    echo "📝 Note: You'll need to set environment variables for full functionality"
    
    docker run -p 8000:8000 \
        -e SECRET_KEY="test-secret-key-for-local-testing" \
        -e ALGORITHM="HS256" \
        -e ACCESS_TOKEN_EXPIRE_MINUTES="30" \
        -e ENVIRONMENT="development" \
        offset-calc-backend
else
    echo "❌ Docker build failed!"
    exit 1
fi
