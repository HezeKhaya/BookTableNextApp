"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Role } from '@/types/database.types';
import { getClientProfile } from '@/app/actions/auth';
import { createClient } from '@/utils/supabase/client';

interface AuthContextType {
    user: User | null;
    role: string | null;
    loading: boolean;
    login: (id: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Define logout first so it can be used in fetchUser
    const logout = useCallback(async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        
        localStorage.removeItem('bt_user_id');
        setUser(null);
        setRole(null);
    }, []);

    const fetchUser = useCallback(async (userId: string) => {
        try {
            const res = await getClientProfile(userId);

            if (res.error || !res.user) {
                console.error('Error fetching user:', res.error);
                logout(); // Invalid session
                return;
            }

            setUser(res.user);
            
            if (res.roleName) {
                setRole(res.roleName);
            }
        } catch (error) {
            console.error('Auth check failed', error);
        } finally {
            setLoading(false);
        }
    }, [logout]); // Added logout to dependencies as it's called inside fetchUser

    useEffect(() => {
        const supabase = createClient();
        
        // 1. Check for active Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                // Supabase session exists (e.g., from OAuth redirect or existing session)
                localStorage.setItem('bt_user_id', session.user.id);
                fetchUser(session.user.id);
            } else {
                // 2. Fallback to localStorage if no active Supabase session found
                const storedUserId = localStorage.getItem('bt_user_id');
                if (storedUserId) {
                    fetchUser(storedUserId);
                } else {
                    setLoading(false);
                }
            }
        });

        // 3. Listen to Auth State Changes (crucial for OAuth redirects)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (session?.user) {
                    localStorage.setItem('bt_user_id', session.user.id);
                    fetchUser(session.user.id);
                } else if (event === 'SIGNED_OUT') {
                    logout();
                }
            }
        );

        return () => {
             subscription.unsubscribe();
        };
    }, [fetchUser, logout]);

    const login = async (userId: string) => {
        setLoading(true);
        localStorage.setItem('bt_user_id', userId);
        await fetchUser(userId);
    };



    const refreshUser = async () => {
        if (user) {
            await fetchUser(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
