'use client';

import { useState } from 'react';

interface Lead {
    id: string;
    website_id: string;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    message?: string;
    service_interested?: string;
    source_page: string;
    status: 'new' | 'contacted' | 'converted';
    created_at: string;
    website_name?: string;
    website_subdomain?: string;
}

interface LeadStatsData {
    total_leads: number;
    new_leads: number;
    contacted_leads: number;
    converted_leads: number;
    leads_this_week: number;
}

export function LeadStats({ stats }: { stats: LeadStatsData }) {
    return (
        <div className="leads-stats grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="stat-card bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-gray-900">{stats.total_leads}</div>
                <div className="text-sm text-gray-500">Total Leads</div>
            </div>
            <div className="stat-card bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
                <div className="text-3xl font-bold text-blue-600">{stats.new_leads}</div>
                <div className="text-sm text-blue-600">New</div>
            </div>
            <div className="stat-card bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
                <div className="text-3xl font-bold text-yellow-600">{stats.contacted_leads}</div>
                <div className="text-sm text-yellow-600">Contacted</div>
            </div>
            <div className="stat-card bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
                <div className="text-3xl font-bold text-green-600">{stats.converted_leads}</div>
                <div className="text-sm text-green-600">Converted</div>
            </div>
        </div>
    );
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
    const [filter, setFilter] = useState<string>('all');

    const filteredLeads = leads.filter(lead => {
        if (filter === 'all') return true;
        return lead.status === filter;
    });

    const updateStatus = async (leadId: string, newStatus: string) => {
        // This would call the API to update status
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
        try {
            await fetch(`${API_BASE_URL}/api/leads/${leadId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            window.location.reload();
        } catch (e) {
            console.error('Failed to update status:', e);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const classes = {
            new: 'bg-blue-100 text-blue-800',
            contacted: 'bg-yellow-100 text-yellow-800',
            converted: 'bg-green-100 text-green-800'
        };
        return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
    };

    if (leads.length === 0) {
        return (
            <div className="leads-empty bg-white rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leads Yet</h3>
                <p className="text-gray-500">When visitors fill out forms on your website, they'll appear here.</p>
            </div>
        );
    }

    return (
        <div className="leads-table-container bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Filter Tabs */}
            <div className="leads-filters flex gap-2 p-4 border-b border-gray-100">
                {['all', 'new', 'contacted', 'converted'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Service</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Website</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredLeads.map(lead => (
                            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4">
                                    <div className="font-medium text-gray-900">{lead.customer_name}</div>
                                    {lead.message && (
                                        <div className="text-sm text-gray-500 truncate max-w-[200px]">{lead.message}</div>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="space-y-1">
                                        {lead.customer_phone && (
                                            <a href={`tel:${lead.customer_phone}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                                                📞 {lead.customer_phone}
                                            </a>
                                        )}
                                        {lead.customer_email && (
                                            <a href={`mailto:${lead.customer_email}`} className="flex items-center gap-1 text-sm text-gray-600 hover:underline">
                                                ✉️ {lead.customer_email}
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600">
                                    {lead.service_interested || '-'}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600">
                                    {lead.website_name || lead.website_subdomain || '-'}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(lead.status)}`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                    {formatDate(lead.created_at)}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex gap-2">
                                        {lead.customer_phone && (
                                            <a
                                                href={`tel:${lead.customer_phone}`}
                                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                                            >
                                                Call
                                            </a>
                                        )}
                                        {lead.status !== 'converted' && (
                                            <button
                                                onClick={() => updateStatus(lead.id, lead.status === 'new' ? 'contacted' : 'converted')}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                                            >
                                                {lead.status === 'new' ? 'Mark Contacted' : 'Mark Converted'}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function LeadsTableSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="grid grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
                ))}
            </div>
            <div className="bg-white rounded-xl p-4">
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
                ))}
            </div>
        </div>
    );
}
