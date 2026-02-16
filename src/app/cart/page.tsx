'use client';

import Header from '@/components/Header';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ArrowLeft, CreditCard } from 'lucide-react';
import styles from './page.module.css';

export default function CartPage() {
    const { items, removeFromCart, loading } = useCart();

    const calculateTotal = () => {
        return items.reduce((total, item) => {
            return total + (item.book.price * item.quantity);
        }, 0);
    };

    if (loading) {
        return (
            <main>
                <Header />
                <div className={`container ${styles.loadingContainer}`}>
                    <p>Loading your cart...</p>
                </div>
            </main>
        );
    }

    return (
        <main>
            <Header />
            <div className={`container ${styles.container}`}>
                <h1 className={styles.title}>Your Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className={styles.emptyCart}>
                        <p>Your cart is currently empty.</p>
                        <Link href="/" className={styles.continueBtn}>
                            <ArrowLeft size={18} />
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className={styles.content}>
                        <div className={styles.itemsList}>
                            {items.map((item) => (
                                <div key={item.id} className={styles.cartItem}>
                                    <div className={styles.itemImage}>
                                        <Image
                                            src={item.book.image_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'}
                                            alt={item.book.title}
                                            fill
                                            className={styles.image}
                                        />
                                    </div>
                                    <div className={styles.itemDetails}>
                                        <Link href={`/book/${item.book.id}`} className={styles.itemTitle}>
                                            {item.book.title}
                                        </Link>
                                        <p className={styles.itemAuthor}>{item.book.author}</p>
                                        <p className={styles.itemPrice}>R {item.book.price.toFixed(2)}</p>
                                    </div>
                                    <div className={styles.itemActions}>
                                        {/* Future: Quantity selector */}
                                        <span className={styles.quantity}>Qty: {item.quantity}</span>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className={styles.removeBtn}
                                            title="Remove item"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.summary}>
                            <h2 className={styles.summaryTitle}>Order Summary</h2>
                            <div className={styles.summaryRow}>
                                <span>Subtotal</span>
                                <span>R {calculateTotal().toFixed(2)}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Tax</span>
                                <span>Included</span>
                            </div>
                            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                                <span>Total</span>
                                <span>R {calculateTotal().toFixed(2)}</span>
                            </div>
                            <button className={styles.checkoutBtn}>
                                <CreditCard size={18} />
                                Proceed to Checkout
                            </button>
                            <Link href="/" className={styles.continueLink}>
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
