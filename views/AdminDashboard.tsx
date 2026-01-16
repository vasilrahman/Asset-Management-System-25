
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import { Package, Activity, CheckCircle, Clock, MoreHorizontal, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { fetchDashboardData, DashboardData } from '../services/dashboardService';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const AdminDashboard = () => {
    const { navigate } = useApp();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchDashboardData();
                setDashboardData(data);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading || !dashboardData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-slate-600 dark:text-slate-400">Loading dashboard...</div>
            </div>
        );
    }

    // KPIs
    const { totalAssets, activeAssets, verifiedToday, complaintsCount, charts, recent } = dashboardData;
    
    // Transform data for charts
    const assetsByCategory = (charts?.assetsByCategory || []).map(item => ({ name: item.category, value: item.count }));
    const assetsByStatus = (charts?.assetsByStatus || []).map(item => ({ name: item.status, value: item.count }));
    const verificationTrend = (charts?.verificationTrend || []).map(item => ({ day: item.date, count: item.count }));
    
    // Extract recent data
    const recentAssets = recent?.recentAssets || [];
    const recentVerifiedRaw = recent?.recentVerified || [];
    const recentVerified = recentVerifiedRaw.map((item, index) => {
        const asset = recentAssets.find(a => a.id === item.assetId);
        return {
            id: item.assetId || index.toString(),
            assetName: asset?.name || 'Unknown',
            verifiedBy: item.verifiedBy,
            timestamp: item.verifiedAt,
        };
    });
    

    return (
        <div className="space-y-8 pb-12">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Assets" value={totalAssets} icon={<Package />} trend="+12%" />
                <KpiCard title="Active Assets" value={activeAssets} icon={<Activity />} trend="+5%" />
                <KpiCard title="Verified Today" value={verifiedToday} icon={<CheckCircle />} trend="+8%" />
                <KpiCard title="Complaints Issued" value={complaintsCount} icon={<AlertTriangle />} trend="+2%" isNegative />
            </div>

            {/* Row 1: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col transition-colors duration-200">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Assets by Category</h3>
                    <div className="flex-1 min-h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={assetsByCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {assetsByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col transition-colors duration-200">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Assets by Status</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assetsByStatus} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 6, 6]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Verification Trend (Line Chart) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col transition-colors duration-200">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Verification Trend</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={verificationTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 2: Tables (Recently Added & Recently Verified) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recently Added Assets */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recently Added Assets</h3>
                        <button onClick={() => navigate('/assets')} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-50 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Asset ID</th>
                                    <th className="px-4 py-3 font-medium">Asset</th>
                                    <th className="px-4 py-3 font-medium">Category</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                {recentAssets.map(asset => (
                                    <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">{asset.id}</td>
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{asset.name}</td>
                                        <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300">{asset.category}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recently Verified */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col transition-colors duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recently Verified</h3>
                        <button onClick={() => navigate('/verified')} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700">View All</button>
                    </div>
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-50 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Asset</th>
                                    <th className="px-4 py-3 font-medium">Verified By</th>
                                    <th className="px-4 py-3 font-medium text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                {recentVerified.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{log.assetName}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{log.verifiedBy}</td>
                                        <td className="px-4 py-3 text-right text-slate-400 font-light">
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ title, value, icon, trend, isNegative }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${isNegative ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'} group-hover:scale-110 transition-transform`}>
                {React.cloneElement(icon, { size: 22 })}
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isNegative ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                {trend} <ArrowUpRight size={12} />
            </div>
        </div>
        <div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">{value}</h3>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{title}</p>
        </div>
    </div>
);
