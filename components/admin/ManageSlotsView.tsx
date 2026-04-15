"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Info,
  Loader2,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';

function toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ManageSlotsView() {
    const [targetType, setTargetType] = useState<'default' | 'day' | 'date'>('default');
    const [targetDay, setTargetDay] = useState(1); // Mon
    const [targetDate, setTargetDate] = useState(toLocalDateString(new Date()));
    const [slots, setSlots] = useState<string[]>([]);
    const [defaultSlotsCount, setDefaultSlotsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // New slot builder
    const [newHour, setNewHour] = useState('12');
    const [newMinute, setNewMinute] = useState('00');
    const [newPeriod, setNewPeriod] = useState('PM');

    // Block manager
    const [blockStartTime, setBlockStartTime] = useState('');
    const [blockEndTime, setBlockEndTime] = useState('');
    const [blockReason, setBlockReason] = useState('');
    const [currentBlocks, setCurrentBlocks] = useState<any[]>([]);

    async function loadSlotsForTarget(
        target: 'default' | 'day' | 'date',
        dayOfWeek?: number,
        specificDate?: string
    ) {
        setLoading(true);
        try {
            let params = '';
            if (target === 'day') params = `?dayOfWeek=${dayOfWeek}`;
            else if (target === 'date') params = `?specificDate=${specificDate}`;

            const res = await fetch(`/api/admin/config/hours${params}`);
            const data = await res.json();
            
            setSlots(data.slots || []);
            setDefaultSlotsCount(data.defaultSlots?.length || 0);

            if (target === 'date') {
                 const blocksRes = await fetch(`/api/admin/blocks?date=${specificDate}`);
                 const blocksData = await blocksRes.json();
                 setCurrentBlocks(Array.isArray(blocksData.blocks) ? blocksData.blocks : []);
            }
        } catch (e) {
            console.error('[SlotsConfig] Protocol failed:', e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSlotsForTarget(targetType, targetDay, targetDate);
    }, [targetType, targetDay, targetDate]);

    const handleAddSlot = () => {
        let h = parseInt(newHour);
        if (newPeriod === 'PM' && h < 12) h += 12;
        if (newPeriod === 'AM' && h === 12) h = 0;
        const timeStr = `${String(h).padStart(2, '0')}:${newMinute}`;
        if (!slots.includes(timeStr)) setSlots([...slots, timeStr].sort());
    };

    const handleRemoveSlot = (s: string) => {
        setSlots(slots.filter(item => item !== s));
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/config/hours', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target: targetType,
                    dayOfWeek: targetType === 'day' ? targetDay : null,
                    specificDate: targetType === 'date' ? targetDate : null,
                    slots
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setSlots(data.slots);
                    
                    // Logic to calculate feedback
                    const customCount = slots.length - defaultSlotsCount;
                    const dayName = targetType === 'day' ? DAY_NAMES[targetDay] : targetDate;
                    
                    let msg = 'Configuration Saved';
                    if (targetType !== 'default') {
                        msg = `${dayName} schedule saved: ${slots.length} slots configured (includes ${defaultSlotsCount} from default + ${customCount > 0 ? customCount : 0} custom)`;
                    }

                    setSaveMessage(msg);
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 5000);
                }
            } else {
                alert('Intelligence Failure: Parameters not accepted by server.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleAddBlock = async () => {
        if (!blockStartTime || !blockEndTime) return;
        await fetch('/api/admin/blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                block_date: targetDate,
                slot_time: blockStartTime,
                slot_end_time: blockEndTime,
                reason: blockReason
            })
        });
        setBlockStartTime('');
        setBlockEndTime('');
        setBlockReason('');
        loadSlotsForTarget(targetType, targetDay, targetDate);
    };

    const handleRemoveBlock = async (id: string) => {
        await fetch(`/api/admin/blocks/${id}`, { method: 'DELETE' });
        loadSlotsForTarget(targetType, targetDay, targetDate);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
            <div className="bg-[#13131A] p-8 rounded-[12px] border border-[#1E1E2E]">
                 <header className="mb-8 border-b border-[#1E1E2E] pb-6 flex justify-between items-center">
                      <h4 className="text-lg font-black text-[#00FFCC] uppercase tracking-tighter">Working Hours</h4>
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#00FFCC] animate-pulse" />
                          <span className="text-[9px] font-black text-[#00FFCC] uppercase">Matrix Configuration</span>
                      </div>
                 </header>

                 <div className="flex gap-2 mb-8">
                      {['default', 'day', 'date'].map((type: any) => (
                          <button 
                            key={type}
                            type="button"
                            onClick={() => setTargetType(type)}
                            className={`flex-1 py-3 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all ${targetType === type ? 'bg-[#00FFCC] text-[#0A0A0F]' : 'bg-[#0A0A0F] text-[#A0A0B8] border border-[#1E1E2E] hover:bg-white/5'}`}
                          >
                            {type}
                          </button>
                      ))}
                 </div>

                 <div className="mb-8">
                      {targetType === 'day' && (
                          <select value={targetDay} onChange={e => setTargetDay(Number(e.target.value))} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-[8px] p-4 text-xs font-bold focus:border-[#00FFCC] transition-colors">
                               {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                          </select>
                      )}
                      {targetType === 'date' && <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-[8px] p-4 text-xs font-bold focus:border-[#00FFCC] transition-colors" />}
                 </div>

                 {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin text-[#00FFCC] mx-auto" /></div> : (
                     <div className="space-y-10">
                          <div className="flex flex-wrap gap-2">
                               {slots.length === 0 && <p className="text-[#A0A0B8] text-[10px] font-bold italic w-full text-center py-4">No slots defined in current vector.</p>}
                               {slots.map((s, i) => (
                                   <div key={i} className="bg-white/5 border border-[#1E1E2E] px-4 py-2 rounded-[8px] flex items-center gap-3 group hover:border-[#FF3B3B]/50 transition-all">
                                       <span className="text-xs font-black tracking-widest">{s}</span>
                                       <button type="button" onClick={() => handleRemoveSlot(s)} className="text-[#A0A0B8] hover:text-[#FF3B3B] transition-colors"><X size={12} /></button>
                                   </div>
                               ))}
                          </div>

                          <div className="bg-[#0A0A0F] p-6 rounded-[12px] border border-[#1E1E2E]">
                               <p className="text-[10px] font-black uppercase text-[#A0A0B8] mb-4">Manual Slot Entry</p>
                               <div className="flex items-center gap-2">
                                    <div className="flex flex-1 gap-2">
                                         <select value={newHour} onChange={e => setNewHour(e.target.value)} className="flex-1 bg-white/5 border border-[#1E1E2E] p-2 rounded-[8px] text-xs font-bold focus:border-[#00FFCC]">
                                             {Array.from({length:12}, (_,i)=>String(i+1).padStart(2,'0')).map(h=><option key={h} value={h}>{h}</option>)}
                                         </select>
                                         <select value={newMinute} onChange={e => setNewMinute(e.target.value)} className="flex-1 bg-white/5 border border-[#1E1E2E] p-2 rounded-[8px] text-xs font-bold focus:border-[#00FFCC]">
                                             {['00','15','30','45'].map(m=><option key={m} value={m}>{m}</option>)}
                                         </select>
                                         <select value={newPeriod} onChange={e => setNewPeriod(e.target.value)} className="flex-1 bg-white/5 border border-[#1E1E2E] p-2 rounded-[8px] text-xs font-bold focus:border-[#00FFCC]">
                                             {['AM','PM'].map(p=><option key={p} value={p}>{p}</option>)}
                                         </select>
                                    </div>
                                    <button type="button" onClick={handleAddSlot} className="bg-[#00FFCC] text-[#0A0A0F] p-2.5 rounded-[8px] hover:scale-105 active:scale-95 transition-all"><Plus size={20} /></button>
                               </div>
                          </div>

                          <div className="space-y-4">
                            <button 
                                type="button"
                                onClick={handleSaveConfig} 
                                disabled={saving} 
                                className={`w-full py-4 rounded-[8px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${saveSuccess ? 'bg-green-500 text-white' : 'bg-[#00FFCC] text-[#0A0A0F] hover:scale-105'} disabled:opacity-50`}
                            >
                                {saving ? <Loader2 className="animate-spin" size={16} /> : 
                                    saveSuccess ? <><CheckCircle2 size={16} /> Configuration Saved</> : 
                                    <><Save size={16} /> Deploy Configuration</>}
                            </button>
                            {saveSuccess && saveMessage && (
                                <p className="text-[10px] text-green-500 font-bold text-center uppercase tracking-tight">{saveMessage}</p>
                            )}
                          </div>
                     </div>
                 )}
            </div>

            <div className="bg-[#13131A] p-8 rounded-[12px] border border-[#1E1E2E]">
                 <header className="mb-8 border-b border-[#1E1E2E] pb-6 flex justify-between items-center">
                      <h4 className="text-lg font-black text-[#FF3B3B] uppercase tracking-tighter">Dead Zone Management</h4>
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#FF3B3B] animate-pulse" />
                          <span className="text-[9px] font-black text-[#FF3B3B] uppercase">Manual Overrides</span>
                      </div>
                 </header>

                 {targetType !== 'date' ? (
                     <div className="p-14 text-center border-2 border-dashed border-[#1E1E2E] rounded-[12px] flex flex-col items-center gap-4 opacity-40">
                          <Info className="text-[#A0A0B8]" size={32} />
                          <p className="text-[10px] font-bold text-[#A0A0B8] uppercase leading-relaxed max-w-[200px]">Switch to "DATE" mode to enable temporal dead zones.</p>
                     </div>
                 ) : (
                     <div className="space-y-8">
                          <div className="space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                         <label className="text-[9px] font-black uppercase text-[#A0A0B8] ml-1">INBOUND</label>
                                         <input type="time" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] p-3 rounded-[8px] text-xs font-bold focus:border-[#FF3B3B] transition-colors" />
                                    </div>
                                    <div className="space-y-1">
                                         <label className="text-[9px] font-black uppercase text-[#A0A0B8] ml-1">OUTBOUND</label>
                                         <input type="time" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] p-3 rounded-[8px] text-xs font-bold focus:border-[#FF3B3B] transition-colors" />
                                    </div>
                               </div>
                               <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-[#A0A0B8] ml-1">RATIONALE</label>
                                    <input type="text" placeholder="Intelligence briefing / Maintenance reason" value={blockReason} onChange={e => setBlockReason(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] p-3 rounded-[8px] text-xs font-bold focus:border-[#FF3B3B] transition-colors" />
                                </div>
                               <button type="button" onClick={handleAddBlock} className="w-full bg-[#FF3B3B] text-white py-4 rounded-[8px] font-black uppercase tracking-widest text-xs hover:bg-[#FF3B3B]/90 transition-all shadow-[0_0_10px_rgba(255,59,59,0.2)]">Execute Temporal Lockdown</button>
                          </div>

                          <div className="space-y-3">
                               <p className="text-[10px] font-black uppercase text-[#A0A0B8] tracking-[0.2em] mb-4">Active Locks: {targetDate}</p>
                               {currentBlocks.map((b, i) => (
                                   <div key={i} className="bg-[#0A0A0F] border border-[#FF3B3B]/20 p-4 rounded-[12px] flex justify-between items-center group hover:border-[#FF3B3B]/50 transition-all">
                                        <div>
                                            <p className="font-black text-sm tracking-tighter">{b.slot_time.substring(0, 5)} - {b.slot_end_time.substring(0, 5)}</p>
                                            <p className="text-[9px] text-[#A0A0B8] uppercase mt-1 font-bold">{b.reason || 'Routine security sweep.'}</p>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveBlock(b.id)} className="p-2 text-[#A0A0B8] hover:text-[#FF3B3B] transition-colors"><Trash2 size={18} /></button>
                                   </div>
                               ))}
                               {currentBlocks.length === 0 && <p className="text-[10px] italic text-[#A0A0B8] text-center py-6 uppercase font-black opacity-20">No active dead zones detected.</p>}
                          </div>
                     </div>
                 )}
            </div>
        </div>
    );
}
