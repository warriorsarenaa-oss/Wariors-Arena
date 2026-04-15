"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Users, 
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';

function toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function smoothLinePath(points: {x:number, y:number}[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return 'M ' + points[0].x + ' ' + points[0].y;
  }
  let d = 'M ' + points[0].x + ' ' + points[0].y;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ' C ' + cpx + ' ' + prev.y + 
         ' ' + cpx + ' ' + curr.y + 
         ' ' + curr.x + ' ' + curr.y;
  }
  return d;
}

export default function RevenueView() {
    const [from, setFrom] = useState(toLocalDateString(new Date()));
    const [to, setTo] = useState(toLocalDateString(new Date()));
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'today' | 'week' | 'month'>('today');
    const [tooltip, setTooltip] = useState<any>(null);

    const fetchRevenue = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/revenue?from=${from}&to=${to}`);
            const json = await res.json();
            setMetrics(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRevenue();
    }, [from, to]);

    const setPreset = (view: 'today' | 'week' | 'month') => {
        const today = new Date();
        let start = new Date();
        
        if (view === 'today') {
            start = today;
            setFrom(toLocalDateString(start));
            setTo(toLocalDateString(today));
        } else if (view === 'week') {
            start = new Date(today);
            start.setDate(today.getDate() - 6);
            setFrom(toLocalDateString(start));
            setTo(toLocalDateString(today));
        } else if (view === 'month') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            setFrom(toLocalDateString(start));
            setTo(toLocalDateString(today));
        }
        setActiveView(view);
    };

    const renderBarChart = (data: any[]) => {
        const width = 800;
        const height = 320;
        const padding = { top: 20, right: 20, bottom: 60, left: 70 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const maxRevenueRaw = Math.max(...data.map(d => d.revenue), 0);
        const maxRevenue = Math.ceil((maxRevenueRaw || 1800) / 500) * 500;

        const gridLines = [0, 0.25, 0.5, 0.75, 1];

        return (
            <div className="relative w-full overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] overflow-visible select-none">
                    {gridLines.map((v, i) => {
                        const y = padding.top + chartHeight - (v * chartHeight);
                        const val = v * maxRevenue;
                        return (
                            <g key={i}>
                                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1E1E2E" strokeWidth="1" strokeDasharray="4 4" />
                                <text x={padding.left - 10} y={y + 4} textAnchor="end" fill="#A0A0B8" className="text-[11px] font-bold">{val.toLocaleString()} EGP</text>
                            </g>
                        );
                    })}
                    {data.map((d, i) => {
                        const barTotalWidth = chartWidth / data.length;
                        const barWidth = barTotalWidth * 0.6;
                        const x = padding.left + i * barTotalWidth + (barTotalWidth - barWidth) / 2;
                        const barHeight = (d.revenue / maxRevenue) * chartHeight;
                        const y = padding.top + chartHeight - barHeight;

                        return (
                            <g 
                                key={i} 
                                className="cursor-pointer group"
                                onMouseEnter={() => setTooltip({ ...d, x: x + barWidth / 2, y })}
                                onMouseLeave={() => setTooltip(null)}
                            >
                                <rect x={padding.left + i * barTotalWidth} y={padding.top} width={barTotalWidth} height={chartHeight} fill="transparent" />
                                <rect x={x} y={y} width={barWidth} height={barHeight} fill={d.revenue > 0 ? '#00FFCC' : '#1E1E2E'} rx="4" className="transition-all duration-300" />
                                {d.revenue > 0 && <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fill="white" className="text-[11px] font-black">{d.revenue}</text>}
                                <text x={padding.left + i * barTotalWidth + barTotalWidth / 2} y={padding.top + chartHeight + 25} textAnchor="middle" fill="#A0A0B8" className="text-[11px] font-bold">{d.label}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    const renderLineChart = (data: any[], xKey: string) => {
        const width = 800;
        const height = 320;
        const padding = { top: 20, right: 20, bottom: 60, left: 70 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const maxRevenueRaw = Math.max(...data.map(d => d.revenue), 0);
        const maxRevenue = Math.ceil((maxRevenueRaw || 1800) / 500) * 500;

        const points = data.map((d, i) => {
            const x = padding.left + (i * (chartWidth / (data.length - 1)));
            const y = padding.top + chartHeight - (d.revenue / maxRevenue) * chartHeight;
            return { x, y, revenue: d.revenue, label: d[xKey] };
        });

        const pathD = smoothLinePath(points);
        const areaD = `${pathD} L ${points[points.length-1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

        const gridLines = [0, 0.25, 0.5, 0.75, 1];
        const hasData = data.some(d => d.revenue > 0);

        return (
            <div className="relative w-full">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                    {gridLines.map((v, i) => {
                        const y = padding.top + chartHeight - (v * chartHeight);
                        const val = v * maxRevenue;
                        return (
                            <g key={i}>
                                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1E1E2E" strokeWidth="1" strokeDasharray="4 4" />
                                <text x={padding.left - 10} y={y + 4} textAnchor="end" fill="#A0A0B8" className="text-[11px] font-bold">{val.toLocaleString()} EGP</text>
                            </g>
                        );
                    })}

                    <path d={areaD} fill="#00FFCC" fillOpacity="0.08" />
                    <path d={pathD} fill="none" stroke="#00FFCC" strokeWidth="2.5" strokeLinecap="round" />

                    {points.map((p, i) => (
                        <g key={i} className="cursor-pointer group"
                           onMouseEnter={() => setTooltip({ ...p, label: p.label, x: p.x, y: p.y })}
                           onMouseLeave={() => setTooltip(null)}
                        >
                            <circle cx={p.x} cy={p.y} r="4" fill="#00FFCC" stroke="#0A0A0F" strokeWidth="2" />
                            {(p.revenue > 0 || !hasData) && (
                                <text x={p.x} y={p.y - 16} textAnchor="middle" fill="white" className="text-[11px] font-bold">
                                    {p.revenue > 0 ? `${p.revenue} EGP` : ''}
                                </text>
                            )}
                            <text 
                                x={p.x} 
                                y={padding.top + chartHeight + 25} 
                                textAnchor="middle" 
                                fill="#A0A0B8" 
                                className="text-[11px] font-bold"
                            >
                                {p.label}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        );
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="bg-[#13131A] p-6 rounded-[12px] border border-[#1E1E2E] flex flex-wrap items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-[#A0A0B8] uppercase ml-1">START DATE</label>
                          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-[8px] px-4 py-2 text-xs font-bold text-white" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-[#A0A0B8] uppercase ml-1">END DATE</label>
                          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-[8px] px-4 py-2 text-xs font-bold text-white" />
                      </div>
                 </div>
                 <div className="flex gap-2">
                      <button type="button" onClick={() => setPreset('today')} className={`px-5 py-2.5 rounded-[8px] border font-bold uppercase tracking-widest text-xs transition-all ${activeView === 'today' ? 'bg-[#00FFCC] text-[#0A0A0F] border-[#00FFCC]' : 'border-[#1E1E2E] text-white hover:bg-white/5'}`}>Today</button>
                      <button type="button" onClick={() => setPreset('week')} className={`px-5 py-2.5 rounded-[8px] border font-bold uppercase tracking-widest text-xs transition-all ${activeView === 'week' ? 'bg-[#00FFCC] text-[#0A0A0F] border-[#00FFCC]' : 'border-[#1E1E2E] text-white hover:bg-white/5'}`}>Week</button>
                      <button type="button" onClick={() => setPreset('month')} className={`px-5 py-2.5 rounded-[8px] border font-bold uppercase tracking-widest text-xs transition-all ${activeView === 'month' ? 'bg-[#00FFCC] text-[#0A0A0F] border-[#00FFCC]' : 'border-[#1E1E2E] text-white hover:bg-white/5'}`}>Month</button>
                 </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20 text-[#00FFCC]"><Loader2 className="animate-spin" size={48} /></div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Revenue', value: `${metrics?.totalRevenue || 0} EGP`, icon: TrendingUp, color: 'text-[#00FFCC]' },
                            { label: 'Total Games', value: metrics?.totalGames || 0, icon: Users, color: 'text-white' },
                            { label: 'Laser Tag', value: metrics?.laserTagCount || 0, icon: Target, color: 'text-[#FF3B3B]' },
                            { label: 'Gel Blasters', value: metrics?.gelBlastersCount || 0, icon: Zap, color: 'text-yellow-400' }
                        ].map((m, i) => (
                            <div key={i} className="bg-[#13131A] p-8 rounded-[12px] border border-[#1E1E2E] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><m.icon size={56} /></div>
                                <p className="text-[10px] font-black uppercase text-[#A0A0B8] tracking-[0.2em] mb-2">{m.label}</p>
                                <h3 className={`text-3xl font-black tracking-tighter ${m.color}`}>{m.value}</h3>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#13131A] p-10 rounded-[12px] border border-[#1E1E2E]">
                         <header className="mb-14 flex justify-between items-center">
                              <div>
                                  <h4 className="text-sm font-black uppercase text-[#A0A0B8] tracking-widest">Revenue Trajectory</h4>
                                  <p className="text-[10px] text-[#00FFCC] font-bold uppercase mt-1">
                                      {activeView === 'today' ? 'Daily Session Performance' : 
                                       activeView === 'week' ? 'Past 7 Days Growth' : 'Monthly Accumulation'}
                                  </p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-[#00FFCC] animate-pulse" />
                                  <span className="text-[9px] font-black text-[#00FFCC] uppercase tracking-widest">Live Feed</span>
                              </div>
                         </header>
                         
                         <div className="w-full overflow-hidden">
                             {metrics?.chartData?.type === 'daily' && renderBarChart(metrics.chartData.data)}
                             {metrics?.chartData?.type === 'weekly' && renderLineChart(metrics.chartData.data, 'dayLabel')}
                             {metrics?.chartData?.type === 'monthly' && renderLineChart(metrics.chartData.data, 'weekLabel')}
                         </div>
                    </div>
                </>
            )}
        </div>
    );
}
