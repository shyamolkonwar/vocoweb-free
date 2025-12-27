'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/dashboard', label: 'Websites', icon: '🌐' },
    { href: '/dashboard/leads', label: 'Leads', icon: '📬' },
    { href: '/dashboard/popup', label: 'Popup Manager', icon: '🔔' },
];

export function DashboardNav() {
    const pathname = usePathname();

    return (
        <nav className="dashboard-sub-nav">
            <div className="nav-links-container">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-pill ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            <style jsx>{`
                .dashboard-sub-nav {
                    margin-bottom: 2rem;
                }
                
                .nav-links-container {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                
                .nav-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1.25rem;
                    border-radius: 999px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #6b7280;
                    background: transparent;
                    border: 1px solid transparent;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                
                .nav-pill:hover {
                    background: rgba(0, 0, 0, 0.04);
                    color: #374151;
                }
                
                .nav-pill.active {
                    background: #ffffff;
                    color: #111827;
                    border-color: rgba(0, 0, 0, 0.08);
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
                }
                
                .nav-icon {
                    font-size: 1rem;
                }
                
                .nav-label {
                    white-space: nowrap;
                }
                
                @media (max-width: 640px) {
                    .nav-pill {
                        padding: 0.5rem 1rem;
                        font-size: 0.8125rem;
                    }
                }
            `}</style>
        </nav>
    );
}
