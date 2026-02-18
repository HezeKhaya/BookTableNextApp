'use client';

import Header from '@/components/Header';
import { useState } from 'react';
import styles from './page.module.css';
import InvoiceManagement from '@/components/admin/InvoiceManagement';
// Future imports: SalesManagement, StockSnapshots

export default function RecordKeepingPage() {
    const [activeTab, setActiveTab] = useState<'invoices' | 'sales' | 'snapshots'>('invoices');

    return (
        <main>
            <Header showSearch={false} />
            <div className={`container ${styles.container}`}>
                <h1 className={styles.title}>Record Keeping</h1>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'invoices' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('invoices')}
                    >
                        Supplier Invoices
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'sales' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('sales')}
                    >
                        Manual Sales
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'snapshots' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('snapshots')}
                    >
                        Stock Snapshots
                    </button>
                </div>

                <div className={styles.content}>
                    {activeTab === 'invoices' && <InvoiceManagement />}
                    {activeTab === 'sales' && <div>Sales Management (Coming Soon)</div>}
                    {activeTab === 'snapshots' && <div>Stock Snapshots (Coming Soon)</div>}
                </div>
            </div>
        </main>
    );
}
