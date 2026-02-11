"use client";

import { useState } from 'react';
import styles from './FilterChips.module.css';

const categories = [
    { id: 'all', label: 'All Books' },
    { id: 'fiction', label: 'Fiction' },
    { id: 'non-fiction', label: 'Non-Fiction' },
    { id: 'poetry', label: 'Poetry' },
    { id: 'design-art', label: 'Design & Art' },
    { id: 'rare-editions', label: 'Rare Editions' },
];

export default function FilterChips() {
    const [activeCategory, setActiveCategory] = useState('all');

    return (
        <div className={styles.container}>
            {categories.map((category) => (
                <button
                    key={category.id}
                    className={`${styles.chip} ${activeCategory === category.id ? styles.active : ''}`}
                    onClick={() => setActiveCategory(category.id)}
                >
                    {category.label}
                </button>
            ))}
        </div>
    );
}
