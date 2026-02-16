'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { getBooks, updateStock, deleteBook } from '@/app/actions/book';
import { Book } from '@/types/database.types';
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function StockManagement() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editQty, setEditQty] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState('');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role_id <= 1) {
                router.push('/');
                return;
            }
            fetchBooks();
        }
    }, [user, authLoading, router]);

    const fetchBooks = async () => {
        setLoading(true);
        const { books, error } = await getBooks();
        if (books) {
            setBooks(books);
        }
        setLoading(false);
    };

    const filteredBooks = books.filter(book => {
        const query = searchQuery.toLowerCase();
        return (
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            (book.sku_number && book.sku_number.toLowerCase().includes(query)) ||
            (book.code && book.code.toString().includes(query))
        );
    });

    const handleEditClick = (book: Book) => {
        setEditingId(book.id);
        const currentQty = book.qty_in_stock ?? 0; // Handle null/undefined
        setEditQty(currentQty);
    };

    const handleSaveClick = async (bookId: number) => {
        const result = await updateStock(bookId, editQty);
        if (result.success) {
            setBooks(books.map(b => b.id === bookId ? { ...b, qty_in_stock: editQty } : b));
            setEditingId(null);
        } else {
            alert('Failed to update stock');
        }
    };

    const handleCancelClick = () => {
        setEditingId(null);
    };

    const handleDeleteClick = async (bookId: number) => {
        if (confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
            const result = await deleteBook(bookId);
            if (result.success) {
                setBooks(books.filter(b => b.id !== bookId));
            } else {
                alert('Failed to delete book');
            }
        }
    };

    if (authLoading || loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!user || user.role_id <= 1) {
        return null;
    }

    return (
        <main>
            <Header showSearch={false} />
            <div className={`container ${styles.container}`}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.title}>Stock Management</h1>
                    <Link href="/add-book" className={styles.addBtn}>
                        <Plus size={20} />
                        Add Book
                    </Link>
                </div>

                <div className={styles.filtersBar}>
                    <div className={styles.searchWrapper}>
                        <input
                            type="text"
                            placeholder="Search by title, author, or code..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Code (ISBN)</th>
                                <th>Title</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBooks.map((book) => (
                                <tr key={book.id}>
                                    <td className={styles.codeCell}>{book.sku_number || book.code || 'N/A'}</td>
                                    <td>
                                        <div className={styles.bookTitle}>{book.title}</div>
                                        <div className={styles.bookAuthor}>{book.author}</div>
                                    </td>
                                    <td>R {book.price}</td>
                                    <td>
                                        {editingId === book.id ? (
                                            <input
                                                type="number"
                                                value={editQty}
                                                onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                                                className={styles.qtyInput}
                                                min="0"
                                            />
                                        ) : (
                                            book.qty_in_stock
                                        )}
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            {editingId === book.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSaveClick(book.id)}
                                                        className={styles.actionBtnSave}
                                                        title="Save"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelClick}
                                                        className={styles.actionBtnCancel}
                                                        title="Cancel"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEditClick(book)}
                                                        className={styles.actionBtnEdit}
                                                        title="Edit Stock"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(book.id)}
                                                        className={styles.actionBtnDelete}
                                                        title="Delete Book"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
