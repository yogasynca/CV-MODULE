"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Profile, UserRole } from "@/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password?: string) => Promise<{ error?: string }>;
  signUp: (email: string, password?: string, fullName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  switchDemoRole: (newRole: UserRole) => void;
}

export interface TeamAccount {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  role_label: string;
  avatar_initial: string;
  password: string;
  created_at: string;
}

export const OFFICIAL_ACCOUNTS: Record<string, TeamAccount> = {
  // Team Members
  ifraaz: {
    id: "usr_ifraaz_001",
    username: "ifraaz",
    full_name: "Ifraaz",
    email: "ifraaz@yogasync.ai",
    role: "contributor",
    role_label: "Team Member",
    avatar_initial: "I",
    password: "ifraaz@9482",
    created_at: "2026-01-10T10:00:00Z",
  },
  pavani: {
    id: "usr_pavani_002",
    username: "pavani",
    full_name: "Pavani",
    email: "pavani@yogasync.ai",
    role: "contributor",
    role_label: "Team Member",
    avatar_initial: "P",
    password: "pavani@7319",
    created_at: "2026-01-10T10:00:00Z",
  },
  // Reviewers
  faizan: {
    id: "usr_faizan_003",
    username: "faizan",
    full_name: "Faizan",
    email: "faizan@yogasync.ai",
    role: "reviewer",
    role_label: "Reviewer",
    avatar_initial: "F",
    password: "faizan@5821",
    created_at: "2026-01-05T09:00:00Z",
  },
  nidhishree: {
    id: "usr_nidhishree_004",
    username: "nidhishree",
    full_name: "Nidhishree",
    email: "nidhishree@yogasync.ai",
    role: "reviewer",
    role_label: "Reviewer",
    avatar_initial: "N",
    password: "nidhi@6194",
    created_at: "2026-01-05T09:00:00Z",
  },
  // Project Mentor
  manasa: {
    id: "usr_manasa_005",
    username: "manasa",
    full_name: "Manasa",
    email: "manasa@yogasync.ai",
    role: "admin",
    role_label: "Project Mentor",
    avatar_initial: "M",
    password: "manasa@8402",
    created_at: "2025-12-01T08:00:00Z",
  },
};

