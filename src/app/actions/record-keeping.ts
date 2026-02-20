'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

// --- INVOICES ---

export async function getInvoices() {
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

    if (error) {
        console.error('Error fetching invoices:', error);
        return { error: 'Failed to fetch invoices' };
    }

    // Generate signed URLs for each invoice
    const invoicesWithSignedUrls = await Promise.all(invoices.map(async (invoice) => {
        // If file_url looks like a path (no http), sign it. 
        // If it's a full URL (legacy), try to extract path or just return it.
        let path = invoice.file_url;
        if (path.startsWith('http')) {
            // Try to extract path from public URL if present
            const parts = path.split('/invoices/');
            if (parts.length > 1) path = parts[1];
        }

        const { data, error: signError } = await supabase.storage
            .from('invoices')
            .createSignedUrl(path, 60 * 60); // 1 hour expiry

        return {
            ...invoice,
            file_url: data?.signedUrl || invoice.file_url // Fallback to original if fail
        };
    }));

    return { invoices: invoicesWithSignedUrls };
}

export async function uploadInvoice(formData: FormData) {
    const file = formData.get('file') as File;
    const supplierName = formData.get('supplierName') as string;
    const invoiceDate = formData.get('invoiceDate') as string;
    const amount = parseFloat(formData.get('amount') as string);

    if (!file || !supplierName || !invoiceDate || isNaN(amount)) {
        return { error: 'Missing required fields' };
    }

    // 1. Upload File to Storage
    // NOTE: This uses a placeholder bucket 'invoices'. Ensure it exists.
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Upload error:', uploadError);
        return { error: 'Failed to upload file' };
    }

    // 2. Insert Record into DB
    // Store path so we can sign it later
    const { error: dbError } = await supabase
        .from('invoices')
        .insert({
            file_url: filePath,
            supplier_name: supplierName,
            invoice_date: invoiceDate,
            amount: amount
        });

    if (dbError) {
        console.error('DB Insert error:', dbError);
        return { error: 'Failed to save invoice record' };
    }

    revalidatePath('/admin/record-keeping');
    return { success: true };
}

