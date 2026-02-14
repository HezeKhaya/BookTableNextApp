import Link from 'next/link';
import { ShoppingBag, Search } from 'lucide-react';
import styles from './Header.module.css';

export default function Header({ onSearch }: { onSearch?: (query: string) => void }) {
    return (
        <header className={styles.header}>
            <div className={`container ${styles.container}`}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoText}>Book Table</span>
                </Link>

                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Search titles, authors, or ISBNs..."
                        className={styles.searchInput}
                        onChange={(e) => onSearch?.(e.target.value)}
                    />
                </div>

                <div className={styles.actions}>
                    <Link href="/cart" className={styles.actionBtn}>
                        <ShoppingBag size={20} />
                        <span className={styles.badge}>2</span>
                    </Link>
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>JD</div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>Jane Doe</span>
                            <span className={styles.userRole}>Member</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
