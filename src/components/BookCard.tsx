import Image from 'next/image';
import { Heart } from 'lucide-react';
import styles from './BookCard.module.css';

interface BookCardProps {
    title: string;
    author: string;
    price: number;
    originalPrice?: number;
    coverImage: string;
    category: string;
    tag?: string; // 'Bestseller', 'Sale', etc.
}

export default function BookCard({
    title,
    author,
    price,
    originalPrice,
    coverImage,
    category,
    tag
}: BookCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                {tag && <span className={styles.tag}>{tag}</span>}
                <Image
                    src={coverImage}
                    alt={title}
                    fill
                    className={styles.image}
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
                    <button className={styles.wishlistBtn} aria-label="Add to wishlist">
                        <Heart size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
