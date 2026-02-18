'use client';

import { useState, useEffect } from 'react';
import { getInvoices, uploadInvoice, deleteInvoice } from '@/app/actions/record-keeping';
import { Invoice } from '@/types/database.types';
import { Upload, Trash2, FileText, Loader2, Plus, X } from 'lucide-react';
import styles from './InvoiceManagement.module.css';

export default function InvoiceManagement() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Upload Form State
    const [uploading, setUploading] = useState(false);
    const [supplierName, setSupplierName] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [amount, setAmount] = useState('');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        setLoading(true);
        const { invoices, error } = await getInvoices();
        if (invoices) {
            setInvoices(invoices as Invoice[]);
        }
        setLoading(false);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !supplierName || !invoiceDate || !amount) return;

        if (file.size > 1024 * 1024) { // 1MB limit
            alert('File size exceeds 1MB limit. Please upload a smaller file.');
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('supplierName', supplierName);
        formData.append('invoiceDate', invoiceDate);
        formData.append('amount', amount);

        try {
            const { success, error } = await uploadInvoice(formData);

            setUploading(false);
            if (success) {
                setIsUploadModalOpen(false);
                // Reset form
                setSupplierName('');
                setInvoiceDate('');
                setAmount('');
                setFile(null);
                loadInvoices();
            } else {
                alert(error || 'Failed to upload invoice');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setUploading(false);
            alert('An unexpected error occurred during upload. The file might be too large or there is a network issue.');
        }
    };

    const handleDelete = async (id: string, fileUrl: string) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;

        const { success, error } = await deleteInvoice(id, fileUrl);
        if (success) {
            loadInvoices();
        } else {
            alert(error);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h2>Supplier Invoices</h2>
                <button
                    className={styles.addBtn}
                    onClick={() => setIsUploadModalOpen(true)}
                >
                    <Plus size={20} />
                    Upload Invoice
                </button>
            </div>

            {loading ? (
                <div className={styles.loading}>
                    <Loader2 className="animate-spin" /> Loading...
                </div>
            ) : invoices.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No invoices uploaded yet.</p>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Supplier</th>
                                <th>Amount</th>
                                <th>File</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={inv.id}>
                                    <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                    <td>{inv.supplier_name}</td>
                                    <td>R {inv.amount.toFixed(2)}</td>
                                    <td>
                                        <a
                                            href={inv.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.fileLink}
                                        >
                                            <FileText size={16} /> View
                                        </a>
                                    </td>
                                    <td>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleDelete(inv.id, inv.file_url)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isUploadModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Upload New Invoice</h3>
                            <button onClick={() => setIsUploadModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpload} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Supplier Name</label>
                                <select
                                    value={supplierName}
                                    onChange={(e) => setSupplierName(e.target.value)}
                                    required
                                    className={`${styles.input} ${styles.select}`}
                                >
                                    <option value="" disabled>Select a supplier</option>
                                    <option value="GOOD NEIGHBOURS">GOOD NEIGHBOURS</option>
                                    <option value="PRIVATE">PRIVATE</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Invoice Date</label>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Total Amount (ZAR)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Invoice File (PDF/Image)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    required
                                    className={styles.fileInput}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className={styles.cancelBtn}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={uploading}
                                >
                                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
