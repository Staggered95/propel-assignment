import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Activity, CheckCircle, Bot, Zap } from 'lucide-react';
import NetworkMap from './components/NetworkMap';
import SimulatorControls from './components/SimulatorControls';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get('/api/tickets');
        setTickets(res.data);
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      }
    };
    
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDispatchSummary = async (ticketId) => {
    setLoadingAi(true);
    setAiSummary(null);
    try {
      const res = await axios.get(`/api/tickets/${ticketId}/dispatch-summary`);
      setAiSummary(res.data);
    } catch (err) {
      console.error("Failed to generate AI summary", err);
    } finally {
      setLoadingAi(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    setErrorMsg('');
    try {
      await axios.patch(`/api/tickets/${ticketId}`, { status: newStatus });
      // Optimistically update UI
      setTickets(tickets.map(t => t.ticket_id === ticketId ? { ...t, status: newStatus } : t));
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMsg(err.response.data.error);
      } else {
        console.error("Failed to update status", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-300 p-4 font-sans flex flex-col gap-4">
      {/* Header */}
      <header className="flex items-center justify-between bg-stone-800 p-4 rounded-lg border border-stone-700 shadow-md">
        <div className="flex items-center gap-3">
          <Zap className="text-yellow-500" size={28} />
          <h1 className="text-xl font-bold text-stone-100">KSPDB Operator Console</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-400">
          <Activity size={16} className="text-green-500 animate-pulse" />
          System Live
        </div>
      </header>

      {/* Error Toast */}
      {errorMsg && (
        <div className="bg-red-900/90 text-red-100 p-3 rounded shadow-lg border border-red-700 flex justify-between items-center">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-300 hover:text-white px-2">✕</button>
        </div>
      )}

      {/* Split Pane Layout */}
      <div className="flex-1 flex gap-4 overflow-hidden h-[calc(100vh-120px)]">
        
        {/* Left Pane: The Map */}
        <div className="flex-1 bg-stone-800 rounded-lg border border-stone-700 relative overflow-hidden">
          <NetworkMap />
          <SimulatorControls/>
        </div>

        {/* Right Pane: Incident Queue */}
        <div className="w-[450px] flex flex-col gap-4 overflow-y-auto pr-2">
          {tickets.length === 0 ? (
            <div className="bg-stone-800 rounded-lg border border-stone-700 p-8 text-center text-stone-500">
              <CheckCircle className="mx-auto mb-3 text-green-600" size={32} />
              No active incidents detected.
            </div>
          ) : (
            tickets.map(ticket => (
              <div 
                key={ticket.ticket_id} 
                className={`bg-stone-800 rounded-lg border transition-colors cursor-pointer p-4 ${
                  selectedTicket === ticket.ticket_id ? 'border-yellow-600 bg-stone-800/80' : 'border-stone-700 hover:border-stone-500'
                }`}
                onClick={() => {
                  if (selectedTicket !== ticket.ticket_id) {
                    setSelectedTicket(ticket.ticket_id);
                    fetchDispatchSummary(ticket.ticket_id);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {ticket.status === 'VERIFIED' ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <AlertTriangle className="text-red-500" size={20} />
                    )}
                    <span className="font-bold text-stone-100">{ticket.fault_type} FAULT</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-mono ${
                    ticket.status === 'VERIFIED' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                
                <div className="text-sm space-y-1 mb-3">
                  <p><span className="text-stone-500">Target:</span> <span className="font-mono text-stone-300">{ticket.target_id}</span></p>
                  <p><span className="text-stone-500">Affected Poles:</span> {ticket.affected_count}</p>
                </div>

                {/* Expanded Details */}
                {selectedTicket === ticket.ticket_id && (
                  <div className="mt-4 pt-4 border-t border-stone-700">
                    
                    {/* Lifecycle Actions */}
                    <div className="flex gap-2 mb-4">
                      {ticket.status === 'DETECTED' && (
                        <button onClick={(e) => { e.stopPropagation(); updateTicketStatus(ticket.ticket_id, 'ACKNOWLEDGED'); }} className="flex-1 bg-stone-700 hover:bg-stone-600 py-1 rounded text-sm transition">Acknowledge</button>
                      )}
                      {ticket.status === 'ACKNOWLEDGED' && (
                        <button onClick={(e) => { e.stopPropagation(); updateTicketStatus(ticket.ticket_id, 'CREW_ASSIGNED'); }} className="flex-1 bg-yellow-700/50 hover:bg-yellow-600/50 text-yellow-200 py-1 rounded text-sm transition">Assign Crew</button>
                      )}
                      {ticket.status === 'CREW_ASSIGNED' && (
                        <button onClick={(e) => { e.stopPropagation(); updateTicketStatus(ticket.ticket_id, 'RESOLVED'); }} className="flex-1 bg-green-700/50 hover:bg-green-600/50 text-green-200 py-1 rounded text-sm transition">Mark Resolved</button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3 text-yellow-500">
                      <Bot size={18} />
                      <span className="text-sm font-semibold text-stone-300">Groq Dispatch Brief</span>
                    </div>
                    
                    {loadingAi ? (
                      <p className="text-sm text-stone-500 animate-pulse">Generating action plan...</p>
                    ) : aiSummary ? (
                      <div className="text-sm space-y-3 bg-stone-900 p-3 rounded border border-stone-700">
                        <p><span className="font-semibold text-stone-400">Priority:</span> {aiSummary.priority}</p>
                        <p><span className="font-semibold text-stone-400">Crew Size:</span> {aiSummary.recommended_crew_size}</p>
                        <div>
                          <span className="font-semibold text-stone-400">Action:</span>
                          <p className="mt-1 text-stone-300">{aiSummary.dispatch_summary}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}