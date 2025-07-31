import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Filter,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  Users,
  AlertCircle,
  Wifi,
  WifiOff,
  Database as DatabaseIcon,
  BarChart3,
  ClipboardList,
  Receipt
} from 'lucide-react';

// Types for our database entities
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

interface Project {
  _id?: string;
  clientId: string;
  clientName: string;
  projectName: string;
  description: string;
  status: 'quote' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCost: number;
  actualCost: number;
  startDate: string;
  deadline: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Quote {
  _id?: string;
  clientId: string;
  quoteNumber: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseAnalytics {
  clients: {
    total: number;
    active: number;
    inactive: number;
  };
  revenue: {
    total: number;
    total_orders: number;
    avg_order_value: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  quotes: {
    total: number;
    pending: number;
    processed: number;
  };
}

// Mock API functions (replace with real API calls)
const databaseApi = {
  checkHealth: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Throw error to simulate disconnected state for demo
    throw new Error('Simulated offline mode');
  }
};

const clientsApi = {
  getClients: async (params?: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  },
  createClient: async (clientData: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...clientData, _id: Date.now().toString() };
  },
  updateClient: async (id: string, clientData: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...clientData, _id: id };
  },
  deleteClient: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { message: 'Client deleted successfully' };
  }
};

const analyticsApi = {
  getOverview: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return null;
  }
};

