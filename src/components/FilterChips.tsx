
"use client";

import styles from './FilterChips.module.css';

interface FilterChipsProps {
    categories: { id: string; label: string }[];
    selectedCategories: string[];
    onToggleCategory: (id: string) => void;
}

export default function FilterChips({ categories, selectedCategories, onToggleCategory }: FilterChipsProps) {
    return (
        <div className={styles.container}>
            {categories.map((category) => (
                <button
                    key={category.id}
                    className={`${styles.chip} ${selectedCategories.includes(category.id) ? styles.active : ''}`}
                    onClick={() => onToggleCategory(category.id)}
                >
                    {category.label}
                </button>
            ))}
        </div>
    );
}
