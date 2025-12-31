'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import RealityCheck from '@/components/RealityCheck';
import UseCasesTicker from '@/components/UseCasesTicker';
import BentoFeatures from '@/components/BentoFeatures';
import VersusComparison from '@/components/VersusComparison';
import UseCaseCarousel from '@/components/UseCaseCarousel';
import BetaPricing from '@/components/BetaPricing';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Home() {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  return (
    <div className="app">
      <Header language={language} setLanguage={setLanguage} />
      <main>
        <Hero language={language} />
        <RealityCheck />
        <UseCasesTicker />
        <BentoFeatures />
        <VersusComparison />
        <UseCaseCarousel />
        <BetaPricing />
        <FAQ />
      </main>
      <Footer language={language} />
    </div>
  );
}
