'use server';

import { createClient } from '@/utils/supabase/server';
import { User } from '@/types/database.types';

export async function signupAction(formData: FormData) {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const phoneNumber = formData.get('phoneNumber') as string;

    if (!email || !password || !firstName || !lastName || !phoneNumber) {
        return { error: 'All fields are required' };
    }

    // Validate South African Phone Number
    // Must start with 0 and have 10 digits
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
        return { error: 'Invalid phone number. It must be a valid South African number (10 digits starting with 0).' };
    }

    try {
        const supabase = await createClient();
        
        // 1. Check if user exists (Optional but good for UX if Supabase doesn't return a clear error)
        // Note: Supabase auth.signUp handles duplicate emails with an obfuscated message by default if not configured securely, 
        // but we'll let it handle it.
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phoneNumber,
                    role_id: 2 // Default role
                }
            }
        });

        if (error) {
            return { error: 'Failed to create account: ' + error.message };
        }

        if (!data.user) {
            return { error: 'Failed to create account. User not returned.' };
        }

        // Return a constructed User object for the UI representation
        // The actual database insert into the `users` table will be handled by the SQL trigger.
        const newUser: User = {
            id: data.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
            role_id: 2
        };

        return { user: newUser };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An error occurred during signup' };
    }
}

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    try {
        const supabase = await createClient();

        // 1. Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return { error: 'Supabase Auth Error: ' + error.message };
        }

        if (!data.user) {
            return { error: 'Invalid email or password' };
        }

        // 2. Fetch the custom user profile to match the old return type `User`
        // We need to fetch from `users` table because `auth.users` only contains auth data
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !userProfile) {
            return { error: `Profile Fetch Error: ${profileError?.message || 'User profile not found in database.'}` };
        }

        return { user: userProfile as User };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An error occurred during login' };
    }
}

export async function getClientProfile(userId: string) {
    if (!userId) return { error: 'No user ID provided' };

    try {
        const supabase = await createClient();

        // 1. Fetch User
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !userProfile) {
            console.error('Failed to fetch user profile:', profileError);
            return { error: 'User profile not found in database.' };
        }

        // 2. Fetch Role
        let roleName = 'Member';
        if (userProfile.role_id) {
            const { data: roleData, error: roleError } = await supabase
                .from('roles')
                .select('name')
                .eq('id', userProfile.role_id)
                .single();

            if (roleError || !roleData) {
                console.error(`Error fetching role for ID ${userProfile.role_id}:`, roleError);
                if (userProfile.role_id === 1) roleName = 'Member';
                else if (userProfile.role_id === 2) roleName = 'Admin';
                else if (userProfile.role_id === 3) roleName = 'System Admin';
            } else {
                roleName = roleData.name;
            }
        }

        return { user: userProfile as User, roleName };
    } catch (error: unknown) {
        console.error('getClientProfile error:', error);
        return { error: 'An unexpected error occurred.' };
    }
}
