'use client';

import { useState } from 'react';
import { Customer, Book } from '@/types/database.types';
import { recordSale } from '@/app/actions/record-keeping';
import CustomerSearch from './CustomerSearch';
import BookSearch from './BookSearch';
import { Trash2, Save, ShoppingCart, Loader2 } from 'lucide-react';
import styles from './SalesManagement.module.css';
import PendingSalesList from './PendingSalesList';

type CartItem = {
    book: Book;
    quantity: number;
    price: number;
};

export default function SalesManagement() {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentType, setPaymentType] = useState<'CASH' | 'EFT'>('CASH');
    const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID'>(
        'PAID' // Default to PAID for CASH
    );
    const [submitting, setSubmitting] = useState(false);

    // Update payment status default when type changes
    const handlePaymentTypeChange = (type: 'CASH' | 'EFT') => {
        setPaymentType(type);
        if (type === 'CASH') {
            setPaymentStatus('PAID');
        } else {
            setPaymentStatus('PENDING'); // Default to PENDING for EFT until PoP
        }
    };

    const handleAddBook = (book: Book) => {
        setCart(prev => {
            const existing = prev.find(item => item.book.id === book.id);
            if (existing) {
                return prev.map(item =>
                    item.book.id === book.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { book, quantity: 1, price: book.price }];
        });
    };

    const handleRemoveItem = (bookId: number) => {
        setCart(prev => prev.filter(item => item.book.id !== bookId));
    };

    const handleUpdateQty = (bookId: number, qty: number) => {
        if (qty < 1) return;
        setCart(prev => prev.map(item =>
            item.book.id === bookId ? { ...item, quantity: qty } : item
        ));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleSubmit = async () => {
        if (!customer) return alert('Please select a customer');
        if (cart.length === 0) return alert('Please add items to the sale');

        setSubmitting(true);
        const { success, error } = await recordSale({
            customerId: customer.id,
            items: cart.map(item => ({
                bookId: item.book.id,
                quantity: item.quantity,
                price: item.price
            })),
            paymentType,
            paymentStatus
        });
        setSubmitting(false);

        if (success) {
            alert('Sale recorded successfully!');
            // Reset form
            setCustomer(null);
            setCart([]);
            setPaymentType('CASH');
            setPaymentStatus('PAID');
        } else {
            alert(error || 'Failed to record sale');
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.grid}>
                {/* Left Column: Customer & Cart */}
                <div className={styles.column}>
                    <section className={styles.section}>
                        <h3 className={styles.heading}>1. Customer</h3>
                        <CustomerSearch
                            selectedCustomer={customer}
                            onSelectCustomer={setCustomer}
                        />
                    </section>

                    <section className={styles.section}>
                        <h3 className={styles.heading}>2. Add Items</h3>
                        <BookSearch onSelectBook={handleAddBook} />
                    </section>

                    <section className={styles.section}>
                        <h3 className={styles.heading}>3. Cart</h3>
                        {cart.length === 0 ? (
                            <div className={styles.emptyCart}>No items added yet</div>
                        ) : (
                            <div className={styles.cartList}>
                                {cart.map(item => (
                                    <div key={item.book.id} className={styles.cartItem}>
                                        <div className={styles.cartItemInfo}>
                                            <span className={styles.itemTitle}>{item.book.title}</span>
                                            <span className={styles.itemPrice}>R{item.price}</span>
                                        </div>
                                        <div className={styles.cartActions}>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleUpdateQty(item.book.id, parseInt(e.target.value))}
                                                className={styles.qtyInput}
                                            />
                                            <button
                                                onClick={() => handleRemoveItem(item.book.id)}
                                                className={styles.removeBtn}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className={styles.totalRow}>
                            <strong>Total:</strong>
                            <span>R {totalAmount.toFixed(2)}</span>
                        </div>
                    </section>
                </div>

                {/* Right Column: Payment & Finish */}
                <div className={styles.column}>
                    <section className={styles.section}>
                        <h3 className={styles.heading}>4. Payment Details</h3>

                        <div className={styles.formGroup}>
                            <label>Payment Type</label>
                            <div className={styles.radioGroup}>
                                <label className={styles.radio}>
                                    <input
                                        type="radio"
                                        name="paymentType"
                                        checked={paymentType === 'CASH'}
                                        onChange={() => handlePaymentTypeChange('CASH')}
                                    />
                                    <span>Cash</span>
                                </label>
                                <label className={styles.radio}>
                                    <input
                                        type="radio"
                                        name="paymentType"
                                        checked={paymentType === 'EFT'}
                                        onChange={() => handlePaymentTypeChange('EFT')}
                                    />
                                    <span>EFT</span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Payment Status</label>
                            <div className={styles.radioGroup}>
                                <label className={styles.radio}>
                                    <input
                                        type="radio"
                                        name="paymentStatus"
                                        checked={paymentStatus === 'PENDING'}
                                        onChange={() => setPaymentStatus('PENDING')}
                                    />
                                    <span>Pending</span>
                                </label>
                                <label className={styles.radio}>
                                    <input
                                        type="radio"
                                        name="paymentStatus"
                                        checked={paymentStatus === 'PAID'}
                                        onChange={() => setPaymentStatus('PAID')}
                                        disabled={paymentType === 'EFT'} // Simplified rule: EFT defaults to pending, admin can force paid if they see PoP separately, but strictly per requirement "Can only be paid if PoP uploaded".
                                    // Since we don't have PoP upload in this precise form flow yet (requires file), we'll disable simple toggle for EFT.
                                    // Actually the user said "Can only be marked as paid if... (2) it is an EFT and PoP is uploaded".
                                    // So for now, if EFT, force Pending.
                                    />
                                    <span>Paid</span>
                                </label>
                            </div>
                            {paymentType === 'EFT' && (
                                <p className={styles.note}>
                                    * EFT payments require Proof of Payment to be marked as Paid. Save as Pending first, then upload PoP.
                                </p>
                            )}
                        </div>

                        <button
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <Save />}
                            Record Sale
                        </button>
                    </section>

                    <PendingSalesList />
                </div>
            </div>
        </div>
    );
}
