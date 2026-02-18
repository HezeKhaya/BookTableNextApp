'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Loader2, Check } from 'lucide-react';
import styles from '@/app/book/[id]/page.module.css'; // We might need to adjust styles import or pass className

interface AddToCartButtonProps {
    bookId: number;
    className?: string;
    disabled?: boolean;
}

export default function AddToCartButton({ bookId, className, disabled = false }: AddToCartButtonProps) {
    const { addToCart } = useCart();
    const [isAdding, setIsAdding] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleAddToCart = async () => {
        setIsAdding(true);
        setErrorMessage(null);
        // Simulate a small delay for better UX if action is too fast, or just wait
        const { success, error } = await addToCart(bookId, 1);
        setIsAdding(false);

        if (success) {
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000);
        } else {
            console.error('Failed to add to cart:', error);
            setErrorMessage(error || 'Failed to add item');
            // Auto hide error after 5 seconds
            setTimeout(() => setErrorMessage(null), 5000);
        }
    };

    return (
        <div className={styles.addToCartWrapper}>
            <button
                className={`${className || ''}`}
                onClick={handleAddToCart}
                disabled={disabled || isAdding || isSuccess}
            >
                {isAdding ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : isSuccess ? (
                    <>
                        <Check size={20} />
                        Added
                    </>
                ) : (
                    <>
                        <ShoppingCart size={20} />
                        Add to Cart
                    </>
                )}
            </button>
            {errorMessage && (
                <div className={styles.errorToast}>
                    <p>{errorMessage}</p>
                </div>
            )}
        </div>
    );
}
