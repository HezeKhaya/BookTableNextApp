'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import FilterChips from '@/components/FilterChips';
import BookCard from '@/components/BookCard';
import styles from '@/app/page.module.css';
import { Book } from '@/types/database.types';

interface ClientHomeProps {
    initialBooks: Book[];
}

export default function ClientHome({ initialBooks }: ClientHomeProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBooks = initialBooks.filter((book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className={styles.main}>
            <Header onSearch={setSearchQuery} />

            <div className={`container ${styles.content}`}>
                <section className={styles.hero}>
                    <h1 className={styles.heroTitle}>
                        Visit many good books <span className={styles.highlight}>but live in the Bible</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Discover the selection of books available at the Heritage Book Table
                    </p>
                </section>

                <nav className={styles.filters}>
                    <FilterChips />
                </nav>

                <section className={styles.grid}>
                    {filteredBooks.length > 0 ? (
                        filteredBooks.map((book) => (
                            <BookCard
                                key={book.id}
                                title={book.title}
                                author={book.author}
                                price={book.price}
                                originalPrice={book.retail > book.price ? book.retail : undefined}
                                coverImage={book.image_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'}
                                category={book.category}
                            />
                        ))
                    ) : (
                        <div className={styles.noResults}>
                            <p>No books found matching &quot;{searchQuery}&quot;</p>
                        </div>
                    )}
                </section>

                <div className={styles.viewMore}>
                    <button className={styles.viewMoreBtn}>View All Titles →</button>
                </div>
            </div>

            <footer className={styles.footer}>
                <div className={`container ${styles.footerContent}`}>
                    <div className={styles.newsletter}>
                        <h2 className={styles.newsletterTitle}>Join our literary circle</h2>
                        <p className={styles.newsletterText}>Receive curated book recommendations, early access to limited editions, and exclusive author interviews.</p>
                        <div className={styles.inputGroup}>
                            <input type="email" placeholder="Enter your email" className={styles.emailInput} />
                            <button className={styles.subscribeBtn}>Subscribe</button>
                        </div>
                    </div>

                    <div className={styles.footerLinks}>
                        <p className={styles.copyright}>© 2026 Book Table Inc. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
