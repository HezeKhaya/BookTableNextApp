'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Header from '@/components/Header';

export default function AddBookPage() {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            setStatus('error');
            setMessage('Please enter a code');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch(`/api/add-book?code=${encodeURIComponent(code)}`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            setStatus('success');
            setMessage('Book added successfully!');
            setCode('');
        } catch (error) {
            console.error('Failed to add book:', error);
            setStatus('error');
            setMessage('Failed to add book. Please try again.');
        }
    };

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <h1 className={styles.title}>Add a New Book</h1>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="code" className={styles.label}>
                            Book Code
                        </label>
                        <input
                            type="text"
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter book code"
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
