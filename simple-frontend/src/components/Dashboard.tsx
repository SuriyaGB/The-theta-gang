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
  PieChart as PieChartIcon,
  Terminal
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-2 font-medium">{data.fullTime || label}</p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-6">
            <span className="text-xs text-slate-400 font-medium">Net Liquidation:</span>
            <span className="text-sm font-bold text-blue-400">
              ${Number(data.value).toLocaleString()}
            </span>
          </div>
          {data.cash !== undefined && (
            <div className="flex justify-between items-center gap-6">
              <span className="text-xs text-slate-400 font-medium">Total Cash:</span>
              <span className="text-sm font-bold text-emerald-400">
                ${Number(data.cash).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<any>({
    summary: { totalValue: 0, change24h: 0, availableCash: 0, totalCash: 0, netTheta: 0, deltaExposure: 0, targetBP: 0 },
    positions: [],
    history: [],
    performance: [],
    logs: [],
    symbols: [],
    shoppingList: [],
    activeOrders: [],
    challenge: null,
    source: 'loading'
  });
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Record<number, boolean>>({});

  const toggleLog = (index: number) => {
    setExpandedLogs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Use the VPS API if configured, otherwise fall back to local API
        const fetchUrl = '/api/data';
        const res = await fetch(fetchUrl);
        const json = await res.json();
        setData({
          summary: json.summary || { totalValue: 0, change24h: 0, availableCash: 0, totalCash: 0, netTheta: 0, deltaExposure: 0, targetBP: 0 },
          positions: json.positions || [],
          history: json.history || [],
          performance: json.performance || [],
          logs: json.logs || [],
          symbols: json.symbols || [],
          shoppingList: json.shoppingList || [],
          activeOrders: json.activeOrders || [],
          challenge: json.challenge || null,
          source: json.source || 'live',
          status: json.status || { database: 'Unknown', timezone: 'UTC', server: 'Online' },
          lastUpdate: json.lastUpdate || null
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
              <Clock size={14} /> Last update: {data.lastUpdate || '...'} UTC
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
        {/* Challenge Progress Bar */}
        {data.challenge && (
          <div className="mb-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-slate-400">30-Day Mission Progress</h3>
              <span className="text-xs font-bold text-blue-400">Day {data.challenge.day} of 30</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000"
                style={{ width: `${data.challenge.percent}%` }}
              ></div>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 text-right italic">
              Bot self-destructs in {data.challenge.remaining} days
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Net Liquidation"
            value={`$${summary.totalValue.toLocaleString()}`}
            change={`+${summary.change24h}%`}
            trend="up"
            icon={<DollarSign size={20} className="text-emerald-500" />}
          />
          <StatCard
            title="Total Cash"
            value={`$${(summary.totalCash || 0).toLocaleString()}`}
            change="Available"
            trend="up"
            icon={<DollarSign size={20} className="text-blue-400" />}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 xl:col-span-3">
          {/* Main Chart */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-border min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-bold">Portfolio Performance</h3>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                  <span className="text-slate-400 font-medium">Net Liquidation</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500 inline-block"></span>
                  <span className="text-slate-400 font-medium">Total Cash</span>
                </div>
                <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full">30D Challenge</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(() => {
                  // Group data by date to avoid repeating X-axis labels
                  const grouped: any = {};
                  chartData.forEach((d: any) => {
                    grouped[d.name] = {
                      value: d.value,
                      cash: d.cash,
                      fullTime: d.fullTime
                    };
                  });
                  return Object.entries(grouped).map(([name, item]: any) => ({
                    name,
                    value: item.value,
                    cash: item.cash,
                    fullTime: item.fullTime
                  }));
                })()}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    minTickGap={0}
                    tickFormatter={(value, index) => {
                      const performanceData = data.performance || [];
                      const item = performanceData[index];
                      if (!item) return "";
                      
                      const currentDay = item.name.split(' ').slice(0, 2).join(' '); // e.g. "May 19"
                      if (index === 0) return currentDay;
                      
                      const prevItem = performanceData[index - 1];
                      const prevDay = prevItem.name.split(' ').slice(0, 2).join(' ');
                      
                      if (currentDay !== prevDay) {
                        return currentDay;
                      }
                      return "";
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `$${(value/1000).toFixed(1)}k`}
                    domain={['dataMin - 100', 'dataMax + 100']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} name="Net Liquidation" />
                  <Area type="monotone" dataKey="cash" stroke="#10b981" fillOpacity={1} fill="url(#colorCash)" strokeWidth={2} strokeDasharray="5 5" name="Total Cash" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity / Active Orders */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold mb-6">Active Orders (Live)</h3>
            <div className="space-y-4">
              {data.activeOrders && data.activeOrders.length > 0 ? (
                data.activeOrders.map((order: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-bold">{order.symbol} {order.contract}</span>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase">{order.status}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{order.action} {order.qty}x</span>
                      <span className="text-blue-400 font-bold">{order.price}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm italic">
                  <Activity size={32} className="mb-2 opacity-20" />
                  No open orders. Bot is waiting for entry.
                </div>
              )}
            </div>
          </div>
        </div>
          )}

        {/* Shopping List Section */}
        {(activeTab === 'dashboard') && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8 xl:col-span-3">
          <div className="xl:col-span-3 glass rounded-2xl p-6 border border-border max-h-[500px] overflow-y-auto">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Activity className="text-blue-400" size={18} />
              Decision History (Mission Log)
            </h3>
            <div className="space-y-3">
              {data.shoppingList && data.shoppingList.length > 0 ? (
                [...data.shoppingList].reverse().map((item: any, i: number) => (
                  <div 
                    key={i} 
                    onClick={() => toggleLog(i)}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group cursor-pointer"
                  >
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.action === 'Write' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-200">{item.symbol || 'Bot Brain'}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${item.action === 'Write' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                            {item.action || 'Skip'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-mono break-words">{item.detail}</p>
                      
                      {/* Expanded Contract Detail */}
                      {item.contract && expandedLogs[i] && (
                        <div className={`mt-3 p-3 bg-black/40 rounded-lg border flex flex-col gap-1 ${item.contract.includes('Failed') ? 'border-rose-500/30' : 'border-emerald-500/30'}`}>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${item.contract.includes('Failed') ? 'text-rose-500' : 'text-emerald-500'}`}>
                            Execution Details
                          </span>
                          <span className={`text-xs font-mono ${item.contract.includes('Failed') ? 'text-rose-400' : 'text-emerald-400'}`}>
                            ↳ {item.contract}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-sm italic py-4">No trading decisions found in latest scan.</div>
              )}
            </div>
          </div>

          <div className="xl:col-span-1 glass rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Briefcase className="text-blue-400" size={18} />
              Assets
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {data.symbols && data.symbols.length > 0 ? (
                data.symbols.map((symbol: string, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col items-center gap-2 group hover:bg-blue-500/10 transition-all">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">
                      {symbol[0]}
                    </div>
                    <span className="text-lg font-black text-slate-200 tracking-tighter">{symbol}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-sm italic py-4">None.</div>
              )}
            </div>
          </div>
        </div>
        )}

          {/* History View */}
          {(activeTab === 'history') && (
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
                <div className="text-center py-12 text-muted-foreground italic text-sm">
                  History is empty because no orders have "Filled" yet. <br/>
                  The bot is currently hunting for entries on red days! 🛡️🏹
                </div>
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
                            {pos.pnl >= 0 ? '+' : '-'}${Math.abs(pos.pnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
            <div className="xl:col-span-3 glass rounded-2xl border border-border overflow-hidden flex flex-col h-[700px]">
              <div className="p-4 border-b border-border bg-slate-800/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-primary" />
                  <h3 className="font-bold text-sm">Mission Log Archive (Last 5,000 lines)</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Streaming
                  </span>
                  <span>UTC Engine</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-black/40 font-mono text-[11px] leading-relaxed text-slate-300 custom-scrollbar">
                {data.logs && data.logs.length > 0 ? (
                  data.logs.map((log: string, i: number) => (
                    <div key={i} className="py-0.5 hover:bg-white/5 px-2 rounded transition-colors whitespace-pre-wrap">
                      <span className="text-slate-600 mr-2">[{i + 1}]</span>
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 italic">
                    Waiting for log data from May 13...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeTab === 'settings' && (
            <div className="xl:col-span-3 space-y-6">
              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-xl font-bold mb-6">Network Infrastructure</h2>
                <div className="flex flex-col gap-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Primary Data Source</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        readOnly
                        className="w-full bg-secondary/50 border border-border rounded-lg py-2 px-4 font-mono text-sm text-blue-400" 
                        defaultValue="Vercel Secure Proxy (/api/data)" 
                      />
                      <div className="absolute right-3 top-2.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Backend Engine (VPS)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        readOnly
                        className="w-full bg-secondary/10 border border-border/50 rounded-lg py-2 px-4 font-mono text-xs text-slate-500" 
                        defaultValue="ThetaGang VPS v1.0 [134.209.155.66]" 
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">The Vercel proxy securely tunnels data from your VPS analytics engine.</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                    <div>
                      <p className="font-medium">Auto-Refresh</p>
                      <p className="text-xs text-muted-foreground">Fetching data every 60s</p>
                    </div>
                    <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-xl font-bold mb-6">System Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-secondary/20 rounded-xl border border-border flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${data.status?.database === 'Healthy' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Database</p>
                      <p className="text-sm font-bold">SQLite {data.status?.database || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-secondary/20 rounded-xl border border-border flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Timezone</p>
                      <p className="text-sm font-bold">{data.status?.timezone || 'UTC'} Engine Active</p>
                    </div>
                  </div>
                  <div className="p-4 bg-secondary/20 rounded-xl border border-border flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${data.source !== 'error' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Server Connection</p>
                      <p className="text-sm font-bold">{data.status?.server || 'Disconnected'}</p>
                    </div>
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
