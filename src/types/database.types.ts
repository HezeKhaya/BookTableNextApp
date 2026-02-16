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
