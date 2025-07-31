import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MantineProvider, createTheme } from "@mantine/core";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useSettingsStore } from "@/utils/settingsStore";
import { initializeAuth } from "@/utils/authService";
import { AuthProvider } from "@/utils/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppNavbar } from "@/components/AppNavbar";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Database from "./pages/database";

// Import Mantine styles
import '@mantine/core/styles.css';

const queryClient = new QueryClient();

// Create custom Mantine theme with better color support
const mantineTheme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: [
      '#e6f2ff',
      '#b3d9ff', 
      '#80c0ff',
      '#4da6ff',
      '#1a8cff',
      '#0066cc', // primary blue
      '#0052a3',
      '#003f7a',
      '#002b52',
      '#001829'
    ]
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

const AppContent = () => {
  const { loadSettings } = useSettingsStore();
  const { theme, systemTheme } = useTheme();

  // Load settings on app startup
  useEffect(() => {
    const initApp = async () => {
      loadSettings();
      await initializeAuth(); // Initialize authentication system
      console.log("App initialized: Settings loaded and auth initialized");
    };
    
    initApp();
  }, [loadSettings]);

  // Determine the actual theme being used
  const currentTheme = theme === 'system' ? systemTheme : theme;

  // Ensure Mantine color scheme is properly synced with next-themes
  useEffect(() => {
    const colorScheme = currentTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-mantine-color-scheme', colorScheme);
    document.documentElement.classList.toggle('dark', colorScheme === 'dark');
  }, [currentTheme]);

  return (
    <MantineProvider theme={mantineTheme} forceColorScheme={currentTheme === 'dark' ? 'dark' : 'light'}>
      <TooltipProvider>
        <BrowserRouter>
          <ProtectedRoute>
            <div className="flex h-screen bg-background text-foreground">
              <AppNavbar />
              <div className="flex-1 flex flex-col overflow-hidden bg-background">
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/database" element={<Database />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>
          </ProtectedRoute>
        </BrowserRouter>
      </TooltipProvider>
    </MantineProvider>
  );
};

export default App;
