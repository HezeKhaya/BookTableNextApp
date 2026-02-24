"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Role } from '@/types/database.types';
import { getClientProfile } from '@/app/actions/auth';

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
