'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Package, Users, ClipboardList } from 'lucide-react';
import styles from './SideMenu.module.css';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
    const pathname = usePathname();

    return (
        <>
            <div
                className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
                onClick={onClose}
            ></div>
            <div className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <span className={styles.title}>Admin Panel</span>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    <Link
                        href="/admin/capture-sales"
                        className={`${styles.navItem} ${pathname === '/admin/capture-sales' ? styles.active : ''}`}
                        onClick={onClose}
                    >
                        <ClipboardList size={20} />
                        Capture Sales
                    </Link>

                    <Link
                        href="/admin/stock"
                        className={`${styles.navItem} ${pathname === '/admin/stock' ? styles.active : ''}`}
                        onClick={onClose}
                    >
                        <Package size={20} />
                        Stock Management
                    </Link>

                    <div className={`${styles.navItem} ${styles.disabled}`}>
                        <Users size={20} />
                        User Management
                    </div>

                    <Link
                        href="/admin/record-keeping"
                        className={`${styles.navItem} ${pathname.startsWith('/admin/record-keeping') ? styles.active : ''}`}
                        onClick={onClose}
                    >
                        <ClipboardList size={20} />
                        Record Keeping
                    </Link>
                </nav>
            </div>
        </>
    );
}
