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
