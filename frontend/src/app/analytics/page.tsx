'use client';

import React from 'react';
import Dashboard from '@/components/Dashboard';

// For simplicity, I'll just reuse the Dashboard or create a placeholder for analytics
export default function Analytics() {
  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-8">
      <div className="glass-card p-12 rounded-3xl text-center max-w-2xl animate-float">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
          Advanced Analytics
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Detailed Greeks breakdown, risk metrics, and strategy backtesting visualization coming soon.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 glass rounded-xl border border-primary/20">
            <p className="text-sm font-bold text-primary">Sharpe Ratio</p>
            <p className="text-2xl font-bold">2.4</p>
          </div>
          <div className="p-4 glass rounded-xl border border-emerald-500/20">
            <p className="text-sm font-bold text-emerald-500">Win Rate</p>
            <p className="text-2xl font-bold">78%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
