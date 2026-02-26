'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUsers, updateUserRole, updateUserPhone, UserWithRole } from '@/app/actions/user-management';
import styles from './UserManagement.module.css';

// 1: General (Default), 2: Book Keeper, 3: System Admin
const ROLE_OPTIONS = [
    { id: 1, name: 'General' },
    { id: 2, name: 'Book Keeper' },
    { id: 3, name: 'System Admin' }
];

export default function UserManagementUI() {
    const { user, role } = useAuth();
    const [usersList, setUsersList] = useState<UserWithRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
    const [tempPhone, setTempPhone] = useState<string>('');

    // Is the currently logged in user a System Admin?
    const isSystemAdmin = role === 'System Admin' || user?.role_id === 3;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { users } = await getUsers();
        if (users) {
            setUsersList(users);
        }
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, targetRoleId: number) => {
        if (!user || user.id === userId) {
            alert("You cannot change your own role.");
            return;
        }

        setUpdatingUserId(userId);

        const res = await updateUserRole(userId, targetRoleId, user.id);

        if (res.error) {
            alert("Error: " + res.error);
        } else {
            // Update local state proactively
            const updatedUsers = usersList.map(u =>
                u.id === userId ? { ...u, role_id: targetRoleId, role_name: ROLE_OPTIONS.find(ro => ro.id === targetRoleId)?.name || 'Unknown' } : u
            );
            setUsersList(updatedUsers);
        }

        setUpdatingUserId(null);
    };

    const handlePhoneEditRequest = (userId: string, currentPhone: string) => {
        setEditingPhoneId(userId);
        setTempPhone(currentPhone);
    };

    const handlePhoneSave = async (userId: string) => {
        if (!user || user.id === userId) {
            alert("You cannot change your own phone number here.");
            setEditingPhoneId(null);
            return;
        }

        setUpdatingUserId(userId);
        const res = await updateUserPhone(userId, tempPhone, user.id);

        if (res.error) {
            alert("Error: " + res.error);
        } else {
            const updatedUsers = usersList.map(u =>
                u.id === userId ? { ...u, phone_number: tempPhone } : u
            );
            setUsersList(updatedUsers);
        }

        setUpdatingUserId(null);
        setEditingPhoneId(null);
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h2>Registered Users</h2>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Phone Number</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className={styles.loadingCell}>
                                    <Loader2 className="animate-spin" /> Loading users...
                                </td>
                            </tr>
                        ) : usersList.length === 0 ? (
                            <tr>
                                <td colSpan={5} className={styles.emptyCell}>No users found.</td>
                            </tr>
                        ) : (
                            usersList.map((mappedUser) => {
                                const isUpdating = updatingUserId === mappedUser.id;

                                return (
                                    <tr key={mappedUser.id}>
                                        <td className={styles.nameCell}>{mappedUser.first_name}</td>
                                        <td className={styles.nameCell}>{mappedUser.last_name}</td>
                                        <td>{mappedUser.email}</td>
                                        <td>
                                            {editingPhoneId === mappedUser.id ? (
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <input
                                                        type="text"
                                                        value={tempPhone}
                                                        onChange={(e) => setTempPhone(e.target.value)}
                                                        className={styles.phoneInput}
                                                        disabled={isUpdating}
                                                        style={{ padding: '0.25rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                                    />
                                                    <button 
                                                        onClick={() => handlePhoneSave(mappedUser.id)} 
                                                        disabled={isUpdating}
                                                        style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px' }}
                                                    >
                                                        Save
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingPhoneId(null)} 
                                                        disabled={isUpdating}
                                                        style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span>{mappedUser.phone_number || '-'}</span>
                                                    {isSystemAdmin && mappedUser.id !== user?.id && (
                                                        <button 
                                                            onClick={() => handlePhoneEditRequest(mappedUser.id, mappedUser.phone_number)}
                                                            style={{ fontSize: '0.8rem', padding: '0.1rem 0.4rem', cursor: 'pointer', background: 'transparent', border: '1px solid currentColor', borderRadius: '4px' }}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <select
                                                className={styles.roleSelect}
                                                value={mappedUser.role_id}
                                                onChange={(e) => handleRoleChange(mappedUser.id, parseInt(e.target.value))}
                                                disabled={!isSystemAdmin || isUpdating || mappedUser.id === user?.id}
                                            >
                                                {ROLE_OPTIONS.map(roleOption => (
                                                    <option key={roleOption.id} value={roleOption.id}>
                                                        {roleOption.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {isUpdating && <Loader2 size={16} className="animate-spin" style={{ display: 'inline-block', marginLeft: '8px', verticalAlign: 'middle' }} />}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
