'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  metadata?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  extendSession: () => void; // Extend session timeout
  showWarning: boolean; // Show timeout warning
  isLocked: boolean; // Session is locked due to timeout
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Session timeout
  const [sessionTimeout, setSessionTimeout] = useState<number>(30 * 60 * 1000); // Default 30 minutes
  const [warningTimeout, setWarningTimeout] = useState<number>(60 * 1000); // Warning 1 minute before logout
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const supabase = createClientComponentClient();

  // Load user's timeout preference from profile metadata
  useEffect(() => {
    if (profile?.metadata?.session_timeout) {
      setSessionTimeout(profile.metadata.session_timeout * 60 * 1000); // Convert minutes to ms
    }
  }, [profile]);

  // Activity detection
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [user]);

  // Session timeout check
  useEffect(() => {
    if (!user) return;

    const checkTimeout = () => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;

      // Show warning and lock when timeout exceeded
      if (inactiveTime >= sessionTimeout) {
        setShowWarning(true);
        setIsLocked(true);
      }
    };

    const interval = setInterval(checkTimeout, 1000); // Check every second

    return () => clearInterval(interval);
  }, [user, lastActivity, sessionTimeout]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile fetch fails, create a minimal profile object
        const { data: userData } = await supabase.auth.getUser();
        const userEmail = userData?.user?.email;
        
        // Fallback for admin user
        if (userEmail === 'admin@goalsquad.se') {
          setProfile({
            id: userId,
            email: userEmail || 'admin@goalsquad.se',
            full_name: 'Admin',
            avatar_url: null,
            role: 'gs_admin',
            is_active: true,
            is_verified: true,
          });
        } else {
          // Set a default profile for other users
          setProfile({
            id: userId,
            email: userEmail || '',
            full_name: null,
            avatar_url: null,
            role: 'user',
            is_active: true,
            is_verified: false,
          });
        }
      } else {
        // Check entity tables to determine correct role
        const [merchant, seller, warehouse, community] = await Promise.all([
          supabase.from('merchants').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('seller_profiles').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('warehouse_partners').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('communities').select('id').eq('owner_id', userId).maybeSingle(),
        ]);

        // Determine correct role based on entity associations
        let correctRole = data.role;
        if (warehouse.data?.id) {
          correctRole = 'warehouse';
        } else if (merchant.data?.id) {
          correctRole = 'merchant';
        } else if (seller.data?.id) {
          correctRole = 'seller';
        } else if (community.data?.id) {
          correctRole = 'community';
        } else if (data.role === 'gs_admin' || data.role === 'admin') {
          correctRole = 'gs_admin';
        }

        // Update profile with correct role if different
        setProfile({
          ...data,
          role: correctRole,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set minimal profile on error
      setProfile({
        id: userId,
        email: user?.email || '',
        full_name: null,
        avatar_url: null,
        role: 'user',
        is_active: true,
        is_verified: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const extendSession = () => {
    setLastActivity(Date.now());
    setShowWarning(false);
    setIsLocked(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    // Refresh profile
    await fetchProfile(user.id);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    updateProfile,
    extendSession,
    showWarning,
    isLocked,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to check if user is member of community
export function useCommunityMember(communityId: string) {
  const { user } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!user || !communityId) {
      setLoading(false);
      return;
    }

    fetchMembership();
  }, [user, communityId]);

  const fetchMembership = async () => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setMember(data);
    } catch (error) {
      console.error('Error fetching membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = member?.role === 'admin';
  const isModerator = member?.role === 'moderator' || isAdmin;
  const isSeller = member?.role === 'seller' || member?.can_sell;
  const canInvite = member?.can_invite || isAdmin || isModerator;

  return {
    member,
    loading,
    isMember: !!member,
    isAdmin,
    isModerator,
    isSeller,
    canInvite,
    refetch: fetchMembership,
  };
}

// Hook to get user's communities
export function useUserCommunities() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchCommunities();
  }, [user]);

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_communities', {
        p_user_id: user!.id,
      });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  return { communities, loading, refetch: fetchCommunities };
}
