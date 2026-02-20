'use server';

import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';
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
        // 1. Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return { error: 'User with this email already exists' };
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create user
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([
                {
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone_number: phoneNumber,
                    password: hashedPassword,
                    role_id: 2 // Default role
                }
            ])
            .select()
            .single();

        if (createError || !newUser) {
            return { error: 'Failed to create account: ' + createError?.message };
        }

        return { user: newUser as User };
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
        // 1. Find user by email
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (fetchError || !user) {
            return { error: 'Invalid email or password' };
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return { error: 'Invalid email or password' };
        }

        return { user: user as User };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An error occurred during login' };
    }
}
