import React, { useEffect, useState } from 'react';
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Mail, User, Calendar, Shield } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { login, logout, isLoggedIn, getCurrentUser, User as UserType } from '@/utils/authService';
import { Skeleton } from '@/components/ui/skeleton';

// Form schema for login
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const Profile = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);

  // Define form with zod resolver
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        if (isLoggedIn()) {
          const userData = await getCurrentUser();
          setUser(userData);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    setUser(null);
    setLoginSuccess(false);
  };

  // Handle login submission
  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await login({
        username: values.username,
        password: values.password,
      });
      
      if (success) {
        const userData = await getCurrentUser();
        setUser(userData);
        setLoginSuccess(true);
        form.reset();
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="flex-1 bg-background overflow-auto">
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background overflow-auto">
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          {user ? (
            // User Profile View
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 py-2">
                  <div className="bg-primary h-12 w-12 rounded-full flex items-center justify-center text-primary-foreground">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Username</p>
                    <p className="text-lg">{user.username}</p>
                  </div>
                </div>
                
                {user.full_name && (
                  <div className="flex items-center space-x-4 py-2">
                    <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center text-primary">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Full Name</p>
                      <p className="text-lg">{user.full_name}</p>
                    </div>
                  </div>
                )}
                
                {user.email && (
                  <div className="flex items-center space-x-4 py-2">
                    <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center text-primary">
                      <Mail size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-lg">{user.email}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 py-2">
                  <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center text-primary">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Account Type</p>
                    <p className="text-lg">Standard</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 py-2">
                  <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center text-primary">
                    <Shield size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Account Status</p>
                    <p className="text-lg">Active</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </CardFooter>
            </Card>
          ) : (
            // Login Form
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Login</CardTitle>
                <CardDescription>Sign in to access your account</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {loginSuccess && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <AlertTitle className="text-green-800">Success!</AlertTitle>
                    <AlertDescription className="text-green-700">
                      You've successfully logged in.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-4 text-sm text-center text-muted-foreground">
                  <p>Demo Users:</p>
                  <p>Username: admin, Password: admin123</p>
                  <p>Username: user1, Password: user123</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