const Database: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clients' | 'projects' | 'quotes' | 'analytics'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [analytics, setAnalytics] = useState<DatabaseAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  
  const { toast } = useToast();

  // Form state for creating/editing clients
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    status: 'active',
    clientType: 'individual',
    creditLimit: 0,
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    checkDatabaseHealth();
    loadClients();
    loadAnalytics();
  }, []);

  const checkDatabaseHealth = async () => {
    try {
      setDatabaseStatus('checking');
      await databaseApi.checkHealth();
      setDatabaseStatus('connected');
    } catch (error) {
      setDatabaseStatus('disconnected');
      toast({
        title: "Database Connection",
        description: "Using offline mode with mock data",
        variant: "default"
      });
      loadMockData();
    }
  };

  const loadClients = async () => {
    if (databaseStatus === 'disconnected') return;
    
    setLoading(true);
    try {
      const clientsData = await clientsApi.getClients({
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined
      });
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients. Using offline mode.",
        variant: "destructive"
      });
      setDatabaseStatus('disconnected');
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (databaseStatus === 'disconnected') return;
    
    try {
      const analyticsData = await analyticsApi.getOverview();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Use mock analytics
      setAnalytics({
        clients: { total: clients.length, active: clients.filter(c => c.status === 'active').length, inactive: 0 },
        revenue: { total: 0, total_orders: 0, avg_order_value: 0 },
        projects: { total: 0, active: 0, completed: 0 },
        quotes: { total: 0, pending: 0, processed: 0 }
      });
    }
  };

  const loadMockData = () => {
    // Mock clients data
    const mockClients: Client[] = [
      {
        _id: '1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1-555-0101',
        company: 'Smith & Associates',
        address: '123 Business St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        status: 'active',
        clientType: 'business',
        creditLimit: 10000,
        notes: 'Prefers quick turnaround projects',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        totalOrders: 15,
        totalRevenue: 45000,
        lastOrderDate: '2024-01-18T09:00:00Z'
      },
      {
        _id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@techcorp.com',
        phone: '+1-555-0102',
        company: 'TechCorp Solutions',
        address: '456 Innovation Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        status: 'active',
        clientType: 'enterprise',
        creditLimit: 50000,
        notes: 'Large volume orders, quarterly billing',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-22T11:15:00Z',
        totalOrders: 8,
        totalRevenue: 125000,
        lastOrderDate: '2024-01-21T14:30:00Z'
      },
      {
        _id: '3',
        name: 'Mike Davis',
        email: 'mike.davis@personal.com',
        phone: '+1-555-0103',
        company: '',
        address: '789 Residential Rd',
        city: 'Austin',
        state: 'TX',
        zipCode: '73301',
        status: 'pending',
        clientType: 'individual',
        creditLimit: 2000,
        notes: 'New client, requires approval for credit',
        createdAt: '2024-01-25T16:45:00Z',
        updatedAt: '2024-01-25T16:45:00Z',
        totalOrders: 0,
        totalRevenue: 0
      }
    ];

    setClients(mockClients);

    // Mock projects data
    const mockProjects: Project[] = [
      {
        _id: 'p1',
        clientId: '1',
        clientName: 'John Smith',
        projectName: 'Business Card Redesign',
        description: 'New business cards with updated branding',
        status: 'completed',
        priority: 'medium',
        estimatedCost: 500,
        actualCost: 475,
        startDate: '2024-01-15T00:00:00Z',
        deadline: '2024-01-20T00:00:00Z',
        completedDate: '2024-01-19T00:00:00Z',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-19T16:00:00Z'
      },
      {
        _id: 'p2',
        clientId: '2',
        clientName: 'Sarah Johnson',
        projectName: 'Annual Report 2024',
        description: 'Complete annual report with charts and graphics',
        status: 'in-progress',
        priority: 'high',
        estimatedCost: 15000,
        actualCost: 0,
        startDate: '2024-01-20T00:00:00Z',
        deadline: '2024-02-15T00:00:00Z',
        createdAt: '2024-01-20T09:00:00Z',
        updatedAt: '2024-01-25T14:30:00Z'
      }
    ];

    setProjects(mockProjects);

    // Mock quotes data
    const mockQuotes: Quote[] = [
      {
        _id: 'q1',
        clientId: '3',
        quoteNumber: 'QT-2024-001',
        items: [
          { description: 'Business Cards (1000 qty)', quantity: 1000, unitPrice: 0.15, total: 150 },
          { description: 'Setup Fee', quantity: 1, unitPrice: 50, total: 50 }
        ],
        subtotal: 200,
        tax: 16,
        total: 216,
        status: 'sent',
        validUntil: '2024-02-25T23:59:59Z',
        createdAt: '2024-01-25T17:00:00Z',
        updatedAt: '2024-01-25T17:00:00Z'
      }
    ];

    setQuotes(mockQuotes);
  };

  const createClient = async (clientData: Partial<Client>) => {
    setLoading(true);
    try {
      if (databaseStatus === 'connected') {
        const newClient = await clientsApi.createClient(clientData);
        setClients(prev => [...prev, newClient as Client]);
        toast({
          title: "Success",
          description: "Client created successfully",
        });
      } else {
        // Mock creation for offline mode
        const newClient: Client = {
          ...clientData as Client,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalOrders: 0,
          totalRevenue: 0
        };
        setClients(prev => [...prev, newClient]);
        toast({
          title: "Success",
          description: "Client created successfully (offline mode)",
        });
      }
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (clientId: string, clientData: Partial<Client>) => {
    setLoading(true);
    try {
      if (databaseStatus === 'connected') {
        const updatedClient = await clientsApi.updateClient(clientId, clientData);
        setClients(prev => prev.map(client => 
          client._id === clientId ? updatedClient as Client : client
        ));
      } else {
        // Mock update for offline mode
        setClients(prev => prev.map(client => 
          client._id === clientId 
            ? { ...client, ...clientData, updatedAt: new Date().toISOString() }
            : client
        ));
      }
      
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (clientId: string) => {
    setLoading(true);
    try {
      if (databaseStatus === 'connected') {
        await clientsApi.deleteClient(clientId);
      }
      
      setClients(prev => prev.filter(client => client._id !== clientId));
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      status: 'active',
      clientType: 'individual',
      creditLimit: 0,
      notes: ''
    });
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData(client);
    setIsEditDialogOpen(true);
  };

  const handleView = (client: Client) => {
    setSelectedClient(client);
    setIsViewDialogOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClient) {
      updateClient(selectedClient._id!, formData);
    } else {
      createClient(formData);
    }
  };

  // Filter clients based on search and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary", 
      pending: "outline"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getClientTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      individual: "bg-blue-100 text-blue-800",
      business: "bg-green-100 text-green-800",
      enterprise: "bg-purple-100 text-purple-800"
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  // Analytics calculations
  const getAnalyticsData = () => {
    if (analytics) {
      return {
        totalClients: analytics.clients.total,
        activeClients: analytics.clients.active,
        totalRevenue: analytics.revenue.total,
        totalOrders: analytics.revenue.total_orders,
        avgOrderValue: analytics.revenue.avg_order_value
      };
    }
    
    // Fallback calculations from local data
    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      totalRevenue: clients.reduce((sum, c) => sum + c.totalRevenue, 0),
      totalOrders: clients.reduce((sum, c) => sum + c.totalOrders, 0),
      avgOrderValue: clients.reduce((sum, c) => sum + c.totalRevenue, 0) / Math.max(clients.reduce((sum, c) => sum + c.totalOrders, 0), 1)
    };
  };

  const analyticsData = getAnalyticsData();

  return (
    <div className="flex-1 bg-background overflow-auto">
      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
            <p className="text-muted-foreground">
              Manage clients, projects, and quotes in your printing business
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">{analyticsData.totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                  <p className="text-2xl font-bold">{analyticsData.activeClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${analyticsData.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{analyticsData.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold">${analyticsData.avgOrderValue.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          {[
            { id: 'clients', label: 'Clients', icon: Users },
            { id: 'projects', label: 'Projects', icon: FileText },
            { id: 'quotes', label: 'Quotes', icon: DollarSign },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client Management</CardTitle>
                  <CardDescription>
                    View and manage your client database
                  </CardDescription>
                </div>
              </div>
              
              {/* Search and Filter */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client._id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{client.name}</div>
                            <div className="text-sm text-muted-foreground">{client.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                            {client.company || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                              {client.phone}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {client.city}, {client.state}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getClientTypeBadge(client.clientType)}</TableCell>
                        <TableCell>{getStatusBadge(client.status)}</TableCell>
                        <TableCell>{client.totalOrders}</TableCell>
                        <TableCell>${client.totalRevenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleView(client)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Client</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this client? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteClient(client._id!)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
              <CardDescription>Track and manage your printing projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Projects Coming Soon</h3>
                <p className="text-muted-foreground">
                  Project management features will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quotes Tab */}
        {activeTab === 'quotes' && (
          <Card>
            <CardHeader>
              <CardTitle>Quote Management</CardTitle>
              <CardDescription>Create and manage client quotes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Quotes Coming Soon</h3>
                <p className="text-muted-foreground">
                  Quote management features will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Card>
            <CardHeader>
              <CardTitle>Business Analytics</CardTitle>
              <CardDescription>Insights into your printing business performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced analytics and reporting features will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Client Dialog */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedClient(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedClient ? 'Edit Client' : 'Create New Client'}
              </DialogTitle>
              <DialogDescription>
                {selectedClient ? 'Update client information' : 'Add a new client to your database'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Client['status'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientType">Client Type</Label>
                  <Select 
                    value={formData.clientType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, clientType: value as Client['clientType'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit ($)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                    setSelectedClient(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : selectedClient ? 'Update Client' : 'Create Client'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Client Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
            </DialogHeader>
            
            {selectedClient && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedClient.name}</h3>
                      <p className="text-muted-foreground">{selectedClient.email}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        {selectedClient.phone}
                      </div>
                      {selectedClient.company && (
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          {selectedClient.company}
                        </div>
                      )}
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        {selectedClient.address && `${selectedClient.address}, `}
                        {selectedClient.city}, {selectedClient.state} {selectedClient.zipCode}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      {getStatusBadge(selectedClient.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Type:</span>
                      {getClientTypeBadge(selectedClient.clientType)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Credit Limit:</span>
                      <span>${selectedClient.creditLimit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{selectedClient.totalOrders}</p>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${selectedClient.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      ${selectedClient.totalOrders > 0 ? (selectedClient.totalRevenue / selectedClient.totalOrders).toFixed(0) : '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  </div>
                </div>

                {selectedClient.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">{selectedClient.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Created: {new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(selectedClient.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Database;
