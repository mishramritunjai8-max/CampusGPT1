"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "faculty" | "admin";
  department?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isMock: boolean;
  login: (email: string, password: string, role?: string) => Promise<UserProfile>;
  signup: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMock, setIsMock] = useState<boolean>(false);
  const router = useRouter();

  // On mount, load session
  useEffect(() => {
    async function loadSession() {
      try {
        // 1. Check if Supabase client is available
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setToken(session.access_token);
            // Fetch profile from FastAPI synced DB (or mock fetch if DB sync has lag)
            try {
              const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
              });
              if (res.ok) {
                const profile = await res.json();
                setUser(profile);
              } else {
                // If not synced yet, fallback to decode jwt payload or construct mock profile
                setUser({
                  id: session.user.id,
                  email: session.user.email || "",
                  full_name: session.user.user_metadata.full_name || "Supabase User",
                  role: session.user.user_metadata.role || "student"
                });
              }
            } catch (e) {
              console.error("Failed to sync Supabase profile with backend, using session fallback", e);
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                full_name: session.user.user_metadata.full_name || "Supabase User",
                role: session.user.user_metadata.role || "student"
              });
            }
            setIsMock(false);
            setLoading(false);
            return;
          }
        }

        // 2. Check local mock storage fallback
        const savedToken = localStorage.getItem("campusgpt_token");
        const savedProfile = localStorage.getItem("campusgpt_profile");

        if (savedToken && savedProfile) {
          setToken(savedToken);
          setUser(JSON.parse(savedProfile));
          setIsMock(true);
        }
      } catch (err) {
        console.error("Error loading session:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    // Supabase auth state change listener
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          setToken(session.access_token);
          // Sync profile
          try {
            const res = await fetch(`${API_BASE}/auth/me`, {
              headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (res.ok) {
              const profile = await res.json();
              setUser(profile);
            }
          } catch (e) {
            console.error("Error updating state on auth change", e);
          }
          setIsMock(false);
        } else {
          // Clear only if not running in local mock mode
          if (!localStorage.getItem("campusgpt_token")) {
            setUser(null);
            setToken(null);
          }
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password: string, role?: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      // 1. Try real Supabase auth if enabled
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (data.session) {
          setToken(data.session.access_token);
          // Get profile
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${data.session.access_token}` }
          });
          if (res.ok) {
            const profile = await res.json();
            setUser(profile);
            setLoading(false);
            return profile;
          }
          
          const fallProfile: UserProfile = {
            id: data.session.user.id,
            email: data.session.user.email || "",
            full_name: data.session.user.user_metadata.full_name || "Supabase User",
            role: (data.session.user.user_metadata.role as any) || "student"
          };
          setUser(fallProfile);
          setLoading(false);
          return fallProfile;
        }
      }

      // 2. Local fallback login via backend
      const res = await fetch(`${API_BASE}/auth/local/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });

      if (!res.ok) {
        throw new Error("Invalid credentials or server connection failed.");
      }

      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);
      setIsMock(true);

      localStorage.setItem("campusgpt_token", data.access_token);
      localStorage.setItem("campusgpt_profile", JSON.stringify(data.user));
      document.cookie = `campusgpt_token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;

      setLoading(false);
      return data.user;
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: string) => {
    setLoading(true);
    try {
      if (supabase) {
        // Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role
            }
          }
        });
        if (error) throw error;
        
        // Call backend sync profile endpoint manually to register profile immediately
        if (data.session) {
          await fetch(`${API_BASE}/auth/sync`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session.access_token}`
            },
            body: JSON.stringify({
              id: data.session.user.id,
              email: email,
              full_name: fullName,
              role: role
            })
          });
        }
      } else {
        // In local mock mode, just log in directly to create mock profile
        await login(email, password, role);
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      setUser(null);
      setToken(null);
      setIsMock(false);
      localStorage.removeItem("campusgpt_token");
      localStorage.removeItem("campusgpt_profile");
      document.cookie = "campusgpt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/");
    } catch (err) {
      console.error("Signout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isMock, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
