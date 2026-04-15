"use client";

import React, { useState, useEffect } from 'react';
import { Save, Loader2, DollarSign, CheckCircle2 } from 'lucide-react';

export default function SettingsView() {
    const [pricings, setPricings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);

    const fetchPricing = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/pricing');
            const data = await res.json();
            setPricings(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('[Settings] Retrieval failed:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPricing();
    }, []);

    const handlePriceChange = (id: string, val: string) => {
        const num = val === '' ? 0 : parseInt(val, 10);
        setPricings(prev => prev.map(p => p.id === id ? { ...p, price_per_player: num } : p));
    };

    const handleSave = async (id: string) => {
        const item = pricings.find(p => p.id === id);
        if (!item) return;

        const priceNum = item.price_per_player;
        if (isNaN(priceNum) || priceNum <= 0) {
            alert('Please enter a valid positive number');
            return;
        }

        setSavingId(id);
        try {
            const res = await fetch(`/api/admin/pricing/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price_per_player: priceNum }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert('Failed to save: ' + (data.error || 'Server error'));
                return;
            }

            // Update local state immediately
            setPricings(prev => prev.map(p =>
                p.id === id
                    ? { ...p, price_per_player: priceNum }
                    : p
            ));

            setSuccessId(id);
            setTimeout(() => setSuccessId(null), 3000);

        } catch (err) {
            console.error('[Settings] Update failed:', err);
            alert('Network error. Please try again.');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="max-w-4xl pb-20">
            <section className="bg-[#13131A] rounded-[12px] border border-[#1E1E2E] overflow-hidden">
                <header className="p-10 border-b border-[#1E1E2E] bg-[#0A0A0F]/50 flex justify-between items-center">
                    <div>
                        <h4 className="text-xl font-black text-[#00FFCC] uppercase tracking-tighter">Economic Matrix</h4>
                        <p className="text-[10px] text-[#A0A0B8] font-bold uppercase tracking-widest mt-1">Status: Operational Awareness</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#00FFCC] animate-pulse" />
                        <span className="text-[9px] font-black text-[#00FFCC] uppercase">Live Pricing</span>
                    </div>
                </header>

                <div className="p-8">
                    {loading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-[#00FFCC] mx-auto" size={32} /></div> : (
                        <div className="space-y-4">
                            {pricings.map((p, i) => (
                                <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-[#0A0A0F]/30 rounded-[12px] border border-[#1E1E2E] gap-6 group hover:border-[#00FFCC]/20 transition-all">
                                     <div className="flex items-center gap-6">
                                          <div className={`w-14 h-14 rounded-[8px] flex items-center justify-center shadow-lg ${p.gameName.includes('Laser') ? 'bg-[#FF3B3B]/10 text-[#FF3B3B]' : 'bg-yellow-400/10 text-yellow-400'}`}>
                                              <DollarSign size={24} />
                                          </div>
                                          <div>
                                              <p className="text-[10px] font-black uppercase text-[#A0A0B8] tracking-widest mb-1">{p.gameName}</p>
                                              <p className="font-black text-lg tracking-tight uppercase">{p.duration_minutes} Minute Session</p>
                                          </div>
                                     </div>

                                     <div className="flex items-center gap-4">
                                          <div className="relative">
                                               <input 
                                                type="number" 
                                                min="0"
                                                value={p.price_per_player} 
                                                onChange={e => handlePriceChange(p.id, e.target.value)}
                                                className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-[8px] p-4 text-center font-black text-2xl w-36 focus:border-[#00FFCC] transition-all outline-none"
                                               />
                                               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#A0A0B8] pointer-events-none opacity-40">EGP</span>
                                          </div>
                                          <button 
                                            onClick={() => handleSave(p.id)}
                                            disabled={savingId === p.id}
                                            className={`p-5 rounded-[8px] transition-all flex items-center justify-center ${
                                                successId === p.id ? 'bg-green-500 text-white' : 'bg-[#00FFCC] text-[#0A0A0F] hover:scale-[1.05] active:scale-95'
                                            } disabled:opacity-50`}
                                          >
                                               {savingId === p.id ? <Loader2 size={24} className="animate-spin" /> : 
                                                successId === p.id ? <CheckCircle2 size={24} /> : <Save size={24} />}
                                          </button>
                                     </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-[#0A0A0F]/50 p-6 border-t border-[#1E1E2E]">
                     <p className="text-[9px] text-[#A0A0B8] font-bold uppercase tracking-widest text-center leading-relaxed">
                         Note: Internal price modifiers affect all future mission deployments. Existing confirmed reservations maintain their captured revenue at time of booking.
                     </p>
                </div>
            </section>
        </div>
    );
}
