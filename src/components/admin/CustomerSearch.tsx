'use client';

import { useState, useEffect } from 'react';
import { searchCustomers, createCustomer } from '@/app/actions/record-keeping';
import { Customer } from '@/types/database.types';
import { Search, Loader2, UserPlus, X, Check } from 'lucide-react';
import styles from './CustomerSearch.module.css';

interface CustomerSearchProps {
    onSelectCustomer: (customer: Customer) => void;
    selectedCustomer: Customer | null;
}

export default function CustomerSearch({ onSelectCustomer, selectedCustomer }: CustomerSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // New Customer Form
    const [newCustomer, setNewCustomer] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: ''
    });
    const [creatingLoading, setCreatingLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        const { customers } = await searchCustomers(query);
        if (customers) {
            // Add a type assertion since the generic select returns any[]
            setResults(customers as unknown as Customer[]);
        }
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingLoading(true);
        const { customer, error } = await createCustomer(newCustomer);
        setCreatingLoading(false);

        if (customer) {
            onSelectCustomer(customer as unknown as Customer);
            setIsCreating(false);
            setNewCustomer({ firstName: '', lastName: '', phone: '', email: '' });
            setQuery('');
        } else {
            alert(error || 'Failed to create customer');
        }
    };

    if (selectedCustomer) {
        return (
            <div className={styles.selectedCard}>
                <div className={styles.customerInfo}>
                    <h4>{selectedCustomer.first_name} {selectedCustomer.last_name}</h4>
                    <p>{selectedCustomer.phone_number}</p>
                </div>
                <button
                    onClick={() => onSelectCustomer(null as any)}
                    className={styles.changeBtn}
                >
                    Change
                </button>
            </div>
        );
    }

    if (isCreating) {
        return (
            <div className={styles.createForm}>
                <div className={styles.formHeader}>
                    <h3>New Customer</h3>
                    <button onClick={() => setIsCreating(false)}><X size={20} /></button>
                </div>
                <form onSubmit={handleCreate}>
                    <input
                        placeholder="First Name *"
                        value={newCustomer.firstName}
                        onChange={e => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                        required
                        className={styles.input}
                    />
                    <input
                        placeholder="Last Name *"
                        value={newCustomer.lastName}
                        onChange={e => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                        required
                        className={styles.input}
                    />
                    <input
                        placeholder="Phone Number *"
                        value={newCustomer.phone}
                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        required
                        className={styles.input}
                    />
                    <input
                        placeholder="Email (Optional)"
                        value={newCustomer.email}
                        onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        className={styles.input}
                    />
                    <button type="submit" className={styles.submitBtn} disabled={creatingLoading}>
                        {creatingLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        Save & Select
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.searchBox}>
                <Search className={styles.searchIcon} size={18} />
                <input
                    type="text"
                    placeholder="Search customer by name or phone..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {loading && <div className={styles.loading}><Loader2 className="animate-spin" size={20} /></div>}

            {!loading && results.length > 0 && (
                <ul className={styles.resultsList}>
                    {results.map(cust => (
                        <li key={cust.id} onClick={() => onSelectCustomer(cust)}>
                            <strong>{cust.first_name} {cust.last_name}</strong>
                            <span>{cust.phone_number}</span>
                        </li>
                    ))}
                </ul>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
                <div className={styles.noResults}>
                    <p>No customers found.</p>
                    <button onClick={() => setIsCreating(true)} className={styles.createBtn}>
                        <UserPlus size={16} /> Create New Customer
                    </button>
                </div>
            )}
            {!loading && query.length < 2 && (
                <div className={styles.emptyPrompt}>
                    <button onClick={() => setIsCreating(true)} className={styles.createBtn}>
                        <UserPlus size={16} /> Create New Customer
                    </button>
                </div>
            )}
        </div>
    );
}
