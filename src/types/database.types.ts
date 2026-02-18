export interface Book {
    id: number;
    sku_number: string;
    code: number;
    author: string;
    title: string;
    extended_title?: string | null;
    qty_in_stock: number;
    retail: number;
    discount: number;
    price: number;
    cover: string;
    mass: number;
    category: string;
    publisher: string;
    supplier: string;
    created_at: string;
    image_url: string;
}

export interface User {
    id: string; // uuid
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    role_id: number;
}

export interface Role {
    id: number;
    name: string;
}

export interface Invoice {
    id: string;
    file_url: string;
    supplier_name: string;
    invoice_date: string;
    amount: number;
    created_at: string;
}

export interface Customer {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email?: string;
    linked_user_id?: string;
    created_at: string;
}

export interface Sale {
    id: string;
    customer_id: string;
    total_amount: number;
    payment_type: 'CASH' | 'EFT';
    payment_status: 'PENDING' | 'PAID';
    pop_file_url?: string;
    admin_notes?: string;
    created_at: string;
}

export interface SaleItem {
    id: string;
    sale_id: string;
    book_id: number;
    quantity: number;
    price_at_sale: number;
}

export interface StockSnapshot {
    id: string;
    snapshot_date: string;
    total_books_count: number;
    total_value: number;
    created_by: string;
    data: any; // jsonb
}
