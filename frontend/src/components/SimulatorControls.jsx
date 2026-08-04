import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Siren, ZapOff, Wrench, Send, BarChart2 } from 'lucide-react';
import { useToast } from '../contexts/ToastProvider';

export default function SimulatorControls() {
  const navigate = useNavigate();
  const { addToast } = useToast(); // Consume the toast context
  
  const [activeTab, setActiveTab] = useState('single');
  const [activeTickets, setActiveTickets] = useState([]);

  // Single Input States
  const [faultType, setFaultType] = useState('SPAN');
  const [faultTarget, setFaultTarget] = useState('');
  const [noiseTarget, setNoiseTarget] = useState('');
  const [repairTicketId, setRepairTicketId] = useState('');

  // Batch Input States
  const [batchAction, setBatchAction] = useState('fault'); // fault, noise, repair
  const [batchTargetType, setBatchTargetType] = useState('P'); // P, D, F
  const [batchNumbers, setBatchNumbers] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchActiveTickets = async () => {
      try {
        const res = await axios.get('/api/tickets');
        setActiveTickets(res.data.filter(t => t.status !== 'VERIFIED'));
      } catch (err) {}
    };
    fetchActiveTickets();
    const interval = setInterval(fetchActiveTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSingleAction = async (endpoint, payload) => {
    addToast('Executing command...', 'info', 2000);
    try {
      const res = await axios.post(`/api/${endpoint}`, payload);
      addToast(res.data.message || 'Transmission successful.', 'success');
      // If it was a repair, instantly clear the local input to show it worked
      if (endpoint === 'simulator/repair') setRepairTicketId('');
    } catch (err) {
      addToast(err.response?.data?.error || 'Command failed.', 'error');
    }
  };

  const handleBatchSubmit = async () => {
    setIsProcessing(true);
    addToast('Processing batch payload...', 'info');
    
    const rawNumbers = batchNumbers.split(',').map(n => n.trim()).filter(n => n);
    
    const formattedTargets = rawNumbers.map(num => {
      if (batchAction === 'repair') return num;
      
      let padLength = 6; 
      if (batchTargetType === 'D') padLength = 4; 
      if (batchTargetType === 'F') padLength = 3; 
      
      const paddedNum = String(num).padStart(padLength, '0');
      return `${batchTargetType}-${paddedNum}`;
    });

    try {
      const promises = formattedTargets.map(target => {
        if (batchAction === 'fault') return axios.post('/api/simulator/fault', { fault_type: batchTargetType === 'D' ? 'DT' : batchTargetType === 'F' ? 'FEEDER' : 'SPAN', target_id: target });
        if (batchAction === 'noise') return axios.post('/api/simulator/noise', { target_id: target });
        if (batchAction === 'repair') return axios.post('/api/simulator/repair', { ticket_id: target });
      });

      await Promise.allSettled(promises);
      
      addToast('Batch transmission initiated successfully.', 'success');
    } catch (error) {
      addToast('Batch execution encountered errors.', 'error');
    } finally {
      setIsProcessing(false);
      setBatchNumbers(''); // Reset input box
    }
  };

  return (
    <div className="h-full bg-background-primary border border-border rounded-lg flex flex-col overflow-hidden shadow-xl transition-colors duration-300">
      
      {/* Tab Switcher */}
      <div className="flex border-b border-border bg-background-secondary transition-colors duration-300">
        <button 
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'single' ? 'text-warning border-b-2 border-warning bg-background-primary' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setActiveTab('single')}
        >
          Targeted
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'batch' ? 'text-warning border-b-2 border-warning bg-background-primary' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setActiveTab('batch')}
        >
          Batch Ops
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-1 transition-colors">Simulator Uplink</h2>
          <p className="text-sm text-text-muted">Inject real-time telemetry artifacts into the grid.</p>
        </div>

        {activeTab === 'single' ? (
          /* --- SINGLE TARGET UI --- */
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-error font-semibold uppercase tracking-wider text-sm"><Siren size={16} /> Inject Fault</label>
              <div className="flex gap-2">
                <select className="bg-background-secondary border border-border rounded-lg p-3 text-text-primary w-1/3 outline-none focus:border-border-hover transition-colors" value={faultType} onChange={e => setFaultType(e.target.value)}>
                  <option value="SPAN">SPAN</option><option value="DT">DT</option><option value="FEEDER">FEEDER</option>
                </select>
                <input type="text" placeholder="Target ID (e.g., D-0002)" className="bg-background-secondary border border-border rounded-lg p-3 flex-1 text-text-primary outline-none focus:border-border-hover transition-colors" value={faultTarget} onChange={e => setFaultTarget(e.target.value)} />
              </div>
              <button onClick={() => handleSingleAction('simulator/fault', { fault_type: faultType, target_id: faultTarget })} className="w-full bg-error/10 hover:bg-error/20 text-error border border-error/30 p-3 rounded-lg transition-colors font-medium flex justify-center gap-2 shadow-sm"><Send size={16} /> Deploy</button>
            </div>
            
            <hr className="border-border transition-colors" />
            
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-success font-semibold uppercase tracking-wider text-sm"><Wrench size={16} /> Physical Resolution</label>
              <select className="w-full bg-background-secondary border border-border rounded-lg p-3 text-text-primary outline-none focus:border-border-hover transition-colors" value={repairTicketId} onChange={e => setRepairTicketId(e.target.value)}>
                <option value="" disabled>Select incident...</option>
                {activeTickets.map(t => <option key={t.ticket_id} value={t.ticket_id}>#{t.ticket_id} - {t.target_id}</option>)}
              </select>
              <button disabled={!repairTicketId} onClick={() => handleSingleAction('simulator/repair', { ticket_id: repairTicketId })} className="w-full disabled:opacity-50 disabled:cursor-not-allowed bg-success/10 hover:bg-success/20 text-success border border-success/30 p-3 rounded-lg transition-colors font-medium flex justify-center gap-2 shadow-sm"><Send size={16} /> Resolve</button>
            </div>

            <hr className="border-border transition-colors" />

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-text-muted font-semibold uppercase tracking-wider text-sm"><ZapOff size={16} /> Inject Noise</label>
              <input type="text" placeholder="Pole ID (e.g., P-000123)" className="w-full bg-background-secondary border border-border rounded-lg p-3 text-text-primary outline-none font-mono focus:border-border-hover transition-colors" value={noiseTarget} onChange={e => setNoiseTarget(e.target.value)} />
              <button onClick={() => handleSingleAction('simulator/noise', { target_id: noiseTarget })} className="w-full bg-background-secondary hover:bg-background-hover text-text-primary border border-border p-3 rounded-lg transition-colors font-medium flex justify-center gap-2 shadow-sm"><Send size={16} /> Dead Battery</button>
            </div>
          </div>
        ) : (
          /* --- BATCH OPS UI --- */
          <div className="space-y-6">
            <div className="bg-background-secondary p-4 rounded-lg border border-border text-sm text-text-secondary transition-colors">
              Enter raw numbers. The system will automatically format them based on the asset type. <br/>
              <span className="font-mono text-warning mt-1 inline-block">Ex: "1, 2" ➜ D-0001, D-0002 (or P-000001 for poles)</span>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-text-muted text-sm font-semibold uppercase">Action</label>
                <select className="w-full bg-background-secondary border border-border rounded-lg p-3 text-text-primary outline-none focus:border-border-hover transition-colors" value={batchAction} onChange={e => setBatchAction(e.target.value)}>
                  <option value="fault">Inject Fault</option>
                  <option value="noise">Inject Noise</option>
                  <option value="repair">Submit Repairs</option>
                </select>
              </div>
              
              {batchAction !== 'repair' && (
                <div className="flex-1 space-y-2">
                  <label className="text-text-muted text-sm font-semibold uppercase">Target Type</label>
                  <select className="w-full bg-background-secondary border border-border rounded-lg p-3 text-text-primary outline-none focus:border-border-hover transition-colors" value={batchTargetType} onChange={e => setBatchTargetType(e.target.value)}>
                    <option value="P">Pole (P-)</option>
                    <option value="D">Transformer (D-)</option>
                    <option value="F">Feeder (F-)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-text-muted text-sm font-semibold uppercase">Numeric Sequences</label>
              <textarea 
                className="w-full h-32 bg-background-secondary border border-border rounded-lg p-3 text-text-primary outline-none font-mono resize-none focus:border-border-hover transition-colors"
                placeholder="20, 21, 22, 95, 102..."
                value={batchNumbers}
                onChange={e => setBatchNumbers(e.target.value)}
              />
            </div>

            <button 
              disabled={isProcessing || !batchNumbers}
              onClick={handleBatchSubmit} 
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed bg-info/10 hover:bg-info/20 text-info border border-info/30 p-4 rounded-lg transition-colors font-bold flex justify-center items-center gap-2 uppercase tracking-wide shadow-sm"
            >
              {isProcessing ? 'Transmitting Array...' : <><BarChart2 size={18} /> Execute & View Metrics</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}