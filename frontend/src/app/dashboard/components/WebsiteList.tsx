
import Link from 'next/link';
import { getWebsites } from "@/lib/api";

export async function WebsiteList() {
    const websites = await getWebsites();

    const t = {
        myWebsites: 'My Websites',
        noWebsites: 'No websites yet',
        createFirst: 'Create your first website',
        live: 'Published',
        draft: 'Draft',
        edit: 'Edit',
        preview: 'Preview'
    };

    return (
        <section className="dashboard-section">
            <h2>{t.myWebsites}</h2>

            {websites.length === 0 ? (
                <div className="websites-empty">
                    <div className="empty-icon">🏗️</div>
                    <p>{t.noWebsites}</p>
                    <Link href="/create" className="btn-secondary">
                        {t.createFirst}
                    </Link>
                </div>
            ) : (
                <div className="websites-grid">
                    {websites.map((website: any) => (
                        <div key={website.id} className="website-card">
                            <div className="website-card-header">
                                <h3>{website.business_json?.business_name || 'Untitled Website'}</h3>
                                <span className={`website-badge ${website.status === 'live' ? 'live' : 'draft'}`}>
                                    {website.status === 'live' ? t.live : t.draft}
                                </span>
                            </div>
                            <p className="website-type">{website.business_json?.business_type || 'Business'}</p>
                            <div className="website-card-actions">
                                <Link href={`/editor/${website.id}`} className="btn-secondary btn-small">
                                    {t.edit}
                                </Link>
                                <Link href={`/preview/${website.id}`} className="btn-text btn-small">
                                    {t.preview}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
