// Auth Event Manager - Handle authentication events across the application

export type AuthEvent = 'login' | 'logout' | 'token-expired' | 'refresh-failed';

type AuthEventListener = (event: AuthEvent) => void;

class AuthEventManager {
  private listeners: AuthEventListener[] = [];

  // Add a listener for auth events
  addListener(listener: AuthEventListener): () => void {
    this.listeners.push(listener);
    
    // Return a cleanup function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Emit an auth event to all listeners
  emit(event: AuthEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in auth event listener:', error);
      }
    });
  }

  // Handle token expiration/refresh failure
  handleAuthFailure(): void {
    this.emit('token-expired');
    this.emit('logout');
  }

  // Handle successful login
  handleLogin(): void {
    this.emit('login');
  }

  // Handle manual logout
  handleLogout(): void {
    this.emit('logout');
  }
}

// Export a singleton instance
export const authEventManager = new AuthEventManager();

// Utility hook for React components
import { useEffect } from 'react';

export const useAuthEvents = (listener: AuthEventListener) => {
  useEffect(() => {
    const cleanup = authEventManager.addListener(listener);
    return cleanup;
  }, [listener]);
};
