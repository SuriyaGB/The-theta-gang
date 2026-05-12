'use client';

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
import { 
  portfolioSummary, 
  performanceData, 
  activePositions, 
  tradeHistory 
} from '@/lib/mockData';

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-border p-6 flex flex-col gap-8 hidden lg:flex">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center glow-blue">
            <TrendingUp className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">THETAGANG</span>
        </div>

        <nav className="flex flex-col gap-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active href="/" />
          <NavItem icon={<Briefcase size={20} />} label="Portfolio" href="/portfolio" />
          <NavItem icon={<History size={20} />} label="History" href="/history" />
          <NavItem icon={<PieChartIcon size={20} />} label="Analytics" href="/analytics" />
          <NavItem icon={<Settings size={20} />} label="Settings" href="/settings" />
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-500 p-0.5">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-8 h-8" />
              </div>
            </div>
          </div>
        </header>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Value" 
            value={`$${portfolioSummary.totalValue.toLocaleString()}`} 
            change={`+${portfolioSummary.change24h}%`}
            trend="up"
            icon={<DollarSign size={20} className="text-emerald-500" />}
          />
          <StatCard 
            title="Net Theta" 
            value={`$${portfolioSummary.netTheta.toLocaleString()}/day`} 
            change="Stable"
            trend="up"
            icon={<Activity size={20} className="text-primary" />}
          />
          <StatCard 
            title="Available Cash" 
            value={`$${portfolioSummary.availableCash.toLocaleString()}`} 
            change="19.1% Margin"
            trend="neutral"
            icon={<Briefcase size={20} className="text-amber-500" />}
          />
          <StatCard 
            title="Delta Exposure" 
            value={portfolioSummary.deltaExposure.toString()} 
            change="-0.05"
            trend="down"
            icon={<TrendingUp size={20} className="text-rose-500" />}
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Performance Chart */}
          <div className="xl:col-span-2 glass-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Portfolio Performance</h2>
              <div className="flex gap-2">
                {['1D', '1W', '1M', '1Y', 'ALL'].map((range) => (
                  <button key={range} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${range === '1M' ? 'bg-primary text-white' : 'hover:bg-accent'}`}>
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade History */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <button className="text-primary text-sm font-medium flex items-center hover:underline">
                View all <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {tradeHistory.map((trade) => (
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
          </div>

          {/* Active Positions Table */}
          <div className="xl:col-span-3 glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">Active Positions</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-3 h-3 bg-primary rounded-full" /> Short Call
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" /> Short Put
                </div>
              </div>
            </div>
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
                  {activePositions.map((pos) => (
                    <tr key={pos.id} className="hover:bg-accent/30 transition-colors group">
                      <td className="px-6 py-4 font-medium">{pos.symbol}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${pos.type.includes('Call') ? 'bg-primary/20 text-primary' : 'bg-emerald-500/20 text-emerald-500'}`}>
                          {pos.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{pos.quantity}</td>
                      <td className="px-6 py-4 text-right font-mono">${pos.entryPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-mono">${pos.marketPrice.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-right font-bold ${pos.pnl >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                        +${pos.pnl.toLocaleString()}
                        <span className="text-[10px] ml-1 opacity-70">({pos.pnlPercent}%)</span>
                      </td>
                      <td className="px-6 py-4 text-right text-primary font-mono">${pos.theta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, href = "#" }: { icon: React.ReactNode, label: string, active?: boolean, href?: string }) => (
  <Link href={href} className="block">
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-primary text-white glow-blue' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  </Link>
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
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
        trend === 'up' ? 'bg-emerald-500/20 text-emerald-500' : 
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
