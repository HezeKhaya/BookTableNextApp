import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import styles from './BookCard.module.css';

interface BookCardProps {
    id: number;
    title: string;
    author: string;
    price: number;
    originalPrice?: number;
    coverImage: string;
    category: string;
    tag?: string; // 'Bestseller', 'Sale', etc.
    qtyInStock?: number;
}

export default function BookCard({
    id,
    title,
    author,
    price,
    originalPrice,
    coverImage,
    category,
    tag,
    qtyInStock = 1 // Default to 1 if not provided to avoid breaking existing without data
}: BookCardProps) {
    const isOutOfStock = qtyInStock <= 0;

    return (
        <div className={`${styles.cardWrapper} ${isOutOfStock ? styles.outOfStockWrapper : ''}`}>
            <Link href={`/book/${id}`} className={styles.cardLink}>
                <div className={styles.card}>
                    <div className={styles.imageContainer}>
                        {tag && !isOutOfStock && <span className={styles.tag}>{tag}</span>}
                        {isOutOfStock && <span className={styles.oosBadge}>Out of Stock</span>}
                        <Image
                            src={coverImage}
                            alt={title}
                            fill
                            className={`${styles.image} ${isOutOfStock ? styles.oosImage : ''}`}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </div>

                    <div className={styles.content}>
                        <span className={styles.category}>{category}</span>
                        <h3 className={styles.title}>{title}</h3>
                        <p className={styles.author}>{author}</p>

                        <div className={styles.footer}>
                            <div className={styles.priceContainer}>
                                <span className={styles.price}>R{price.toFixed(2)}</span>
                                {originalPrice && (
                                    <span className={styles.originalPrice}>R{originalPrice.toFixed(2)}</span>
                                )}
                            </div>
                            {/* Move button outside Link or handle propagation if needed, 
                                but Link wraps everything so generic click goes to detail. 
                                Wishlist button might need e.preventDefault() if it stays inside. */}
                            <button
                                className={styles.wishlistBtn}
                                aria-label="Add to wishlist"
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent navigation
                                    // Add wishlist logic here
                                }}
                            >
                                <Heart size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
