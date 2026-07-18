'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

export default function AddBookPage() {
    const [identifier, setIdentifier] = useState('');
    const [quantity, setQuantity] = useState<number | ''>(1);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user || user.role_id <= 1) {
                router.push('/');
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!user || user.role_id <= 1) {
        return null; // Or return nothing while redirecting
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!identifier.trim()) {
            setStatus('error');
            setMessage('Please enter a book code or SKU number');
            return;
        }

        if (quantity === '' || quantity < 1) {
            setStatus('error');
            setMessage('Please enter a valid quantity');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch(`/api/add-book?identifier=${encodeURIComponent(identifier)}&quantity=${encodeURIComponent(quantity.toString())}`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error: ${response.statusText}`);
            }

            setStatus('success');
            setMessage('Book added successfully!');
            setIdentifier('');
            setQuantity(1);
        } catch (error: any) {
            console.error('Failed to add book:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to add book. Please try again.');
        }
    };

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <h1 className={styles.title}>Add a New Book</h1>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="identifier" className={styles.label}>
                            Book Code or SKU
                        </label>
                        <input
                            type="text"
                            id="identifier"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="Enter book code or SKU number"
                            className={styles.input}
                            disabled={status === 'loading'}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="quantity" className={styles.label}>
                            Quantity
                        </label>
                        <input
                            type="number"
                            id="quantity"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Enter quantity"
                            className={styles.input}
                            disabled={status === 'loading'}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? 'Adding...' : 'Add Book'}
                    </button>

                    {status === 'success' && (
                        <div className={`${styles.message} ${styles.success}`}>
                            {message}
                        </div>
                    )}

                    {status === 'error' && (
                        <div className={`${styles.message} ${styles.error}`}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </main>
    );
}
