import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createClient();
        const { error, data } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
            const user = data.session.user;

            // Ensure the user exists in the public.users table
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (!existingUser) {
                // If the trigger failed (or didn't have metadata), insert them manually
                console.log('Creating missing public.users profile for Google user:', user.id);
                
                // Extract possible name info from Google's metadata
                const metadata = user.user_metadata || {};
                const fullName = metadata.full_name || metadata.name || '';
                
                let firstName = 'Google';
                let lastName = 'User';
                
                if (fullName) {
                    const nameParts = fullName.split(' ');
                    firstName = nameParts[0];
                    lastName = nameParts.slice(1).join(' ') || '';
                }

                await supabase.from('users').insert({
                    id: user.id,
                    email: user.email,
                    first_name: firstName,
                    last_name: lastName,
                    role_id: 2, // Default role
                    password: 'google-oauth-managed', // Dummy password
                });
            }

            return NextResponse.redirect(`${requestUrl.origin}${next}`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${requestUrl.origin}/login?error=Could not authenticate with provider`);
}
