'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustSignals from '@/components/TrustSignals';
import Features from '@/components/Features';
import Footer from '@/components/Footer';

export default function Home() {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  return (
    <div className="app">
      <Header language={language} setLanguage={setLanguage} />
      <main>
        <Hero language={language} />
        <TrustSignals language={language} />
        <Features language={language} />
      </main>
      <Footer language={language} />
    </div>
  );
}
