import { getBookById } from '@/app/actions/book';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Heart } from 'lucide-react';
import styles from './page.module.css';
import AddToCartButton from '@/components/AddToCartButton';

export default async function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { book, error } = await getBookById(parseInt(id));

    if (error || !book) {
        return (
            <main>
                <Header />
                <div className="container">
                    <div className={styles.errorContainer}>
                        <h1>Book not found</h1>
                        <p>We couldn't find the book you're looking for.</p>
                        <Link href="/" className={styles.backLink}>
                            Start Over
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main>
            <Header />
            <div className={`container ${styles.container}`}>
                <Link href="/" className={styles.backLink}>
                    <ArrowLeft size={20} />
                    Back to Catalog
                </Link>

                <div className={styles.contentWrapper}>
                    <div className={styles.imageSection}>
                        <div className={styles.imageContainer}>
                            <Image
                                src={book.image_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'}
                                alt={book.title}
                                fill
                                className={styles.image}
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    </div>

                    <div className={styles.detailsSection}>
                        <div className={styles.header}>
                            <span className={styles.category}>{book.category}</span>
                            <h1 className={styles.title}>{book.title}</h1>
                            <p className={styles.author}>by <span className={styles.authorName}>{book.author}</span></p>
                        </div>

                        <div className={styles.priceBlock}>
                            <div className={styles.priceRow}>
                                <span className={styles.currentPrice}>R {book.price}</span>
                                {book.retail > book.price && (
                                    <span className={styles.originalPrice}>R {book.retail}</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span className={styles.sku}>SKU: {book.sku_number || book.code || 'N/A'}</span>
                                <span className={styles.stockCount}>{book.qty_in_stock} in stock</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <AddToCartButton bookId={book.id} className={styles.addToCartBtn} />
                            <button className={styles.wishlistBtn}>
                                <Heart size={20} />
                            </button>
                        </div>

                        <div className={styles.descriptionBlock}>
                            <h3>Description</h3>
                            <p className={styles.description}>
                                {book.description || "No book description available"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
