'use client';

import { useState, useEffect } from 'react';
import { getStockSnapshots, createStockSnapshot } from '@/app/actions/record-keeping';
import { Loader2, Camera, Eye, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './StockSnapshotsTab.module.css';

import { supabase } from '@/lib/supabaseClient';

type Snapshot = {
    id: string;
    snapshot_date: string;
    total_books_count: number;
    total_value: number;
    created_by: string;
    data: any; // jsonb array of books
    created_by_user?: { first_name: string };
};

export default function StockSnapshotsTab() {
    const { user } = useAuth();
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [takingSnapshot, setTakingSnapshot] = useState(false);

    // Modal state
    const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

    useEffect(() => {
        fetchSnapshots();
    }, []);

    const fetchSnapshots = async () => {
        setLoading(true);
        const { snapshots } = await getStockSnapshots();
        if (snapshots) {
            setSnapshots(snapshots as unknown as Snapshot[]);
        }
        setLoading(false);
    };

    const handleTakeSnapshot = async () => {
        setTakingSnapshot(true);
        try {
            const userId = user?.id;

            if (!userId) {
                alert("You must be logged in to take a snapshot.");
                setTakingSnapshot(false);
                return;
            }

            const res = await createStockSnapshot(userId);
            if (res.error) {
                alert("Error: " + res.error);
            } else {
                alert("Snapshot captured successfully!");
                await fetchSnapshots(); // Reload list
            }
        } catch (error) {
            console.error("Failed to take snapshot", error);
            alert("An unexpected error occurred.");
        } finally {
            setTakingSnapshot(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h2>Inventory Snapshots</h2>
                <button
                    className={styles.actionButton}
                    onClick={handleTakeSnapshot}
                    disabled={takingSnapshot || loading}
                >
                    {takingSnapshot ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                    Take Snapshot
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date Captured</th>
                            <th>Total Books in Stock</th>
                            <th>Total Inventory Value</th>
                            <th>Captured By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className={styles.loadingCell}>
                                    <Loader2 className="animate-spin" /> Fetching snapshots...
                                </td>
                            </tr>
                        ) : snapshots.length === 0 ? (
                            <tr>
                                <td colSpan={5} className={styles.emptyCell}>No snapshots found.</td>
                            </tr>
                        ) : (
                            snapshots.map(snapshot => (
                                <tr key={snapshot.id}>
                                    <td>
                                        {new Date(snapshot.snapshot_date).toLocaleDateString()}{' '}
                                        {new Date(snapshot.snapshot_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td>
                                        <span className={styles.badge}>{snapshot.total_books_count} items</span>
                                    </td>
                                    <td className={styles.amount}>R {snapshot.total_value.toFixed(2)}</td>
                                    <td>{snapshot.created_by_user?.first_name || 'Unknown'}</td>
                                    <td>
                                        <button
                                            className={styles.viewLink}
                                            onClick={() => setSelectedSnapshot(snapshot)}
                                        >
                                            <Eye size={16} /> Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Details Modal */}
            {selectedSnapshot && (
                <div className={styles.modalOverlay} onClick={() => setSelectedSnapshot(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Snapshot Details - {new Date(selectedSnapshot.snapshot_date).toLocaleString()}</h3>
                            <button className={styles.closeButton} onClick={() => setSelectedSnapshot(null)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.summaryCards}>
                                <div className={styles.card}>
                                    <span className={styles.cardLabel}>Total Books</span>
                                    <p className={styles.cardValue}>{selectedSnapshot.total_books_count}</p>
                                </div>
                                <div className={styles.card}>
                                    <span className={styles.cardLabel}>Total Value</span>
                                    <p className={styles.cardValue}>R {selectedSnapshot.total_value.toFixed(2)}</p>
                                </div>
                                <div className={styles.card}>
                                    <span className={styles.cardLabel}>Captured By</span>
                                    <p className={styles.cardValue} style={{ fontSize: '1.2rem' }}>{selectedSnapshot.created_by_user?.first_name || 'Unknown'}</p>
                                </div>
                            </div>

                            <h4>Inventory List at Time of Capture</h4>
                            <table className={styles.bookList}>
                                <thead>
                                    <tr>
                                        <th>SKU</th>
                                        <th>Title</th>
                                        <th>Author</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                        <th>Total Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedSnapshot.data || []).map((book: any) => (
                                        <tr key={book.id}>
                                            <td>{book.sku_number}</td>
                                            <td>{book.title}</td>
                                            <td>{book.author}</td>
                                            <td>{book.qty_in_stock}</td>
                                            <td>R {book.price.toFixed(2)}</td>
                                            <td style={{ fontWeight: 500 }}>R {(book.price * book.qty_in_stock).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {(!selectedSnapshot.data || selectedSnapshot.data.length === 0) && (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No items recorded in this snapshot.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
