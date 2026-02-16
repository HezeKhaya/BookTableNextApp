'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCart, addToCart as addToCartAction, removeFromCart as removeFromCartAction, mergeGuestCart } from '@/app/actions/cart';
import { useAuth } from './AuthContext';

interface CartItem {
    id: string;
    book_id: number;
    quantity: number;
    book: {
        id: number;
        title: string;
        author: string;
        price: number;
        image_url: string;
        sku_number?: string;
        code?: number;
    };
}

interface CartContextType {
    items: CartItem[];
    count: number;
    loading: boolean;
    addToCart: (bookId: number, quantity?: number) => Promise<{ success?: boolean; error?: string }>;
    removeFromCart: (itemId: string) => Promise<{ success?: boolean; error?: string }>;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    // Consolidated init logic
    useEffect(() => {
        // Wait for auth to be determined
        if (authLoading) return;

        initializeCart();
    }, [user, authLoading]);

    const initializeCart = async () => {
        setLoading(true);
        // If user just logged in, we might want to merge carts.
        // For simplicity, we'll rely on the server action `getCart` which handles
        // fetching the correct cart based on user ID or cookie.
        // Merging logic might be better placed in the Login action or explicit here?
        // Let's implement a basic fetch first. Persistence across login (merge) 
        // usually happens at the moment of login.

        try {
            const { items: cartItems } = await getCart(user?.id);
            setItems(cartItems as CartItem[]);
        } catch (error) {
            console.error('Failed to init cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (bookId: number, quantity: number = 1) => {
        // Optimistic update could go here, but for now wait for server
        const result = await addToCartAction(bookId, quantity, user?.id);
        if (result.success) {
            await refreshCart();
            return { success: true };
        }
        return { error: result.error };
    };

    const removeFromCart = async (itemId: string) => {
        const result = await removeFromCartAction(itemId);
        if (result.success) {
            await refreshCart();
            return { success: true };
        }
        return { error: result.error };
    };

    const refreshCart = async () => {
        const { items: cartItems } = await getCart(user?.id);
        setItems(cartItems as CartItem[]);
    };

    const count = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, count, loading, addToCart, removeFromCart, refreshCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
