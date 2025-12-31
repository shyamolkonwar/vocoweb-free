'use client';

export default function UseCasesTicker() {
  const useCases = [
    'Dentists',
    'Tuitions',
    'Salons',
    'Restaurants',
    'Freelancers',
    'Repair Shops',
    'Gyms',
    'Clinics',
    'Boutiques',
    'Cafes'
  ];

  // Double the items for seamless loop
  const allItems = [...useCases, ...useCases];

  return (
    <section className="ticker-section">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {allItems.map((item, index) => (
            <span key={index} className="ticker-item">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