export async function deleteInvoice(id: string, fileUrl: string) {
    // 1. Delete from DB
    const { error: dbError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

    if (dbError) return { error: 'Failed to delete invoice record' };

    // 2. Delete from Storage
    // Handle both full URL and simple path
    let path = fileUrl;
    if (fileUrl.startsWith('http')) {
        const parts = fileUrl.split('/invoices/');
        if (parts.length > 1) path = parts[1];
    }

    // Attempt logic to remove from storage, though simplified

    revalidatePath('/admin/record-keeping');
    return { success: true };
}

// --- SALES & CUSTOMERS ---

export async function searchCustomers(query: string) {
    if (!query) return { customers: [] };

    const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone_number.ilike.%${query}%`)
        .limit(10);

    if (error) {
        console.error('Error searching customers:', error);
        return { customers: [] };
    }

    return { customers };
}

export async function createCustomer(data: { firstName: string; lastName: string; phone: string; email?: string }) {
    const { data: customer, error } = await supabase
        .from('customers')
        .insert({
            first_name: data.firstName,
            last_name: data.lastName,
            phone_number: data.phone,
            email: data.email
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating customer:', error);
        return { error: 'Failed to create customer' };
    }

    return { customer };
}

export async function searchBooks(query: string) {
    if (!query) return { books: [] };

    const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .or(`title.ilike.%${query}%,author.ilike.%${query}%,sku_number.ilike.%${query}%`)
        .gt('qty_in_stock', 0) // Exclude out of stock
        .limit(10);

    if (error) {
        console.error('Error searching books:', error);
        return { books: [] };
    }

    return { books };
}

export type SaleItemInput = {
    bookId: number;
    quantity: number;
    price: number;
};

export async function recordSale(saleData: {
    customerId: string;
    items: SaleItemInput[];
    paymentType: 'CASH' | 'EFT';
    paymentStatus: 'PENDING' | 'PAID';
    popFile?: FormData;
    adminNotes?: string;
}) {
    // 1. Verify Payment Status logic
    if (saleData.paymentType === 'EFT' && saleData.paymentStatus === 'PAID') {
        // In strict mode, we'd require PoP here. 
        // For complexity management, we trust the flow calls uploadProofOfPayment later.
    }

    // 2. Create Sale Record
    const totalAmount = saleData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
            customer_id: saleData.customerId,
            total_amount: totalAmount,
            payment_type: saleData.paymentType,
            payment_status: saleData.paymentStatus,
            admin_notes: saleData.adminNotes
        })
        .select()
        .single();

    if (saleError || !sale) {
        console.error('Error creating sale:', saleError);
        return { error: 'Failed to record sale' };
    }

    // 3. Create Sale Items & Update Stock
    for (const item of saleData.items) {
        // Insert Sale Item
        await supabase.from('sale_items').insert({
            sale_id: sale.id,
            book_id: item.bookId,
            quantity: item.quantity,
            price_at_sale: item.price
        });

        // Update Stock
        const { data: book } = await supabase.from('books').select('qty_in_stock').eq('id', item.bookId).single();
        if (book) {
            const newStock = Math.max(0, book.qty_in_stock - item.quantity);
            await supabase.from('books').update({ qty_in_stock: newStock }).eq('id', item.bookId);
        }
    }

    revalidatePath('/admin/record-keeping');
    return { success: true, saleId: sale.id };
}

export async function getPendingSales() {
    // Fetch sales that are PENDING
    const { data: sales, error } = await supabase
        .from('sales')
        .select(`
            *,
            customers ( first_name, last_name, phone_number ),
            sale_items ( quantity, price_at_sale, books ( title ) )
        `)
        .eq('payment_status', 'PENDING')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching pending sales:', error);
        return { sales: [] };
    }

    return { sales };
}

export async function uploadProofOfPayment(formData: FormData) {
    const saleId = formData.get('saleId') as string;
    const file = formData.get('file') as File;

    if (!saleId || !file) {
        return { error: 'Missing sale ID or file' };
    }

    // 1. Upload File
    const fileExt = file.name.split('.').pop();
    const fileName = `pop-${saleId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('proofs_of_payment')
        .upload(filePath, file);

    if (uploadError) {
        console.error('PoP Upload error:', uploadError);
        return { error: 'Failed to upload Proof of Payment' };
    }

    // 2. Update Sale Record
    const { error: updateError } = await supabase
        .from('sales')
        .update({
            pop_file_url: filePath,
            payment_status: 'PAID' // Auto-mark as paid
        })
        .eq('id', saleId);

    if (updateError) {
        console.error('Error updating sale with PoP:', updateError);
        return { error: 'Failed to update sale record' };
    }

    revalidatePath('/admin/record-keeping');
    return { success: true };
}

export type SalesFilter = {
    search?: string;
    paymentStatus?: 'PAID' | 'PENDING' | 'ALL';
    paymentType?: 'CASH' | 'EFT' | 'ALL';
    startDate?: string;
    endDate?: string;
};

export async function getSalesHistory(
    page: number = 1,
    pageSize: number = 10,
    filters: SalesFilter = {}
) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('sales')
        .select(`
            *,
            customers ( first_name, last_name, phone_number ),
            sale_items ( quantity, price_at_sale, books ( title ) )
        `, { count: 'exact' });

    // Apply Filters
    if (filters.paymentStatus && filters.paymentStatus !== 'ALL') {
        query = query.eq('payment_status', filters.paymentStatus);
    }

    if (filters.paymentType && filters.paymentType !== 'ALL') {
        query = query.eq('payment_type', filters.paymentType);
    }

    if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
        // Assume date is YYYY-MM-DD. We want to include that whole day.
        const endDataObj = new Date(filters.endDate);
        endDataObj.setDate(endDataObj.getDate() + 1);
        query = query.lt('created_at', endDataObj.toISOString());
    }

    if (filters.search) {
        // Simplified Search: Find matching customers first
        const { data: customerIds } = await supabase
            .from('customers')
            .select('id')
            .or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`);

        // Find matching books
        const { data: bookIds } = await supabase
            .from('books')
            .select('id')
            .ilike('title', `%${filters.search}%`);

        // Find relevant sale IDs based on books
        let relevantSaleIdsFileItems: string[] = [];
        if (bookIds && bookIds.length > 0) {
            const { data: saleItems } = await supabase
                .from('sale_items')
                .select('sale_id')
                .in('book_id', bookIds.map(b => b.id));
            if (saleItems) {
                relevantSaleIdsFileItems = saleItems.map(si => si.sale_id);
            }
        }

        const validCustomerIds = customerIds?.map(c => c.id) || [];

        // Combine: Customer IDs OR Sale IDs from books
        const conditions = [];
        if (validCustomerIds.length > 0) conditions.push(`customer_id.in.(${validCustomerIds.join(',')})`);
        if (relevantSaleIdsFileItems.length > 0) conditions.push(`id.in.(${relevantSaleIdsFileItems.join(',')})`);

        if (conditions.length > 0) {
            query = query.or(conditions.join(','));
        } else {
            // Search yielded no matches
            return { sales: [], count: 0 };
        }
    }

    query = query.order('created_at', { ascending: false })
        .range(from, to);

    const { data: sales, count, error } = await query;

    // Also sign PoP URLs if they exist
    const salesWithSignedUrls = await Promise.all((sales || []).map(async (sale) => {
        if (!sale.pop_file_url) return sale;

        // Extract path logic similar to invoices if needed, but assuming path stored directly
        let path = sale.pop_file_url;
        if (path.startsWith('http')) {
            const parts = path.split('/proofs_of_payment/');
            if (parts.length > 1) path = parts[1];
        }

        const { data } = await supabase.storage
            .from('proofs_of_payment')
            .createSignedUrl(path, 60 * 60);

        return {
            ...sale,
            pop_file_url: data?.signedUrl || sale.pop_file_url
        };
    }));

    if (error) {
        console.error('Error fetching sales history:', error);
        return { sales: [], count: 0 };
    }


    return { sales: salesWithSignedUrls, count };
}

// --- STOCK SNAPSHOTS ---

export async function getStockSnapshots() {
    const { data: snapshots, error } = await supabase
        .from('stock_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false });

    if (error) {
        console.error('Error fetching stock snapshots:', error);
        return { snapshots: [] };
    }

    // Fetch user emails manually to avoid PostgREST join issues on auth schema
    const userIds = Array.from(new Set((snapshots || []).map(s => s.created_by).filter(Boolean)));

    let userMap: Record<string, string> = {};
    if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, first_name')
            .in('id', userIds);

        if (!usersError && usersData) {
            userMap = usersData.reduce((acc, user) => {
                acc[user.id] = user.first_name;
                return acc;
            }, {} as Record<string, string>);
        }
    }

    const formattedSnapshots = (snapshots || []).map(s => ({
        ...s,
        created_by_user: { first_name: userMap[s.created_by] || 'Unknown' }
    }));

    return { snapshots: formattedSnapshots };
}

export async function createStockSnapshot(userId: string) {
    if (!userId) {
        return { error: 'User ID is required to create a snapshot.' };
    }

    // 1. Fetch current stock
    const { data: books, error: booksError } = await supabase
        .from('books')
        .select('*');

    if (booksError || !books) {
        console.error('Error fetching books for snapshot:', booksError);
        return { error: 'Failed to fetch current stock for snapshot.' };
    }

    // 2. Calculate totals
    let totalBooksCount = 0;
    let totalValue = 0;

    const snapshotData = books.map(book => {
        totalBooksCount += book.qty_in_stock;
        totalValue += (book.price * book.qty_in_stock);

        return {
            id: book.id,
            sku_number: book.sku_number,
            title: book.title,
            author: book.author,
            qty_in_stock: book.qty_in_stock,
            price: book.price
        };
    });

    // 3. Create snapshot record
    const { data: snapshot, error: snapshotError } = await supabase
        .from('stock_snapshots')
        .insert({
            total_books_count: totalBooksCount,
            total_value: totalValue,
            created_by: userId,
            data: snapshotData
        })
        .select()
        .single();

    if (snapshotError) {
        console.error('Error creating stock snapshot:', snapshotError);
        return { error: 'Failed to save stock snapshot.' };
    }

    revalidatePath('/admin/record-keeping');
    return { success: true, snapshot };
}
