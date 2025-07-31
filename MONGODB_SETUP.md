# MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas for the Offset Printing Calculator database.

## Prerequisites

- A MongoDB Atlas account (free tier available)
- Python environment with required dependencies

## Step 1: Create MongoDB Atlas Account

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create a Cluster

1. After logging in, click "Create a New Cluster"
2. Choose the FREE tier (M0 Sandbox)
3. Select a cloud provider and region close to your location
4. Give your cluster a name (e.g., "offset-printing-cluster")
5. Click "Create Cluster" (this may take a few minutes)

## Step 3: Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Create a username and secure password
5. Under "Database User Privileges", select "Atlas admin"
6. Click "Add User"

## Step 4: Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development, you can click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note:** For production, restrict to specific IP addresses
4. Click "Confirm"

## Step 5: Get Connection String

1. Go to "Clusters" and click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Python" and version "3.6 or later"
4. Copy the connection string (it should look like):
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
   ```

## Step 6: Configure Environment Variables

1. Copy `backend/.env.example` to `backend/.env`
2. Update the MongoDB configuration in your `.env` file:

```bash
# MongoDB Configuration
MONGODB_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/
DATABASE_NAME=offset_printing_db
```

Replace:
- `your-username` with the database user you created
- `your-password` with the password you set
- `your-cluster` with your actual cluster name

## Step 7: Install Dependencies

Make sure you have the required Python packages installed:

```bash
cd backend
pip install -r requirements.txt
```

## Step 8: Test the Connection

Start the backend server:

```bash
cd backend
python main.py
```

You should see:
```
✅ Connected to MongoDB successfully
✅ Beanie initialized successfully
✅ Database initialization completed
```

## Database Collections

The application will automatically create the following collections:

- **clients** - Client information and contact details
- **projects** - Printing projects and specifications
- **quotes** - Price quotes and estimates
- **invoices** - Billing and payment information
- **client_interactions** - Communication history

## Database Schema

### Clients Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "phone": "string",
  "company": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zip_code": "string",
    "country": "string"
  },
  "status": "active|inactive|pending",
  "client_type": "individual|business|enterprise",
  "credit_limit": "number",
  "payment_terms": {
    "payment_method": "string",
    "due_days": "number"
  },
  "notes": "string",
  "total_orders": "number",
  "total_revenue": "number",
  "last_order_date": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Projects Collection
```json
{
  "_id": "ObjectId",
  "client_id": "ObjectId",
  "project_name": "string",
  "description": "string",
  "status": "quote|in-progress|completed|cancelled|on-hold",
  "priority": "low|medium|high|urgent",
  "specifications": {
    "paper_type": "string",
    "paper_size": "string",
    "quantity": "number",
    "colors": "number",
    "finishing": ["string"],
    "binding": "string"
  },
  "estimated_cost": "number",
  "actual_cost": "number",
  "start_date": "datetime",
  "deadline": "datetime",
  "completed_date": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Frontend Integration

The frontend database page (`src/pages/database.tsx`) includes:

- **Client Management**: Create, read, update, delete client records
- **Search & Filtering**: Search clients by name, email, or company
- **Analytics Dashboard**: Overview of business metrics
- **Offline Mode**: Mock data when database is unavailable
- **Real-time Updates**: Live connection status indicator

## Security Features

- **Authentication Required**: All database operations require valid user authentication
- **Input Validation**: Pydantic models validate all data inputs
- **Connection Encryption**: MongoDB Atlas uses TLS/SSL by default
- **IP Whitelisting**: Network access controls limit database access

## Troubleshooting

### Connection Issues

1. **Check your connection string**: Ensure username, password, and cluster name are correct
2. **Verify network access**: Make sure your IP address is whitelisted
3. **Check firewall**: Ensure port 27017 is not blocked
4. **Test credentials**: Verify database user credentials in Atlas

### Common Error Messages

- `Authentication failed`: Check username/password in connection string
- `Connection timeout`: Check network access settings and firewall
- `Database not found`: The database will be created automatically on first use

### Logs and Monitoring

- Check backend console logs for connection status
- Use MongoDB Atlas monitoring dashboard for performance insights
- Frontend shows connection status in the database page header

## Production Deployment

For production deployment:

1. Use a dedicated cluster (not free tier)
2. Configure specific IP whitelisting
3. Use MongoDB Atlas Data API for serverless functions
4. Set up backup and monitoring
5. Configure alerts for connection issues

## Support

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/) - Free courses
- [Community Forums](https://community.mongodb.com/)
