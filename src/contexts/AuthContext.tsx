import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'user' | 'admin';
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchUserData = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      // Method 1: Check if profile has a role field
      let isAdmin = profile?.role === 'admin';

      // Method 2: If no role in profile, check user_roles table
      if (!isAdmin && !profile?.role) {
        try {
          const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', supabaseUser.id)
            .eq('role', 'admin')
            .single();
          
          isAdmin = !!userRole;
        } catch (roleError) {
          console.log('No admin role found in user_roles table');
        }
      }

      // Method 3: Try the RPC function if it exists
      if (!isAdmin) {
        try {
          const { data: roleData, error: roleError } = await supabase
            .rpc('check_user_role', { 
              check_user_id: supabaseUser.id, 
              check_role: 'admin' 
            });
          
          if (!roleError && roleData) {
            isAdmin = true;
          }
        } catch (roleError) {
          // RPC function doesn't exist, that's ok
          console.log('RPC function check_user_role not found, using fallback methods');
        }
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        phone: profile?.phone || '',
        role: isAdmin ? 'admin' : 'user',
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Return basic user data even if profile fetch fails
      return {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        firstName: '',
        lastName: '',
        role: 'user',
      };
    }
  };
  useEffect(() => {
    const init = async () => {
      try {
        // Check existing session on load FIRST
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        if (data.session?.user) {
          const userData = await fetchUserData(data.session.user);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }

      // Listen for auth state changes
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log('Auth state changed:', _event);
        setSession(session);
        if (session?.user) {
          const userData = await fetchUserData(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
      });

      return () => listener.subscription.unsubscribe();
    };

    init();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Login attempt for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      console.log('Login successful:', data);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      console.log('Registration attempt for:', data.email);
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
          },
        },
      });
      
      if (error) {
        console.error('Registration error:', error);
        throw error;
      }
      
      console.log('Registration successful');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const userData = await fetchUserData(data.session.user);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loginWithGoogle,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};