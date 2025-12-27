'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';


interface PopupSettings {
    website_id: string;
    enabled: boolean;
    headline: string;
    subheadline: string;
    offer_text: string | null;
    trigger_type: 'time' | 'exit' | 'scroll';
    trigger_delay_seconds: number;
    trigger_scroll_percent: number;
}

interface Website {
    id: string;
    business_json?: {
        business_name?: string;
    };
    subdomain?: string;
}

export default function PopupManagerPage() {
    const { getAccessToken } = useAuth();
    const [websites, setWebsites] = useState<Website[]>([]);
    const [selectedWebsite, setSelectedWebsite] = useState<string>('');
    const [settings, setSettings] = useState<PopupSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

    // Fetch user websites
    useEffect(() => {
        async function fetchWebsites() {
            try {
                const token = await getAccessToken();
                const res = await fetch(`${API_BASE_URL}/api/websites`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setWebsites(data.websites || []);
                    if (data.websites?.length > 0) {
                        setSelectedWebsite(data.websites[0].id);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch websites:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchWebsites();
    }, []);

    // Fetch popup settings when website selected
    useEffect(() => {
        if (!selectedWebsite) return;

        async function fetchSettings() {
            try {
                const token = await getAccessToken();
                const res = await fetch(`${API_BASE_URL}/api/websites/${selectedWebsite}/popup`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (e) {
                console.error('Failed to fetch popup settings:', e);
            }
        }
        fetchSettings();
    }, [selectedWebsite]);

    const handleSave = async () => {
        if (!settings || !selectedWebsite) return;

        setSaving(true);
        setMessage(null);

        try {
            const token = await getAccessToken();
            const res = await fetch(`${API_BASE_URL}/api/websites/${selectedWebsite}/popup`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Popup settings saved successfully!' });
            } else {
                throw new Error('Failed to save');
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
                <div className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
                    <div className="h-12 bg-gray-200 rounded mb-4"></div>
                    <div className="h-12 bg-gray-200 rounded mb-4"></div>
                    <div className="h-12 bg-gray-200 rounded mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="popup-page">

            <div className="max-w-2xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Popup Manager</h1>
                    <p className="text-gray-600 mt-1">Configure lead capture popups for your websites</p>
                </div>

                {websites.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                        <div className="text-6xl mb-4">🏗️</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Websites Yet</h3>
                        <p className="text-gray-500">Create a website first to configure its popup.</p>
                    </div>
                ) : (
                    <>
                        {/* Website Selector */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Website</label>
                            <select
                                value={selectedWebsite}
                                onChange={(e) => setSelectedWebsite(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {websites.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.business_json?.business_name || w.subdomain || w.id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {settings && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                {/* Toggle */}
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Enable Popup</h3>
                                        <p className="text-sm text-gray-500">Show lead capture popup on this website</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                                        className={`relative w-14 h-8 rounded-full transition-colors ${settings.enabled ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings.enabled ? 'translate-x-7' : 'translate-x-1'
                                            }`}></span>
                                    </button>
                                </div>

                                {/* Content Settings */}
                                <div className="p-6 space-y-5 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900">Content</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                                        <input
                                            type="text"
                                            value={settings.headline}
                                            onChange={(e) => setSettings({ ...settings, headline: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Get a Free Quote!"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                                        <input
                                            type="text"
                                            value={settings.subheadline}
                                            onChange={(e) => setSettings({ ...settings, subheadline: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Fill in your details and we'll get back to you."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Offer Badge (Optional)</label>
                                        <input
                                            type="text"
                                            value={settings.offer_text || ''}
                                            onChange={(e) => setSettings({ ...settings, offer_text: e.target.value || null })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Get 10% Off!"
                                        />
                                    </div>
                                </div>

                                {/* Trigger Settings */}
                                <div className="p-6 space-y-5 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900">Trigger</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['time', 'exit', 'scroll'].map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setSettings({ ...settings, trigger_type: type as any })}
                                                    className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${settings.trigger_type === type
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {type === 'time' && '⏱️ Time'}
                                                    {type === 'exit' && '🚪 Exit Intent'}
                                                    {type === 'scroll' && '📜 Scroll'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {settings.trigger_type === 'time' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Delay (seconds)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="60"
                                                value={settings.trigger_delay_seconds}
                                                onChange={(e) => setSettings({ ...settings, trigger_delay_seconds: parseInt(e.target.value) || 5 })}
                                                className="w-32 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}

                                    {settings.trigger_type === 'scroll' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Scroll Percentage (%)
                                            </label>
                                            <input
                                                type="number"
                                                min="10"
                                                max="90"
                                                value={settings.trigger_scroll_percent}
                                                onChange={(e) => setSettings({ ...settings, trigger_scroll_percent: parseInt(e.target.value) || 50 })}
                                                className="w-32 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="p-6">
                                    {message && (
                                        <div className={`mb-4 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
