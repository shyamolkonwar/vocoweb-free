
export function CardSkeleton() {
    return (
        <div className="dashboard-card animate-pulse">
            <div className="card-icon bg-gray-200 rounded-full w-10 h-10"></div>
            <div className="card-content w-full">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
        </div>
    );
}

export function WebsiteListSkeleton() {
    return (
        <section className="dashboard-section animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="websites-grid">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="website-card">
                        <div className="h-24 bg-gray-200 rounded-md mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        </section>
    );
}
