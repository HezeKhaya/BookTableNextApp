'use client';

import SalesManagement from '@/components/admin/SalesManagement';
import SalesHistoryTable from '@/components/admin/SalesHistoryTable';
import Header from '@/components/Header';
import { useState } from 'react';
import styles from './page.module.css';

export default function CaptureSalesPage() {
    const [activeTab, setActiveTab] = useState<'capture' | 'history'>('capture');

    return (
        <main>
            <Header showSearch={false} />
            <div className={`container ${styles.container}`}>
                <h1 className={styles.title}>Capture Sales</h1>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'capture' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('capture')}
                    >
                        Capture Sales
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Sales History
                    </button>
                </div>

                <div className={styles.content}>
                    {activeTab === 'capture' && <SalesManagement />}
                    {activeTab === 'history' && <SalesHistoryTable />}
                </div>
            </div>
        </main>
    );
}
