"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, Role } from '@/types/database.types';

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
    const logout = useCallback(() => {
        localStorage.removeItem('bt_user_id');
        setUser(null);
        setRole(null);
    }, []);

    const fetchUser = useCallback(async (userId: string) => {
        try {
            // Fetch User
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (userError || !userData) {
                console.error('Error fetching user:', userError);
                logout(); // Invalid session
                return;
            }

            const currentUser = userData as User;
            setUser(currentUser);

            // Fetch Role
            if (currentUser.role_id) {
                const { data: roleData } = await supabase
                    .from('roles')
                    .select('name')
                    .eq('id', currentUser.role_id)
                    .single();

                if (roleData) {
                    setRole((roleData as Role).name);
                }
            }
        } catch (error) {
            console.error('Auth check failed', error);
        } finally {
            setLoading(false);
        }
    }, [logout]); // Added logout to dependencies as it's called inside fetchUser

    useEffect(() => {
        // Check local storage for persisted session
        const storedUserId = localStorage.getItem('bt_user_id');
        if (storedUserId) {
            fetchUser(storedUserId);
        } else {
            setLoading(false);
        }
    }, [fetchUser]);

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
