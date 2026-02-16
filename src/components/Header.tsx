import Link from 'next/link';
import { ShoppingBag, Search, LogOut } from 'lucide-react';
import styles from './Header.module.css';
import { useAuth } from '@/context/AuthContext';

export default function Header({ onSearch }: { onSearch?: (query: string) => void }) {
    const { user, role, logout } = useAuth();

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

                    {user ? (
                        <div className={styles.userProfile}>
                            <div className={styles.avatar}>
                                {user.first_name.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{user.first_name}</span>
                                <span className={styles.userRole}>{role || 'Member'}</span>
                            </div>
                            <button onClick={logout} className={styles.logoutBtn} title="Log Out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className={styles.loginBtn}>
                            Log In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
