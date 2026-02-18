'use client';

import SalesManagement from '@/components/admin/SalesManagement';
import Header from '@/components/Header';
import styles from './page.module.css';

export default function CaptureSalesPage() {
    return (
        <main>
            <Header showSearch={false} />
            <div className={`container ${styles.container}`}>
                <h1 className={styles.title}>Capture Sales</h1>
                <SalesManagement />
            </div>
        </main>
    );
}
