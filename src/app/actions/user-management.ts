'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

export type UserWithRole = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    role_id: number;
    role_name: string;
};

export async function getUsers() {
    // 1. Fetch Users
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('first_name', { ascending: true });

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return { users: [] };
    }

    // 2. Fetch Roles mapping
    const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('id, name');

    if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return { users: [] };
    }

    const roleMap = roles.reduce((acc, r) => {
        acc[r.id] = r.name;
        return acc;
    }, {} as Record<number, string>);

    const formattedUsers: UserWithRole[] = (users || []).map(u => ({
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        phone_number: u.phone_number || '',
        role_id: u.role_id,
        role_name: roleMap[u.role_id] || 'Unknown Role'
    }));

    return { users: formattedUsers };
}

export async function updateUserRole(userIdToEdit: string, newRoleId: number, adminUserId: string) {
    if (!adminUserId || !userIdToEdit) {
        return { error: 'Invalid user context' };
    }

    // 1. Verify admin privilege
    const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', adminUserId)
        .single();

    if (adminError || !adminUser || adminUser.role_id !== 3) {
        return { error: 'Unauthorized: Only System Admins can modify user roles.' };
    }

    // 2. Perform Update
    const { error: updateError } = await supabase
        .from('users')
        .update({ role_id: newRoleId })
        .eq('id', userIdToEdit);

    if (updateError) {
        console.error('Failed to update user role:', updateError);
        return { error: 'A database error occurred while updating the role.' };
    }

    revalidatePath('/admin/users');
    return { success: true };
}
