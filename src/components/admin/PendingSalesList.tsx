'use client';

import { useState, useEffect } from 'react';
import { getPendingSales, uploadProofOfPayment } from '@/app/actions/record-keeping';
import { Loader2, Upload, FileText, CheckCircle } from 'lucide-react';
import styles from './PendingSalesList.module.css';

// Define types based on the query response
type PendingSale = {
    id: string;
    created_at: string;
    total_amount: number;
    payment_type: string;
    customers: {
        first_name: string;
        last_name: string;
        phone_number: string;
    } | null;
    sale_items: {
        quantity: number;
        price_at_sale: number;
        books: {
            title: string;
        } | null;
    }[];
};

export default function PendingSalesList() {
    const [sales, setSales] = useState<PendingSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadિંગId, setUploadingId] = useState<string | null>(null);

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        setLoading(true);
        const { sales } = await getPendingSales();
        if (sales) {
            setSales(sales as unknown as PendingSale[]);
        }
        setLoading(false);
    };

    const handleFileChange = async (saleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert('File too large (max 2MB)');
            return;
        }

        setUploadingId(saleId);

        const formData = new FormData();
        formData.append('saleId', saleId);
        formData.append('file', file);

        const { success, error } = await uploadProofOfPayment(formData);

        setUploadingId(null);
        if (success) {
            alert('Proof of Payment uploaded! Sale marked as PAID.');
            loadSales(); // Refresh list (item should disappear)
        } else {
            alert(error || 'Failed to upload');
        }
    };

    if (loading) return <div className={styles.loading}><Loader2 className="animate-spin" /> Loading pending sales...</div>;

    if (sales.length === 0) {
        return <div className={styles.emptyState}><CheckCircle size={48} className={styles.emptyIcon} /><p>No pending sales requiring Proof of Payment.</p></div>;
    }

    return (
        <div className={styles.wrapper}>
            <h3 className={styles.title}>Pending EFT Sales ({sales.length})</h3>
            <div className={styles.list}>
                {sales.map(sale => (
                    <div key={sale.id} className={styles.saleCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.customer}>
                                <span className={styles.name}>
                                    {sale.customers ? `${sale.customers.first_name} ${sale.customers.last_name}` : 'Unknown Customer'}
                                </span>
                                <span className={styles.date}>{new Date(sale.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.amount}>
                                R {sale.total_amount.toFixed(2)}
                            </div>
                        </div>

                        <div className={styles.itemsSummary}>
                            {sale.sale_items.map((item, idx) => (
                                <span key={idx} className={styles.itemTag}>
                                    {item.quantity}x {item.books?.title || 'Unknown Book'}
                                </span>
                            ))}
                        </div>

                        <div className={styles.actions}>
                            <label className={styles.uploadBtn}>
                                {uploadિંગId === sale.id ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <Upload size={16} />
                                )}
                                <span>{uploadિંગId === sale.id ? 'Uploading...' : 'Upload PoP'}</span>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileChange(sale.id, e)}
                                    disabled={!!uploadિંગId}
                                    className={styles.hiddenInput}
                                />
                            </label>
                            <span className={styles.status}>Pending EFT</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
