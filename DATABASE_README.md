# Database Management System

The Offset Printing Calculator now includes a comprehensive database management system for handling clients, projects, quotes, and business analytics.

## 🎯 Features

### Client Management
- ✅ **CRUD Operations**: Create, read, update, and delete client records
- ✅ **Advanced Search**: Search clients by name, email, or company
- ✅ **Filtering**: Filter clients by status (active, inactive, pending)
- ✅ **Client Types**: Individual, Business, and Enterprise classifications
- ✅ **Contact Information**: Complete address and contact details
- ✅ **Credit Management**: Set and track credit limits
- ✅ **Order History**: Track total orders and revenue per client

### Analytics Dashboard
- ✅ **Overview Cards**: Key metrics at a glance
- ✅ **Client Statistics**: Total, active, and inactive client counts
- ✅ **Revenue Tracking**: Total revenue and average order value
- ✅ **Real-time Updates**: Live data synchronization

### Database Integration
- ✅ **MongoDB Atlas**: Cloud-based database storage
- ✅ **Offline Mode**: Mock data when database is unavailable
- ✅ **Connection Status**: Real-time connection monitoring
- ✅ **Error Handling**: Graceful fallbacks and user notifications

### UI/UX Features
- ✅ **Modern Interface**: Clean, responsive design using shadcn/ui
- ✅ **Modal Dialogs**: Create and edit clients in modal windows
- ✅ **Data Tables**: Sortable and searchable data tables
- ✅ **Status Badges**: Visual indicators for client status and types
- ✅ **Loading States**: Smooth loading animations
- ✅ **Toast Notifications**: Success and error messages

## 🚀 Getting Started

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure MongoDB Atlas**
   - Follow the [MongoDB Setup Guide](../MONGODB_SETUP.md)
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URL` with your connection string

3. **Start the Backend Server**
   ```bash
   # Option 1: Quick start
   python main.py
   
   # Option 2: Interactive startup with sample data
   python start_server.py
   ```

### Frontend Setup

The database UI is already integrated into the main application. Just navigate to the "Database" tab in the sidebar.

## 📊 Database Schema

### Clients Collection
```typescript
interface Client {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  status: 'active' | 'inactive' | 'pending';
  clientType: 'individual' | 'business' | 'enterprise';
  creditLimit: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate?: string;
}
```

## 🛠️ API Endpoints

### Client Management
- `GET /api/database/clients` - List all clients
- `POST /api/database/clients` - Create new client
- `GET /api/database/clients/{id}` - Get specific client
- `PUT /api/database/clients/{id}` - Update client
- `DELETE /api/database/clients/{id}` - Delete client

### Analytics
- `GET /api/database/analytics/overview` - Get overview analytics
- `GET /api/database/analytics/revenue-trend` - Get revenue trends
- `GET /api/database/analytics/clients` - Get client analytics

### Database Health
- `GET /api/database/health` - Check database connection
- `GET /api/database/stats` - Get database statistics

## 🧪 Testing

### Backend API Testing
```bash
cd backend
python test_database_api.py
```

### Sample Data Population
```bash
cd backend
python populate_sample_data.py
```

## 📱 User Interface

### Navigation
Access the database through the sidebar navigation:
- **Database Icon**: Click the database icon in the navigation bar
- **Direct URL**: Navigate to `/database` in the application

### Client Management Interface

#### Overview Cards
The dashboard displays key metrics:
- Total Clients count
- Active Clients count  
- Total Revenue amount
- Average Order Value
- Active Projects count

#### Client Table
- **Search**: Use the search bar to find clients by name, email, or company
- **Filter**: Filter clients by status using the dropdown
- **Actions**: Each row has view, edit, and delete actions

#### Client Forms
- **Add Client**: Click "Add Client" to open the creation form
- **Edit Client**: Click the edit icon to modify existing client data
- **View Details**: Click the eye icon to view full client information

### Form Fields
- **Basic Info**: Name, email, phone
- **Company**: Company name (optional for individuals)
- **Address**: Full address including city, state, and ZIP
- **Classification**: Status and client type
- **Business**: Credit limit and notes

## 🔒 Security Features

### Authentication Required
All database operations require valid user authentication through the existing auth system.

### Data Validation
- Frontend validation using React forms
- Backend validation using Pydantic models
- Type safety throughout the application

### Error Handling
- Graceful error handling with user-friendly messages
- Offline mode for database connectivity issues
- Toast notifications for all operations

## 🎨 Styling and Theming

### Design System
- **Components**: Uses shadcn/ui component library
- **Icons**: Lucide React icons
- **Theming**: Supports light/dark mode
- **Responsive**: Mobile-friendly responsive design

### Color Coding
- **Active Clients**: Green badges
- **Inactive Clients**: Gray badges  
- **Pending Clients**: Yellow badges
- **Business Clients**: Green background
- **Enterprise Clients**: Purple background
- **Individual Clients**: Blue background

## 🔄 Future Enhancements

### Planned Features
- **Projects Management**: Full project lifecycle tracking
- **Quote Generation**: Automated quote creation and management
- **Invoice System**: Billing and payment tracking
- **Advanced Analytics**: Charts and graphs for business insights
- **Export/Import**: CSV and Excel data management
- **Client Communications**: Email integration and history tracking

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Search**: Full-text search capabilities
- **Bulk Operations**: Multi-select and bulk actions
- **Audit Logging**: Track all database changes
- **Data Backup**: Automated backup and restore features

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB Atlas connection string
   - Verify network access settings
   - Check firewall configurations

2. **Authentication Errors**
   - Ensure user is logged in
   - Check token expiration
   - Verify backend authentication setup

3. **Data Not Loading**
   - Check backend server status
   - Verify API endpoints are running
   - Check browser console for errors

### Debug Mode
Enable debug logging by setting environment variables:
```bash
DEBUG=true
LOG_LEVEL=debug
```

## 📞 Support

### Documentation
- [MongoDB Setup Guide](../MONGODB_SETUP.md)
- [API Documentation](http://localhost:8000/docs) (when server is running)
- [Backend README](../backend/README.md)

### Getting Help
- Check the console logs for detailed error messages
- Use the browser developer tools to inspect network requests
- Review the backend logs for server-side issues

## 🎉 Success!

If everything is set up correctly, you should see:
- ✅ Database connection indicator showing "Connected"
- ✅ Client data loading in the table
- ✅ All CRUD operations working smoothly
- ✅ Analytics cards showing real data

The database management system is now ready for production use!
