'use client';

import { Check, X } from 'lucide-react';

export default function VersusComparison() {
    const features = [
        {
            name: 'Setup Time',
            vocoweb: '30 Seconds',
            traditional: '2 - 4 Weeks',
            whatsapp: 'Instant',
            vocowebWins: true
        },
        {
            name: 'Technical Skill',
            vocoweb: 'None (Voice)',
            traditional: 'High (Drag & Drop)',
            whatsapp: 'None',
            vocowebWins: true
        },
        {
            name: 'Google Visibility',
            vocoweb: 'High (SEO Included)',
            traditional: 'Varies',
            whatsapp: 'Zero (Invisible on Search)',
            vocowebWins: true
        },
        {
            name: 'Copywriting',
            vocoweb: 'Auto-Written by AI',
            traditional: 'You write everything',
            whatsapp: 'You write everything',
            vocowebWins: true
        },
        {
            name: 'Hidden Fees',
            vocoweb: 'None',
            traditional: 'Hosting, Plugins, Domains',
            whatsapp: 'Free',
            vocowebWins: true
        },
        {
            name: 'Updates',
            vocoweb: 'Voice Command',
            traditional: 'Manual Editing',
            whatsapp: 'New Post Every Day',
            vocowebWins: true
        }
    ];

    return (
        <section className="versus-section">
            <div className="versus-container">
                <h2 className="versus-title">Why 5,000+ businesses are switching to VocoWeb</h2>

                <div className="versus-table-wrapper">
                    <table className="versus-table">
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th className="vocoweb-col">
                                    <span className="table-header-highlight">VocoWeb AI</span>
                                </th>
                                <th>Traditional Builders<br /><span className="table-subtitle">(Wix/WP)</span></th>
                                <th>Just WhatsApp/<br />Instagram</th>
                            </tr>
                        </thead>
                        <tbody>
                            {features.map((feature, index) => (
                                <tr key={index}>
                                    <td className="feature-name">{feature.name}</td>
                                    <td className="vocoweb-col">
                                        <span className="feature-value vocoweb-value">{feature.vocoweb}</span>
                                    </td>
                                    <td>
                                        <span className="feature-value">{feature.traditional}</span>
                                    </td>
                                    <td>
                                        <span className="feature-value">{feature.whatsapp}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
