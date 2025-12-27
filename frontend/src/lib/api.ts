
import { createClient } from '@/utils/supabase/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export async function getCredits() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return { balance: 0, lifetime_earned: 0, lifetime_spent: 0 };

    try {
        const res = await fetch(`${API_BASE_URL}/api/credits`, {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            },
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`Fetch failed (credits): ${res.status} ${res.statusText}`, text);
            throw new Error(`Failed to fetch credits: ${res.status}`);
        }

        const data = await res.json();
        // Backend returns the credits object directly
        return data || { balance: 0, lifetime_earned: 0, lifetime_spent: 0 };
    } catch (e) {
        console.error("Error fetching credits:", e);
        return { balance: 0, lifetime_earned: 0, lifetime_spent: 0 };
    }
}

export async function getWebsites() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return [];

    try {
        const res = await fetch(`${API_BASE_URL}/api/websites`, {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            },
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`Fetch failed (websites): ${res.status} ${res.statusText}`, text);
            throw new Error(`Failed to fetch websites: ${res.status}`);
        }

        const data = await res.json();
        return data.websites || [];
    } catch (e) {
        console.error("Error fetching websites:", e);
        return [];
    }
}
