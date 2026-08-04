import { useState } from 'react';
import axios from 'axios';
import { Siren, ZapOff, Wrench, CalendarClock, Send } from 'lucide-react';

export default function SimulatorControls() {
  const [faultType, setFaultType] = useState('SPAN');
  const [faultTarget, setFaultTarget] = useState('');
  const [noiseTarget, setNoiseTarget] = useState('');
  const [repairTicketId, setRepairTicketId] = useState('');
  const [outageTarget, setOutageTarget] = useState('');
  
  const [statusMsg, setStatusMsg] = useState('');

  const handleAction = async (endpoint, payload) => {
    setStatusMsg('Sending...');
    try {
      const res = await axios.post(`/api/${endpoint}`, payload);
      setStatusMsg(res.data.message || 'Success!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg(err.response?.data?.error || 'Action failed');
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-[400] w-80 bg-stone-900/95 border border-stone-700 rounded-lg shadow-2xl backdrop-blur text-sm flex flex-col font-sans">
      <div className="bg-stone-800 p-2 border-b border-stone-700 rounded-t-lg flex justify-between items-center">
        <strong className="text-stone-300">Simulator Uplink</strong>
        <span className="text-xs text-yellow-500 font-mono truncate max-w-[120px]">{statusMsg}</span>
      </div>

      <div className="p-3 space-y-4">
        {/* Inject Fault */}
        <div>
          <div className="flex items-center gap-2 mb-1 text-red-400 font-semibold">
            <Siren size={14} /> <span>Inject Fault</span>
          </div>
          <div className="flex gap-2">
            <select 
              className="bg-stone-800 border border-stone-700 rounded p-1 text-stone-300 w-1/3 outline-none"
              value={faultType} 
              onChange={e => setFaultType(e.target.value)}
            >
              <option value="SPAN">SPAN</option>
              <option value="DT">DT</option>
              <option value="FEEDER">FEEDER</option>
            </select>
            <input 
              type="text" 
              placeholder="Target ID (e.g., D-0002)" 
              className="bg-stone-800 border border-stone-700 rounded p-1 flex-1 text-stone-300 outline-none"
              value={faultTarget} 
              onChange={e => setFaultTarget(e.target.value)} 
            />
            <button 
              onClick={() => handleAction('simulator/fault', { fault_type: faultType, target_id: faultTarget })}
              className="bg-red-900/50 hover:bg-red-800 text-red-200 p-1.5 rounded transition"
            >
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Inject Noise (Dead Sensor) */}
        <div>
          <div className="flex items-center gap-2 mb-1 text-stone-400 font-semibold">
            <ZapOff size={14} /> <span>Inject Noise (Dead Sensor)</span>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Pole ID (e.g., P-000123)" 
              className="bg-stone-800 border border-stone-700 rounded p-1 flex-1 text-stone-300 outline-none"
              value={noiseTarget} 
              onChange={e => setNoiseTarget(e.target.value)} 
            />
            <button 
              onClick={() => handleAction('simulator/noise', { target_id: noiseTarget })}
              className="bg-stone-700 hover:bg-stone-600 text-stone-200 p-1.5 rounded transition"
            >
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Schedule Outage */}
        <div>
          <div className="flex items-center gap-2 mb-1 text-blue-400 font-semibold">
            <CalendarClock size={14} /> <span>Schedule Outage (60m)</span>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="DT ID (e.g., D-0005)" 
              className="bg-stone-800 border border-stone-700 rounded p-1 flex-1 text-stone-300 outline-none"
              value={outageTarget} 
              onChange={e => setOutageTarget(e.target.value)} 
            />
            <button 
              onClick={() => handleAction('outages', { dt_id: outageTarget, duration_minutes: 60 })}
              className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 p-1.5 rounded transition"
            >
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Physical Repair */}
        <div>
          <div className="flex items-center gap-2 mb-1 text-green-400 font-semibold">
            <Wrench size={14} /> <span>Simulate Physical Repair</span>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Ticket ID to fix (e.g., 1)" 
              className="bg-stone-800 border border-stone-700 rounded p-1 flex-1 text-stone-300 outline-none"
              value={repairTicketId} 
              onChange={e => setRepairTicketId(e.target.value)} 
            />
            <button 
              onClick={() => handleAction('simulator/repair', { ticket_id: repairTicketId })}
              className="bg-green-900/50 hover:bg-green-800 text-green-200 p-1.5 rounded transition"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}