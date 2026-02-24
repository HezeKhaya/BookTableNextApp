'use client';

import Header from '@/components/Header';
import styles from '../capture-sales/page.module.css'; // Reuse container styles from sales
import CaptureOrdersUI from '@/components/admin/CaptureOrdersUI';

export default function CaptureOrdersPage() {
    return (
        <main>
            <Header showSearch={false} />
            <div className={`container ${styles.container}`}>
                <h1 className={styles.title}>Capture Orders</h1>
                <CaptureOrdersUI />
            </div>
        </main>
    );
}
