import { getCredits } from "@/lib/api";
import Link from 'next/link';
import { CreditCard as CreditCardIcon, LayoutGrid } from 'lucide-react';

export async function CreditCard() {
    const credits = await getCredits();

    return (
        <div
            className="p-4 md:p-6"
            style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <div>
                    <h3 style={{
                        color: '#64748b',
                        fontSize: '12px',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: 0
                    }}>Available Credits</h3>
                    <p
                        className="text-3xl md:text-4xl"
                        style={{
                            fontWeight: 'bold',
                            color: '#1e293b',
                            marginTop: '8px',
                            marginBottom: 0
                        }}
                    >{credits.balance}</p>
                </div>
                <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#f0fdfa',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0d9488'
                }}>
                    <CreditCardIcon size={20} />
                </div>
            </div>
            <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9'
            }}>
                <Link
                    href="/dashboard/credits"
                    style={{
                        fontSize: '14px',
                        color: '#0d9488',
                        fontWeight: 500,
                        textDecoration: 'none'
                    }}
                >
                    Buy more credits →
                </Link>
            </div>
        </div>
    );
}

export async function WebsitesCountCard() {
    const { getWebsites } = await import("@/lib/api");
    const websites = await getWebsites();

    return (
        <div
            className="p-4 md:p-6"
            style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <div>
                    <h3 style={{
                        color: '#64748b',
                        fontSize: '12px',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: 0
                    }}>My Websites</h3>
                    <p
                        className="text-3xl md:text-4xl"
                        style={{
                            fontWeight: 'bold',
                            color: '#1e293b',
                            marginTop: '8px',
                            marginBottom: 0
                        }}
                    >{websites.length}</p>
                </div>
                <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#f0fdfa',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0d9488'
                }}>
                    <LayoutGrid size={20} />
                </div>
            </div>
            <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9'
            }}>
                <Link
                    href="/create"
                    style={{
                        fontSize: '14px',
                        color: '#0d9488',
                        fontWeight: 500,
                        textDecoration: 'none'
                    }}
                >
                    Create new website →
                </Link>
            </div>
        </div>
    );
}
