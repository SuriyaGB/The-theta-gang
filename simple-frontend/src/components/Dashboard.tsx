'use client';
// Connected to Live VPS API

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  ChevronRight,
  Search,
  Bell,
  Settings,
  LayoutDashboard,
  Briefcase,
  History,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<any>({
    summary: { totalValue: 0, change24h: 0, availableCash: 0, netTheta: 0, deltaExposure: 0, targetBP: 0 },
    positions: [],
    history: [],
    performance: [],
    logs: [],
    source: 'loading'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Use the VPS API if configured, otherwise fall back to local API
        const fetchUrl = '/api/data';
        const res = await fetch(fetchUrl);
        const json = await res.json();
        setData({
          summary: json.summary || { totalValue: 0, change24h: 0, availableCash: 0, netTheta: 0, deltaExposure: 0, targetBP: 0 },
          positions: json.positions || [],
          history: json.history || [],
          performance: json.performance || [],
          logs: json.logs || [],
          source: json.source || 'live'
        });
      } catch (err) {
        console.error('Failed to fetch live data from:', process.env.NEXT_PUBLIC_API_URL);
        setData((prev: any) => ({ ...prev, source: 'error' }));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    
    // Optional: Refresh every 30 seconds for true "live" feel
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const { summary, positions, history, performance, logs } = data;
  const chartData = performance;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-border p-6 flex flex-col gap-8 hidden lg:flex">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center glow-blue">
            <TrendingUp className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">THETAGANG</span>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem
            icon={<Briefcase size={20} />}
            label="Portfolio"
            active={activeTab === 'portfolio'}
            onClick={() => setActiveTab('portfolio')}
          />
          <NavItem
            icon={<History size={20} />}
            label="History"
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          />
          <NavItem
            icon={<Activity size={20} />}
            label="Live Logs"
            active={activeTab === 'logs'}
            onClick={() => setActiveTab('logs')}
          />
          <NavItem
            icon={<PieChartIcon size={20} />}
            label="Analytics"
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
          <NavItem
            icon={<Settings size={20} />}
            label="Settings"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </nav>

        <div className="mt-auto">
          <div className="glass-card p-4 rounded-xl">
            <p className="text-xs text-muted-foreground mb-2">Current Bot Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Running • AAPL Wheel</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Trading Dashboard v3.2</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Clock size={14} /> Last update: 13:52 PST
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${data.source === 'live' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
              {data.source} Data
            </div>
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search symbols..."
                className="w-full bg-secondary/50 border border-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <button className="p-2 glass rounded-lg hover:bg-accent transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Net Liquidation"
            value={`$${summary.totalValue.toLocaleString()}`}
            change={`+${summary.change24h}%`}
            trend="up"
            icon={<DollarSign size={20} className="text-emerald-500" />}
          />
          <StatCard
            title="Excess Liquidity"
            value={`$${summary.availableCash.toLocaleString()}`}
            change="Safe"
            trend="up"
            icon={<Activity size={20} className="text-primary" />}
          />
          <StatCard
            title="Target BP Usage"
            value={`$${summary.targetBP?.toLocaleString()}`}
            change="100% Cushion"
            trend="neutral"
            icon={<Briefcase size={20} className="text-amber-500" />}
          />
          <StatCard
            title="Net Theta"
            value={`$${summary.netTheta.toLocaleString()}/day`}
            change="Stable"
            trend="up"
            icon={<TrendingUp size={20} className="text-rose-500" />}
          />
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Dashboard and Analytics View */}
          {(activeTab === 'dashboard' || activeTab === 'analytics') && (
            <div className="xl:col-span-2 glass-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Portfolio Performance</h2>
              </div>
              <div className="h-[300px] w-full min-h-[300px]">
                <ResponsiveContainer width="99%" height="99%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* History View */}
          {(activeTab === 'dashboard' || activeTab === 'history') && (
            <div className={`${activeTab === 'history' ? 'xl:col-span-3' : ''} glass-card rounded-2xl p-6`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Recent Activity</h2>
              </div>
              {history.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {history.map((trade: any) => (
                    <div key={trade.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors group">
                      <div className={`w-2 h-10 rounded-full ${trade.status === 'FILLED' ? 'bg-emerald-500' : 'bg-destructive'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{trade.symbol}</p>
                        <p className="text-xs text-muted-foreground">{trade.time} • {trade.action}</p>
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${trade.status === 'FILLED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-destructive/20 text-destructive'}`}>
                        {trade.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No recent activity found.</div>
              )}
            </div>
          )}

          {/* Portfolio View */}
          {(activeTab === 'dashboard' || activeTab === 'portfolio') && (
            <div className="xl:col-span-3 glass-card rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-semibold">Active Positions</h2>
              </div>
              {positions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-secondary/30 text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-medium">Position</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium text-right">Qty</th>
                        <th className="px-6 py-4 font-medium text-right">Entry</th>
                        <th className="px-6 py-4 font-medium text-right">Market</th>
                        <th className="px-6 py-4 font-medium text-right">P/L</th>
                        <th className="px-6 py-4 font-medium text-right">Theta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {positions.map((pos: any) => (
                        <tr key={pos.id} className="hover:bg-accent/30 transition-colors group">
                          <td className="px-6 py-4 font-medium">{pos.symbol}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${pos.type.includes('Call') ? 'bg-primary/20 text-primary' : 'bg-emerald-500/20 text-emerald-500'}`}>
                              {pos.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-muted-foreground">{pos.quantity}</td>
                          <td className="px-6 py-4 text-right font-mono">${pos.entryPrice?.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-mono">${pos.marketPrice?.toFixed(2)}</td>
                          <td className={`px-6 py-4 text-right font-bold ${pos.pnl >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                            +${pos.pnl.toLocaleString()}
                            <span className="text-[10px] ml-1 opacity-70">({pos.pnlPercent.toFixed(1)}%)</span>
                          </td>
                          <td className="px-6 py-4 text-right text-primary font-mono">${pos.theta}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground">No active positions found.</div>
              )}
            </div>
          )}

          {/* Logs View */}
          {activeTab === 'logs' && (
            <div className="xl:col-span-3 glass-card rounded-2xl p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity size={20} className="text-emerald-500" />
                  Live Terminal Output
                </h2>
                <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                  Showing last 50 lines
                </div>
              </div>
              <div className="bg-black/50 rounded-xl p-4 font-mono text-xs md:text-sm overflow-y-auto max-h-[600px] border border-border/50">
                {logs && logs.length > 0 ? (
                  logs.map((line: string, i: number) => (
                    <div key={i} className="py-0.5 border-b border-white/5 last:border-0 text-emerald-500/90 whitespace-pre-wrap">
                      <span className="text-muted-foreground mr-2 opacity-50">[{i+1}]</span>
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground italic">No logs available. Make sure the bot is running and logs are enabled.</div>
                )}
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeTab === 'settings' && (
            <div className="xl:col-span-3 glass-card rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-6">Application Settings</h2>
              <div className="flex flex-col gap-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Bot API Endpoint</label>
                  <input type="text" className="w-full bg-secondary/50 border border-border rounded-lg py-2 px-4" defaultValue="http://localhost:3000/api/data" />
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                  <div>
                    <p className="font-medium">Auto-Refresh</p>
                    <p className="text-xs text-muted-foreground">Automatically fetch data every 60s</p>
                  </div>
                  <div className="w-12 h-6 bg-primary rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-primary text-white glow-blue' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ title, value, change, trend, icon }: { title: string, value: string, change: string, trend: 'up' | 'down' | 'neutral', icon: React.ReactNode }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="glass-card p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden"
  >
    <div className="flex justify-between items-start">
      <div className="p-2 bg-secondary rounded-lg">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${trend === 'up' ? 'bg-emerald-500/20 text-emerald-500' :
          trend === 'down' ? 'bg-rose-500/20 text-rose-500' :
            'bg-muted text-muted-foreground'
        }`}>
        {trend === 'up' && <TrendingUp size={12} />}
        {trend === 'down' && <TrendingDown size={12} />}
        {change}
      </div>
    </div>
    <div>
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
    </div>
    <div className="absolute -bottom-1 -right-1 w-16 h-16 opacity-5">
      {icon}
    </div>
  </motion.div>
);

export default Dashboard;
