'use client';

import { useState, useEffect } from 'react';
import { searchBooks } from '@/app/actions/record-keeping';
import { Book } from '@/types/database.types';
import { Search, Loader2 } from 'lucide-react';
import styles from './BookSearch.module.css';

interface BookSearchProps {
    onSelectBook: (book: Book) => void;
}

export default function BookSearch({ onSelectBook }: BookSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        const { books } = await searchBooks(query);
        if (books) {
            setResults(books as unknown as Book[]);
        }
        setLoading(false);
    };

    const handleSelect = (book: Book) => {
        onSelectBook(book);
        setQuery('');
        setResults([]);
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.searchBox}>
                <Search className={styles.searchIcon} size={18} />
                <input
                    type="text"
                    placeholder="Search books by title, author, or sku..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {loading && <div className={styles.loading}><Loader2 className="animate-spin" size={20} /></div>}

            {results.length > 0 && (
                <ul className={styles.resultsList}>
                    {results.map(book => (
                        <li key={book.id} onClick={() => handleSelect(book)}>
                            <strong>{book.title}</strong>
                            <span>{book.author} | Stock: {book.qty_in_stock} | R{book.price}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
