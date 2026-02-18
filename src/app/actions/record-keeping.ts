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

    return { invoices };
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

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);

    // 2. Insert Record into DB
    const { error: dbError } = await supabase
        .from('invoices')
        .insert({
            file_url: publicUrl,
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
    // Extract path from URL. Assumption: URL format matches Supabase standard
    // e.g., .../storage/v1/object/public/invoices/filename.pdf
    const path = fileUrl.split('/invoices/').pop();
    if (path) {
        await supabase.storage.from('invoices').remove([path]);
    }

    revalidatePath('/admin/record-keeping');
    return { success: true };
}