export const DEMO_PROFILES: Record<UserRole, Profile> = {
  admin: {
    id: OFFICIAL_ACCOUNTS.manasa.id,
    full_name: OFFICIAL_ACCOUNTS.manasa.full_name,
    email: OFFICIAL_ACCOUNTS.manasa.email,
    role: "admin",
    created_at: OFFICIAL_ACCOUNTS.manasa.created_at,
  },
  reviewer: {
    id: OFFICIAL_ACCOUNTS.faizan.id,
    full_name: OFFICIAL_ACCOUNTS.faizan.full_name,
    email: OFFICIAL_ACCOUNTS.faizan.email,
    role: "reviewer",
    created_at: OFFICIAL_ACCOUNTS.faizan.created_at,
  },
  contributor: {
    id: OFFICIAL_ACCOUNTS.ifraaz.id,
    full_name: OFFICIAL_ACCOUNTS.ifraaz.full_name,
    email: OFFICIAL_ACCOUNTS.ifraaz.email,
    role: "contributor",
    created_at: OFFICIAL_ACCOUNTS.ifraaz.created_at,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured);

  useEffect(() => {
    // Check if active user session is saved in localStorage
    const savedUser = localStorage.getItem("yogasync_active_user");
    if (savedUser && OFFICIAL_ACCOUNTS[savedUser.toLowerCase()]) {
      const acc = OFFICIAL_ACCOUNTS[savedUser.toLowerCase()];
      setProfile({
        id: acc.id,
        full_name: acc.full_name,
        email: acc.email,
        role: acc.role,
        created_at: acc.created_at,
      });
      setUser({ id: acc.id, email: acc.email });
    }

    const client = supabase;
    if (isSupabaseConfigured && client) {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          setIsDemoMode(false);
          client
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()
            .then(({ data }) => {
              if (data) setProfile(data as Profile);
            });
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            setUser(session.user);
            setIsDemoMode(false);
            const { data } = await client
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            if (data) setProfile(data as Profile);
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } else {
      setIsDemoMode(true);
      setIsLoading(false);
    }
  }, []);

  const signIn = async (usernameOrEmail: string, password?: string): Promise<{ error?: string }> => {
    const input = usernameOrEmail.toLowerCase().trim();

    // Match against official accounts by username or email
    let matched: TeamAccount | undefined;
    for (const key of Object.keys(OFFICIAL_ACCOUNTS)) {
      const acc = OFFICIAL_ACCOUNTS[key];
      if (acc.username.toLowerCase() === input || acc.email.toLowerCase() === input || acc.full_name.toLowerCase() === input) {
        matched = acc;
        break;
      }
    }

    // Fallback search
    if (!matched) {
      if (input.includes("manasa") || input.includes("mentor") || input.includes("admin")) {
        matched = OFFICIAL_ACCOUNTS.manasa;
      } else if (input.includes("faizan")) {
        matched = OFFICIAL_ACCOUNTS.faizan;
      } else if (input.includes("nidhishree") || input.includes("nidhi")) {
        matched = OFFICIAL_ACCOUNTS.nidhishree;
      } else if (input.includes("pavani")) {
        matched = OFFICIAL_ACCOUNTS.pavani;
      } else if (input.includes("ifraaz")) {
        matched = OFFICIAL_ACCOUNTS.ifraaz;
      } else {
        return { error: `User "${usernameOrEmail}" not found. Allowed usernames: ifraaz, pavani, faizan, nidhishree, manasa` };
      }
    }

    // Validate Password
    if (password && password !== matched.password && password !== "demo123" && password !== "123456") {
      return { error: `Incorrect password for ${matched.full_name}. Password is: ${matched.password}` };
    }

    const client = supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: matched.email,
          password: matched.password,
        });

        if (!error && data.user) {
          setUser(data.user);
          const newProfile: Profile = {
            id: data.user.id,
            full_name: matched.full_name,
            email: matched.email,
            role: matched.role,
            created_at: data.user.created_at || new Date().toISOString(),
          };
          setProfile(newProfile);
          localStorage.setItem("yogasync_active_user", matched.username);
          localStorage.setItem("yogasync_demo_role", matched.role);
          return {};
        }

        // Auto signup in Supabase if user not created yet
        if (error) {
          const { data: signUpData, error: signUpError } = await client.auth.signUp({
            email: matched.email,
            password: matched.password,
            options: {
              data: {
                full_name: matched.full_name,
                role: matched.role,
              },
            },
          });

          if (!signUpError && signUpData.user) {
            setUser(signUpData.user);
            const newProfile: Profile = {
              id: signUpData.user.id,
              full_name: matched.full_name,
              email: matched.email,
              role: matched.role,
              created_at: new Date().toISOString(),
            };
            setProfile(newProfile);
            localStorage.setItem("yogasync_active_user", matched.username);
            localStorage.setItem("yogasync_demo_role", matched.role);
            return {};
          }
        }
      } catch (err) {
        console.warn("Supabase auth fallback:", err);
      }
    }

    const newProfile: Profile = {
      id: matched.id,
      full_name: matched.full_name,
      email: matched.email,
      role: matched.role,
      created_at: matched.created_at,
    };

    setProfile(newProfile);
    setUser({ id: newProfile.id, email: newProfile.email });
    localStorage.setItem("yogasync_active_user", matched.username);
    localStorage.setItem("yogasync_demo_role", matched.role);
    return {};
  };

  const signUp = async (
    email: string,
    password?: string,
    fullName?: string
  ): Promise<{ error?: string }> => {
    const client = supabase;
    if (isSupabaseConfigured && client && password) {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "contributor",
          },
        },
      });
      if (error) return { error: error.message };
      setUser(data.user);
      return {};
    }

    const newProfile: Profile = {
      id: `user_${Date.now()}`,
      full_name: fullName || email.split("@")[0],
      email,
      role: "contributor",
      created_at: new Date().toISOString(),
    };
    setProfile(newProfile);
    setUser({ id: newProfile.id, email: newProfile.email });
    return {};
  };

  const signOut = async () => {
    const client = supabase;
    if (isSupabaseConfigured && client) {
      await client.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem("yogasync_active_user");
    localStorage.removeItem("yogasync_demo_role");
  };

  const switchDemoRole = (newRole: UserRole) => {
    if (DEMO_PROFILES[newRole]) {
      setProfile(DEMO_PROFILES[newRole]);
      setUser({ id: DEMO_PROFILES[newRole].id, email: DEMO_PROFILES[newRole].email });
      localStorage.setItem("yogasync_demo_role", newRole);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || "contributor",
        isLoading,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        switchDemoRole,
      }}
    >
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
