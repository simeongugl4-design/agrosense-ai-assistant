import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthUser {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string | null;
  };
}

interface AuthSession {
  user: AuthUser;
  access_token?: string;
  refresh_token?: string;
}

interface AuthError {
  message: string;
}

interface AuthSubscription {
  unsubscribe: () => void;
}

interface SupabaseLikeAuthClient {
  onAuthStateChange: (
    callback: (event: string, session: AuthSession | null) => void,
  ) => { data: { subscription: AuthSubscription } };
  getSession: () => Promise<{ data: { session: AuthSession | null } }>;
  signUp: (params: {
    email: string;
    password: string;
    options?: {
      emailRedirectTo?: string;
      data?: Record<string, unknown>;
    };
  }) => Promise<{ error: AuthError | null }>;
  signInWithPassword: (params: {
    email: string;
    password: string;
  }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<unknown>;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const authClient = supabase.auth as unknown as SupabaseLikeAuthClient;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = authClient.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    authClient.getSession().then(({ data: { session: nextSession } }) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await authClient.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || "",
        },
      },
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await authClient.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await authClient.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

