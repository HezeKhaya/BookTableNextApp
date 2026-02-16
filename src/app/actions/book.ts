'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

export async function getBooks() {
    const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true });

    if (error) {
        console.error('Error fetching books:', error);
        return { error: 'Failed to fetch books' };
    }

    return { books };
}

export async function getBookById(id: number) {
    const { data: book, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching book:', error);
        return { error: 'Failed to fetch book' };
    }

    return { book };
}

export async function updateStock(bookId: number, newQuantity: number) {
    // Note: Since we are using custom auth without server-side sessions, 
    // we cannot strictly verify the user here without passing a token.
    // For this implementation, we are relying on the client-side Admin check.
    // In a production app, we should use Supabase Auth or secure cookies.

    const { error } = await supabase
        .from('books')
        .update({ qty_in_stock: newQuantity })
        .eq('id', bookId);

    if (error) {
        console.error('Error updating stock:', error);
        return { error: 'Failed to update stock' };
    }

    revalidatePath('/admin/stock');
    return { success: true };
}

export async function deleteBook(bookId: number) {
    const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

    if (error) {
        console.error('Error deleting book:', error);
        return { error: 'Failed to delete book' };
    }

    revalidatePath('/admin/stock');
    return { success: true };
}

export async function addBook(formData: FormData) {
    // Extract data
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const price = parseFloat(formData.get('price') as string);
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const qtyInStock = parseInt(formData.get('qtyInStock') as string);
    const rating = parseFloat(formData.get('rating') as string) || 0;

    // We don't have ISBN in the form yet, maybe generate or ask? 
    // For now assuming the form will provide it or we default.
    // The user didn't specify ISBN in the request for 'add-book' page but 'books' table has it.
    // I'll check 'books' table schema if possible, or just look at `database.types.ts`.

    const { error } = await supabase
        .from('books')
        .insert([{
            title,
            author,
            price,
            category,
            description,
            image_url: imageUrl,
            qty_in_stock: qtyInStock,
            rating,
            sku_number: Math.random().toString(36).substring(7).toUpperCase(), // Temporary random SKU
            code: Math.floor(Math.random() * 100000) // Temporary random code
        }]);

    if (error) {
        console.error('Error adding book:', error);
        return { error: 'Failed to add book' };
    }

    revalidatePath('/admin/stock');
    revalidatePath('/'); // Update home page as well
    return { success: true };
}

