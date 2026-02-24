'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Fetch book details from supplier using Azure Function
export async function fetchBookDetailsFromSupplier(code: string) {
    if (!code) return { error: 'Code is required' };
    
    // Attempt to use NEXT_PUBLIC_API_URL or a fallback (user should configure this if it fails)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7071/api';
    
    try {
        const response = await fetch(`${baseUrl}/catalog/${code}`);
        if (!response.ok) {
            if (response.status === 404) return { error: `Book not found for code: ${code}` };
            return { error: `Failed to fetch book from supplier: ${response.statusText}` };
        }
        const textResponse = await response.text();
        let bookDto = null;
        
        // Attempt to parse out from RSC payload stream format
        const lines = textResponse.split('\n');
        for (const line of lines) {
            try {
                // Strip out the leading `1:` prefix if it exists in the stream
                const jsonStr = line.replace(/^\d+:[A-Z]?/, ''); 
                if (jsonStr.startsWith('{')) {
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.book || parsed.title || parsed.Title) { // Look for expected fields
                        bookDto = parsed.book || parsed;
                        break;
                    }
                }
            } catch(e) {
                // Ignore parse errors for lines that aren't JSON
            }
        }
        
        if (!bookDto) {
            // Fallback: try parsing the whole thing as standard JSON
            try {
                const parsed = JSON.parse(textResponse);
                bookDto = parsed.book || parsed;
            } catch (e) {
                console.error('Failed to parse supplier response:', textResponse);
                return { error: 'Invalid response format from supplier' };
            }
        }
        
        return { book: bookDto };
    } catch (e: any) {
        console.error('Error in fetchBookDetailsFromSupplier:', e);
        return { error: 'Failed to contact supplier API' };
    }
}

// Assure a book exists in local DB or add it (so we have a book_id for order_items)
export async function ensureBookExists(bookDto: any) {
    const supabase = await createClient();
    if (!bookDto) return null;
    
    // Try to find the book by sku_number (map Barcode/Code)
    const sku = bookDto.barcode || bookDto.Barcode || bookDto.code || bookDto.Code;
    if (!sku && sku !== 0) return null; // Abort if no identifiable code
    
    const { data: existingBook } = await supabase
        .from('books')
        .select('*')
        .eq('sku_number', sku.toString())
        .single();
        
    if (existingBook) {
        return existingBook;
    }
    
    // Insert if it doesn't exist
    // Add default price or 0 if undefined, qty to 0 because we're ordering it, not stocking it
    
    const weightVal = bookDto.mass ?? bookDto.Mass;
    const parsedWeight = weightVal ? parseFloat(weightVal.toString()) : null;
    
    const rawCode = bookDto.code ?? bookDto.Code;
    let finalCode: number;
    if (rawCode !== undefined && rawCode !== null && rawCode !== '') {
        finalCode = parseInt(rawCode.toString(), 10);
    } else {
        const cleanSku = sku.toString().replace(/B$/, '');
        finalCode = parseInt(cleanSku, 10);
        if (isNaN(finalCode)) finalCode = 0;
    }
    
    const { data: newBook, error } = await supabase
        .from('books')
        .insert({
            sku_number: sku.toString(),
            title: bookDto.title || bookDto.Title || 'Unknown Title',
            author: bookDto.author || bookDto.Author || 'Unknown Author',
            extended_title: bookDto.extendedTitle || bookDto.ExtendedTitle || null,
            image_url: bookDto.imageUrl || bookDto.ImageUrl || bookDto.cover || bookDto.Cover || null,
            price: bookDto.price || bookDto.Price || bookDto.retail || bookDto.Retail || 0,
            qty_in_stock: 0,
            retail: bookDto.retail || bookDto.Retail || 0,
            discount: bookDto.discount || bookDto.Discount || 0,
            category: bookDto.category || bookDto.Category || 'Uncategorized',
            mass: parsedWeight || 0,
            cover: bookDto.cover || bookDto.Cover || 'Unknown',
            publisher: bookDto.publisher || bookDto.Publisher || 'Unknown',
            supplier: bookDto.supplier || bookDto.Supplier || 'Unknown',
            code: finalCode
        })
        .select()
        .single();
        
    if (error) {
        console.error('Failed to insert new book during order capture:', error);
        return null;
    }
    
    return newBook;
}

export type OrderItemInput = {
    bookDto: any;
    quantity: number;
    price: number;
};

// Create a new order in CAPTURED state
export async function createOrder(customerId: string, items: OrderItemInput[], totalAmount: number) {
    const supabase = await createClient();
    if (!customerId || !items || items.length === 0) {
        return { error: 'Missing customer or items' };
    }
    
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            customer_id: customerId,
            total_amount: totalAmount,
            status: 'CAPTURED'
        })
        .select()
        .single();
        
    if (orderError || !order) {
        console.error('Error creating order:', orderError);
        return { error: 'Failed to create order' };
    }
    
    // Insert Order Items. We must ensure books exist first
    for (const item of items) {
        const book = await ensureBookExists(item.bookDto);
        if (!book) {
            console.error('Skipping item, failed to ensure book exists:', item.bookDto);
            // Delete the orphaned order if we fail to link its book
            await supabase.from('orders').delete().eq('id', order.id);
            return { error: 'Failed to find or link book details. Order was cancelled.' };
        }
        
        await supabase.from('order_items').insert({
            order_id: order.id,
            book_id: book.id,
            quantity: item.quantity,
            price: item.price
        });
    }
    
    revalidatePath('/admin/capture-orders');
    return { success: true, orderId: order.id };
}

