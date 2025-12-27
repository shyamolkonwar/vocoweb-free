
import { getCredits } from "@/lib/api";

export async function CreditCard() {
    const credits = await getCredits();

    // Defaulting to English content for the server component
    // In a full i18n app, this would read from dictionary based on lang prop or context
    const t = {
        credits: 'Credits',
        creditsInfo: 'Used for creating & editing websites'
    };

    return (
        <div className="dashboard-card">
            <div className="card-icon">🎯</div>
            <div className="card-content">
                <h3>{t.credits}</h3>
                <p className="card-stat">{credits.balance}</p>
                <p className="card-subtitle">{t.creditsInfo}</p>
            </div>
        </div>
    );
}

export async function WebsitesCountCard() {
    // We can fetch websites just to get the count, or modify api to get count.
    // Reusing getWebsites() for now as it's cached/parallel
    const { getWebsites } = await import("@/lib/api");
    const websites = await getWebsites();

    const t = {
        myWebsites: 'My Websites'
    };

    return (
        <div className="dashboard-card">
            <div className="card-icon">🌐</div>
            <div className="card-content">
                <h3>{t.myWebsites}</h3>
                <p className="card-stat">{websites.length}</p>
            </div>
        </div>
    );
}
