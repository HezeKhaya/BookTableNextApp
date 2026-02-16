'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import Header from '@/components/Header';
import { loginAction, signupAction } from '@/app/actions/auth';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        try {
            if (isLogin) {
                // LOGIN LOGIC
                const result = await loginAction(formData);
                if (result.error || !result.user) {
                    throw new Error(result.error || 'Login failed');
                }

                await login(result.user.id);
                router.push('/');
            } else {
                // SIGN UP LOGIC
                formData.append('firstName', firstName);
                formData.append('lastName', lastName);
                formData.append('phoneNumber', phoneNumber);

                const result = await signupAction(formData);
                if (result.error || !result.user) {
                    throw new Error(result.error || 'Signup failed');
                }

                await login(result.user.id);
                router.push('/');
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main>
            <Header />
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${isLogin ? styles.activeTab : ''}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Log In
                        </button>
                        <button
                            className={`${styles.tab} ${!isLogin ? styles.activeTab : ''}`}
                            onClick={() => setIsLogin(false)}
                        >
                            Sign Up
                        </button>
                    </div>

                    <h1 className={styles.title}>{isLogin ? 'Welcome Back' : 'Join Book Table'}</h1>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {!isLogin && (
                            <>
                                <div className={styles.row}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>First Name</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Last Name</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="0821234567"
                                        className={styles.input}
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Password</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
