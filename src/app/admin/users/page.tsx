import UserManagementUI from '@/components/admin/UserManagementUI';
import Header from '@/components/Header';

export const metadata = {
    title: 'User Management - Book Table',
    description: 'Manage users and roles.',
};

export default function UserManagementPage() {
    return (
        <main>
            <Header showSearch={false} />
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <h1 style={{ marginBottom: '1.5rem', color: 'var(--foreground)' }}>User Management</h1>
                <UserManagementUI />
            </div>
        </main>
    );
}
