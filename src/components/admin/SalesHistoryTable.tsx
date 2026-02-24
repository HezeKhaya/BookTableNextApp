'use client';

import { useState, useEffect } from 'react';
import { getSalesHistory, SalesFilter } from '@/app/actions/record-keeping';
import { Search, Loader2, FileText, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import styles from './SalesHistoryTable.module.css';

// Define types based on action response
type Sale = {
    id: string;
    created_at: string;
    total_amount: number;
    payment_type: 'CASH' | 'EFT';
    payment_status: 'PAID' | 'PENDING' | 'ORDERED';
    pop_file_url?: string;
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

export default function SalesHistoryTable() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);

    // Filters
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'ALL' | 'PAID' | 'PENDING' | 'ORDERED'>('ALL');
    const [type, setType] = useState<'ALL' | 'CASH' | 'EFT'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchSales();
    }, [page, status, type, startDate, endDate]); // Trigger on filter change (debounced search handled separately ideally, but simplified here)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) fetchSales();
            else setPage(1); // Reset to page 1 which triggers fetch
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchSales = async () => {
        setLoading(true);
        const filters: SalesFilter = {
            search: search || undefined,
            paymentStatus: status,
            paymentType: type,
            startDate: startDate || undefined,
            endDate: endDate || undefined
        };

        const { sales, count } = await getSalesHistory(page, pageSize, filters);
        if (sales) setSales(sales as unknown as Sale[]);
        if (count !== null) setCount(count || 0);
        setLoading(false);
    };

    const handleStatusChange = async (saleId: string, currentType: 'CASH' | 'EFT', newStatus: 'PAID' | 'PENDING') => {
        // Validation per user rules
        if (currentType === 'EFT' && newStatus === 'PAID') {
            alert('Cannot mark an EFT sale as PAID from here. Please upload a Proof of Payment (Invoice/PoP).');
            return;
        }

        const confirmMsg = `Are you sure you want to change the status to ${newStatus}?`;
        if (!confirm(confirmMsg)) return;

        const { updateSaleStatus } = await import('@/app/actions/record-keeping');
        const { success, error } = await updateSaleStatus(saleId, newStatus);
        
        if (success) {
            fetchSales();
        } else {
            alert(error || 'Failed to update status');
        }
    };

    const totalPages = Math.ceil(count / pageSize);

    return (
        <div className={styles.wrapper}>
            {/* Filters Bar */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search Customer or Book..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className={styles.select}
                >
                    <option value="ALL">All Status</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="ORDERED">Ordered</option>
                </select>

                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className={styles.select}
                >
                    <option value="ALL">All Types</option>
                    <option value="CASH">Cash</option>
                    <option value="EFT">EFT</option>
                </select>

                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={styles.dateInput}
                />
                <span className={styles.to}>to</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={styles.dateInput}
                />
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Proof</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className={styles.loadingCell}>
                                    <Loader2 className="animate-spin" /> Loading...
                                </td>
                            </tr>
                        ) : sales.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.emptyCell}>No sales found.</td>
                            </tr>
                        ) : (
                            sales.map(sale => (
                                <tr key={sale.id}>
                                    <td>{new Date(sale.created_at).toLocaleDateString()} {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>
                                        <div className={styles.customerInfo}>
                                            <span className={styles.custName}>
                                                {sale.customers ? `${sale.customers.first_name} ${sale.customers.last_name}` : 'Unknown'}
                                            </span>
                                            {sale.customers && (
                                                <span className={styles.custPhone}>{sale.customers.phone_number}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.itemsList}>
                                            {sale.sale_items.map((item, i) => (
                                                <div key={i} className={styles.itemRow}>
                                                    <span className={styles.qty}>{item.quantity}x</span>
                                                    <span className={styles.bookTitle}>{item.books?.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className={styles.amount}>R {sale.total_amount.toFixed(2)}</td>
                                    <td>
                                        <span className={`${styles.badge} ${styles[sale.payment_type]}`}>
                                            {sale.payment_type}
                                        </span>
                                    </td>
                                    <td>
                                        {sale.payment_status === 'ORDERED' ? (
                                            <select 
                                                className={styles.statusSelect}
                                                value="ORDERED"
                                                onChange={(e) => handleStatusChange(sale.id, sale.payment_type, e.target.value as any)}
                                            >
                                                <option value="ORDERED" disabled>ORDERED</option>
                                                <option value="PENDING">Mark PENDING</option>
                                                <option value="PAID">Mark PAID</option>
                                            </select>
                                        ) : (
                                            <span className={`${styles.statusBadge} ${styles[sale.payment_status]}`}>
                                                {sale.payment_status}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {sale.pop_file_url ? (
                                            <a
                                                href={sale.pop_file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.viewLink}
                                            >
                                                <Eye size={16} /> View
                                            </a>
                                        ) : (
                                            <span className={styles.noPop}>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className={styles.pageBtn}
                >
                    <ChevronLeft size={20} />
                </button>
                <span className={styles.pageInfo}>Page {page} of {totalPages || 1}</span>
                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className={styles.pageBtn}
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
