import { useState, useEffect } from 'react';
import { Customer } from '@/types/database.types';
import { getOrders, updateOrderStatus, uploadOrderInvoice, fetchBookDetailsFromSupplier, createOrder, deleteOrder } from '@/app/actions/orders';
import { createCustomer } from '@/app/actions/record-keeping';
import CustomerSearch from './CustomerSearch';
import { Truck, Plus, UploadCloud, X, Loader2, FileText, CheckCircle, Trash2 } from 'lucide-react';
import styles from './CaptureOrdersUI.module.css';

export default function CaptureOrdersUI() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Refresh function
    const fetchOrders = async () => {
        setLoading(true);
        const { orders: fetchedOrders = [] } = await getOrders();
        setOrders(fetchedOrders);
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // File Upload Handler
    const handleInvoiceUpload = async (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('orderId', orderId);
        formData.append('file', file);
        
        const { success, error } = await uploadOrderInvoice(formData);
        if (success) {
            alert('Invoice uploaded successfully');
            fetchOrders();
        } else {
            alert(error || 'Failed to upload invoice');
        }
    };
    
    // Delete Handler
    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm(`Are you sure you want to delete this order? This action cannot be undone.`)) return;

        const { success, error } = await deleteOrder(orderId);
        
        if (success) {
            fetchOrders();
        } else {
            alert(error || 'Failed to delete order');
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.headerRow}>
                <h2 className={styles.subtitle}>Order Management</h2>
                <button className={styles.primaryBtn} onClick={() => setShowModal(true)}>
                    <Truck size={18} />
                    Capture Order
                </button>
            </div>

            {loading ? (
                <div className={styles.loadingWrapper}><Loader2 className={styles.spin} size={32} /></div>
            ) : orders.length === 0 ? (
                <div className={styles.emptyState}>No orders captured yet.</div>
            ) : (
                <div className={styles.tableResponsive}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Capture Date</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Invoice</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td>
                                        {order.customers?.first_name} {order.customers?.last_name}
                                        <div className={styles.subtitleText}>{order.customers?.phone_number}</div>
                                    </td>
                                    <td>
                                        <ul className={styles.itemList}>
                                            {order.order_items?.map((item: any, idx: number) => (
                                                <li key={idx} className={styles.itemRow}>
                                                    <span className={styles.qtyBadge}>{item.quantity}x</span> 
                                                    {item.books?.title} (R{item.price})
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td><strong>R{order.total_amount.toFixed(2)}</strong></td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        {order.invoice_file_url ? (
                                            <a href={order.invoice_file_url} target="_blank" rel="noopener noreferrer" className={styles.invoiceLink}>
                                                <FileText size={16} /> View
                                            </a>
                                        ) : (
                                            <label className={styles.uploadBtn}>
                                                <UploadCloud size={16} /> Upload
                                                <input
                                                    type="file"
                                                    accept="application/pdf,image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleInvoiceUpload(order.id, e)}
                                                />
                                            </label>
                                        )}
                                    </td>
                                    <td>
                                        <button 
                                            className={styles.actionBtnDelete}
                                            onClick={() => handleDeleteOrder(order.id)}
                                            title="Delete Order"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for Capturing a New Order */}
            {showModal && (
                <CaptureOrderModal 
                    onClose={() => setShowModal(false)} 
                    onSuccess={() => {
                        setShowModal(false);
                        fetchOrders();
                    }}
                />
            )}
        </div>
    );
}

// ------------------------------------------------------------------------------------------------ //
// MODAL COMPONENT (Can be separated securely, but fine here for cohesion)
// ------------------------------------------------------------------------------------------------ //

function CaptureOrderModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [step, setStep] = useState<1 | 2>(1);
    const [code, setCode] = useState('');
    const [fetchingBook, setFetchingBook] = useState(false);
    const [bookDetails, setBookDetails] = useState<any>(null);
    const [customQty, setCustomQty] = useState<number>(1);
    
    // Customer Selection
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [newCustomerForm, setNewCustomerForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });
    
    const [submitting, setSubmitting] = useState(false);

    const handleFetchBook = async () => {
        if (!code) return;
        setFetchingBook(true);
        const { book, error } = await fetchBookDetailsFromSupplier(code);
        setFetchingBook(false);
        
        if (error || !book) {
            alert(error || 'Failed to fetch book details.');
            return;
        }
        
        setBookDetails(book);
        const stockQty = book.qty || book.Qty;
        setCustomQty(stockQty > 0 ? stockQty : 1);
        setStep(2);
    };

    const handleCreateOrder = async () => {
        if (!bookDetails) return;
        if (customQty < 1) return alert('Quantity must be at least 1.');
        
        setSubmitting(true);
        
        let finalCustomerId = customer?.id;
        
        // Add new customer if needed
        if (isNewCustomer) {
            if (!newCustomerForm.firstName || !newCustomerForm.lastName || !newCustomerForm.phone) {
                alert('Please fill in required customer fields (First Name, Last Name, Phone).');
                setSubmitting(false);
                return;
            }
            const { customer: createdCust, error: custErr } = await createCustomer(newCustomerForm);
            if (custErr || !createdCust) {
                alert('Failed to create new customer');
                setSubmitting(false);
                return;
            }
            finalCustomerId = createdCust.id;
        }

        if (!finalCustomerId) {
            alert('Please select or create a customer.');
            setSubmitting(false);
            return;
        }

        const price = bookDetails.price || bookDetails.Price || bookDetails.retail || bookDetails.Retail || 0;
        const totalAmount = price * customQty;

        const { success, error } = await createOrder(
            finalCustomerId, 
            [{ bookDto: bookDetails, quantity: customQty, price }], 
            totalAmount
        );

        setSubmitting(false);

        if (success) {
            alert('Order captured successfully!');
            onSuccess();
        } else {
            alert(error || 'Failed to complete order capture.');
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>Capture New Order</h3>
                    <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
                </div>

                <div className={styles.modalBody}>
                    {step === 1 && (
                        <div className={styles.stepContainer}>
                            <p>Enter Supplier Code or ISBN to search for the book:</p>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Enter book code/ISBN..."
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFetchBook()}
                            />
                            <button 
                                className={styles.primaryBtnFull} 
                                onClick={handleFetchBook}
                                disabled={!code || fetchingBook}
                            >
                                {fetchingBook ? <Loader2 className={styles.spin} size={18} /> : 'Search Book'}
                            </button>
                        </div>
                    )}

                    {step === 2 && bookDetails && (
                        <div className={styles.stepContainer}>
                            <div className={styles.bookSummary}>
                                {(bookDetails.imageUrl || bookDetails.ImageUrl) && <img src={bookDetails.imageUrl || bookDetails.ImageUrl} alt="Cover" className={styles.bookCover} />}
                                <div className={styles.bookMeta}>
                                    <h4>{bookDetails.title || bookDetails.Title}</h4>
                                    <p className={styles.author}>by {bookDetails.author || bookDetails.Author}</p>
                                    <p className={styles.price}>Retail Price: R{bookDetails.retail || bookDetails.Retail || bookDetails.price || bookDetails.Price || 0}</p>
                                    {(bookDetails.category || bookDetails.Category) && <span className={styles.tag}>{bookDetails.category || bookDetails.Category}</span>}
                                </div>
                            </div>
                            
                            {/* Quantity Input */}
                            <div className={styles.formGroup}>
                                <label>Quantity to Order:</label>
                                <input 
                                    type="number" 
                                    className={styles.input}
                                    min="1"
                                    value={customQty}
                                    onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                                />
                            </div>

                            <div className={styles.divider}></div>

                            {/* Customer Assignment */}
                            <div className={styles.customerSection}>
                                <div className={styles.tabs}>
                                    <button 
                                        className={!isNewCustomer ? styles.activeTab : styles.tab}
                                        onClick={() => setIsNewCustomer(false)}
                                    >
                                        Existing Customer
                                    </button>
                                    <button 
                                        className={isNewCustomer ? styles.activeTab : styles.tab}
                                        onClick={() => setIsNewCustomer(true)}
                                    >
                                        New Customer
                                    </button>
                                </div>

                                {!isNewCustomer ? (
                                    <div className={styles.customerSearchBox}>
                                        <CustomerSearch 
                                            selectedCustomer={customer} 
                                            onSelectCustomer={setCustomer} 
                                        />
                                    </div>
                                ) : (
                                    <div className={styles.newCustomerForm}>
                                        <input 
                                            type="text" 
                                            placeholder="First Name" 
                                            className={styles.input}
                                            value={newCustomerForm.firstName}
                                            onChange={(e) => setNewCustomerForm({...newCustomerForm, firstName: e.target.value})}
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Last Name" 
                                            className={styles.input}
                                            value={newCustomerForm.lastName}
                                            onChange={(e) => setNewCustomerForm({...newCustomerForm, lastName: e.target.value})}
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Phone Number" 
                                            className={styles.input}
                                            value={newCustomerForm.phone}
                                            onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                                        />
                                        <input 
                                            type="email" 
                                            placeholder="Email (Optional)" 
                                            className={styles.input}
                                            value={newCustomerForm.email}
                                            onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                                        />
                                    </div>
                                )}
                            </div>

                            <button 
                                className={styles.successBtnFull} 
                                onClick={handleCreateOrder}
                                disabled={submitting || (!isNewCustomer && !customer)}
                            >
                                {submitting ? <Loader2 className={styles.spin} size={18} /> : <span><CheckCircle size={18} /> Finalize Capture</span>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
