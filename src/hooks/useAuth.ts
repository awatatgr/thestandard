import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { isAuthEnabled } from "@/lib/features";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

interface Profile {
  role: string;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
  });

  useEffect(() => {
    if (!supabase || !isAuthEnabled()) {
      setState({ user: null, session: null, loading: false, isAdmin: false });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null, loading: false }));
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null }));
      if (session?.user) fetchProfile(session.user.id);
      else setState(prev => ({ ...prev, isAdmin: false }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (data) {
      setState(prev => ({ ...prev, isAdmin: (data as Profile).role === "admin" }));
    }
  };

  const signInWithMagicLink = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Auth not configured");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return { ...state, signInWithMagicLink, signOut };
}
