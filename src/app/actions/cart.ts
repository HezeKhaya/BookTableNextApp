'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Helper to get or create a cart ID
// Strategy:
// 1. If user is logged in, get their cart.
// 2. If not logged in, check for 'cartId' cookie.
// 3. If no cookie, return null (we'll handle creation on add).

export async function getCart(userId?: string) {
    let cartId: string | null = null;

    if (userId) {
        // Fetch user's cart
        const { data: cart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (cart) {
            cartId = cart.id;
        } else {
            // Create cart for user if it doesn't exist
            const { data: newCart, error } = await supabase
                .from('carts')
                .insert({ user_id: userId })
                .select('id')
                .single();

            if (newCart) cartId = newCart.id;
        }
    } else {
        // Guest user - check cookie
        const cookieStore = await cookies();
        const cookieCartId = cookieStore.get('cartId')?.value;
        if (cookieCartId) {
            cartId = cookieCartId;
        }
    }

    if (!cartId) return { items: [], cartId: null };

    const { data: items, error } = await supabase
        .from('cart_items')
        .select(`
            id,
            book_id,
            quantity,
            books (
                id,
                title,
                author,
                price,
                image_url,
                sku_number,
                code
            )
        `)
        .eq('cart_id', cartId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching cart items:', error);
        return { items: [], cartId };
    }

    // Flatten structure
    const formattedItems = items.map(item => ({
        id: item.id,
        book_id: item.book_id,
        quantity: item.quantity,
        book: item.books // This will be a single object because book_id is FK
    }));

    return { items: formattedItems, cartId };
}

export async function addToCart(bookId: number, quantity: number = 1, userId?: string) {
    let cartId: string | null = null;
    const cookieStore = await cookies();

    if (userId) {
        // Logged in user
        const { data: cart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (cart) {
            cartId = cart.id;
        } else {
            const { data: newCart } = await supabase
                .from('carts')
                .insert({ user_id: userId })
                .select('id')
                .single();
            if (newCart) cartId = newCart.id;
        }
    } else {
        // Guest
        cartId = cookieStore.get('cartId')?.value || null;
        if (!cartId) {
            const { data: newCart } = await supabase
                .from('carts')
                .insert({}) // user_id is null
                .select('id')
                .single();
            if (newCart) {
                cartId = newCart.id;
                // Set cookie for 30 days
                // Note: We can't set cookies directly in server actions in some Next.js versions cleanly 
                // without using middleware or returning the ID to the client to set.
                // However, `cookies().set(...)` is available in Server Actions.
                cookieStore.set('cartId', newCart.id, { maxAge: 60 * 60 * 24 * 30 });
            }
        }
    }

    if (!cartId) return { error: 'Failed to initialize cart' };

    // Check book stock and existing cart item
    const { data: book } = await supabase
        .from('books')
        .select('qty_in_stock')
        .eq('id', bookId)
        .single();

    if (!book) return { error: 'Book not found' };

    const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('book_id', bookId)
        .single();

    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const availableStock = book.qty_in_stock;

    if (currentQtyInCart + quantity > availableStock) {
        return {
            error: `You cannot add that amount to the cart — we have ${availableStock} in stock and you already have ${currentQtyInCart} in your cart.`,
            stock: availableStock,
            currentCartQty: currentQtyInCart
        };
    }

    if (existingItem) {
        // Update quantity
        const { error } = await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id);

        if (error) return { error: 'Failed to update cart item' };
    } else {
        // Insert new item
        const { error } = await supabase
            .from('cart_items')
            .insert({ cart_id: cartId, book_id: bookId, quantity });

        if (error) return { error: 'Failed to add item to cart' };
    }

    revalidatePath('/cart');
    return { success: true, cartId }; // Return cartId so client can update cookie if needed (mostly for guests)
}

export async function removeFromCart(itemId: string) {
    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

    if (error) {
        console.error('Error removing cart item:', error);
        return { error: 'Failed to remove item' };
    }

    revalidatePath('/cart');
    return { success: true };
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
        return removeFromCart(itemId);
    }

    const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

    if (error) return { error: 'Failed to update quantity' };

    revalidatePath('/cart');
    return { success: true };
}

export async function mergeGuestCart(guestCartId: string, userId: string) {
    // 1. Get User Cart
    let userCartId: string | null = null;
    const { data: userCart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (userCart) {
        userCartId = userCart.id;
    } else {
        // If user has no cart, claim the guest cart as their own
        const { error } = await supabase
            .from('carts')
            .update({ user_id: userId })
            .eq('id', guestCartId);

        if (!error) return { success: true };
        // If error (e.g. somehow explicitly failed), fallback to creating new
        const { data: newCart } = await supabase
            .from('carts')
            .insert({ user_id: userId })
            .select('id')
            .single();
        if (newCart) userCartId = newCart.id;
    }

    if (!userCartId) return { error: 'Failed to get user cart' };

    // 2. Move items from Guest Cart to User Cart
    const { data: guestItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', guestCartId);

    if (guestItems && guestItems.length > 0) {
        for (const item of guestItems) {
            // Check collision
            const { data: existing } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('cart_id', userCartId)
                .eq('book_id', item.book_id)
                .single();

            if (existing) {
                await supabase
                    .from('cart_items')
                    .update({ quantity: existing.quantity + item.quantity })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('cart_items')
                    .insert({
                        cart_id: userCartId,
                        book_id: item.book_id,
                        quantity: item.quantity
                    });
            }
        }
    }

    // 3. Delete Guest Cart (Items cascade delete, but we moved them... 
    // Wait, if we moved them by INSERT, we need to delete the old ones. 
    // If we moved by UPDATE cart_id, that's easier given unique constraints might fail.
    // The loop above does Insert/Update. So we can safely delete the guest cart now.

    await supabase.from('carts').delete().eq('id', guestCartId);

    return { success: true };
}
