
'use client';

import { useAuth } from '@/context/AuthContext';

export default function DashboardHeader() {
    const { user, logout } = useAuth();

    const getUserName = () => {
        if (!user) return '';
        const metadata = user.user_metadata;
        return metadata?.full_name || metadata?.name || user.email?.split('@')[0] || '';
    };

    return (
        <div className="dashboard-header">
            <div className="dashboard-welcome">
                <h1>Welcome back, {getUserName()}! 👋</h1>
            </div>
            <button onClick={logout} className="btn-text logout-btn">
                Logout
            </button>
        </div>
    );
}