// Fetch Orders
export async function getOrders() {
    const supabase = await createClient();
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            customers ( first_name, last_name, phone_number ),
            order_items ( quantity, price, books ( title, author, image_url ) )
        `)
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error('Error fetching orders:', error);
        return { orders: [] };
    }
    
    // Sign invoice URLs if they exist
    const ordersWithSignedUrls = await Promise.all((orders || []).map(async (order) => {
        if (!order.invoice_file_url) return order;

        let path = order.invoice_file_url;
        if (path.startsWith('http')) {
            const parts = path.split('/invoices/');
            if (parts.length > 1) path = parts[1];
        }

        const { data } = await supabase.storage
            .from('invoices')
            .createSignedUrl(path, 60 * 60);

        return {
            ...order,
            invoice_file_url: data?.signedUrl || order.invoice_file_url
        };
    }));
    
    return { orders: ordersWithSignedUrls };
}

// Upload Invoice for an order
export async function uploadOrderInvoice(formData: FormData) {
    const supabase = await createClient();
    const orderId = formData.get('orderId') as string;
    const file = formData.get('file') as File;
    
    if (!orderId || !file) {
        return { error: 'Missing order ID or file' };
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `order-invoice-${orderId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file);
        
    if (uploadError) {
        console.error('Invoice Upload error:', uploadError);
        return { error: 'Failed to upload Invoice' };
    }
    
    const { error: updateError } = await supabase
        .from('orders')
        .update({ invoice_file_url: filePath })
        .eq('id', orderId);
        
    if (updateError) {
        console.error('Error updating order with Invoice:', updateError);
        return { error: 'Failed to update order record' };
    }
    
    // Automatically transition to READY
    await updateOrderStatus(orderId, 'READY');
    
    revalidatePath('/admin/capture-orders');
    return { success: true };
}

// Delete an order completely
export async function deleteOrder(orderId: string) {
    const supabase = await createClient();
    if (!orderId) return { error: 'Missing order ID' };
    
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
        
    if (error) {
        console.error('Error deleting order:', error);
        return { error: 'Failed to delete order' };
    }
    
    revalidatePath('/admin/capture-orders');
    revalidatePath('/admin/record-keeping');
    revalidatePath('/admin/capture-sales');
    return { success: true };
}

// Move order status and handle consequence if changed to READY
export async function updateOrderStatus(orderId: string, newStatus: 'CAPTURED' | 'READY' | 'COLLECTED') {
    const supabase = await createClient();
    if (!orderId) return { error: 'Missing order ID' };
    
    // Fetch order first to check its current status
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();
        
    if (fetchError || !order) {
        return { error: 'Failed to locate order' };
    }
    
    // If it is moving to READY, and it wasn't READY before... we treat it as a new Sale!
    // But what if they change it back to CAPTURED, or from READY to COLLECTED? 
    // To prevent duplicate sales, let's only do it if the order isn't already beyond CAPTURED
    if (newStatus === 'READY' && order.status === 'CAPTURED') {
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert({
                customer_id: order.customer_id,
                total_amount: order.total_amount,
                payment_type: 'CASH', // default to CASH can be updated later
                payment_status: 'ORDERED', // new status
                admin_notes: `Linked to Order ${order.id}`
            })
            .select()
            .single();
            
        if (saleError || !sale) {
            console.error('Failed to create sale for order:', saleError);
            return { error: 'Failed to transition to READY due to sales creation failure' };
        }
        
        // Copy order items to sale items
        for (const item of order.order_items) {
            // we don't adjust stock because this is a special order scenario
            await supabase.from('sale_items').insert({
                sale_id: sale.id,
                book_id: item.book_id,
                quantity: item.quantity,
                price_at_sale: item.price
            });
            
            // Adjust stock strictly for the items coming in from supplier?
            // Actually, if we just ordered it and it's READY for collection, maybe we shouldn't bump stock if selling instantly.
            // But let's increment stock, because the normal sales flow might decrement it later if it moves from ORDERED -> PENDING maybe?
            // Actually, the user requirement mentions: "once an order is in the READY state it should be treated as a normal sale... There should be a way to move books from the ORDERED state to the PENDING or PAID state".
            // If they are just changing status, maybe normal sales logic is kept intact if we just map it.
        }
    }
    
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
    if (updateError) {
        console.error('Status update failed:', updateError);
        return { error: 'Failed to update order status' };
    }
    
    revalidatePath('/admin/capture-orders');
    revalidatePath('/admin/record-keeping');
    revalidatePath('/admin/capture-sales');
    return { success: true };
}
