'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, LogOut, User as UserIcon } from 'lucide-react';
import styles from './Header.module.css';
import { useAuth } from '@/context/AuthContext';

export default function Header({ onSearch }: { onSearch?: (query: string) => void }) {
    const { user, role, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
    };

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
                        <div className={styles.userProfileWrapper} ref={menuRef}>
                            <div
                                className={styles.userProfile}
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <div className={styles.avatar}>
                                    {user.first_name.charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>{user.first_name}</span>
                                    <span className={styles.userRole}>{role || 'Member'}</span>
                                </div>
                            </div>

                            {isMenuOpen && (
                                <div className={styles.dropdownMenu}>
                                    <button className={`${styles.menuItem} ${styles.menuItemDisabled}`} disabled>
                                        <UserIcon size={16} />
                                        My Account
                                    </button>
                                    <button onClick={handleLogout} className={`${styles.menuItem} ${styles.menuItemLogout}`}>
                                        <LogOut size={16} />
                                        Log Out
                                    </button>
                                </div>
                            )}
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
