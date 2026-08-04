import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useToast } from '../contexts/ToastProvider';

export default function Faults() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const { addToast } = useToast();

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
      addToast("Failed to connect to Groq AI engine.", "error");
    } finally {
      setLoadingAi(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await axios.patch(`/api/tickets/${ticketId}`, { status: newStatus });
      // Optimistically update UI
      setTickets(tickets.map(t => t.ticket_id === ticketId ? { ...t, status: newStatus } : t));
      addToast(`Incident #${ticketId} status updated to ${newStatus}.`, 'success');
    } catch (err) {
      if (err.response?.status === 409) {
        // This handles the physical verification block (e.g. poles are still dark)
        addToast(err.response.data.error, 'warning', 5000);
      } else {
        addToast("Failed to update ticket status.", 'error');
      }
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto pr-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary transition-colors">Active Incident Queue</h2>
        <p className="text-text-muted transition-colors">Manage detected faults and generate dispatch briefs.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {tickets.length === 0 ? (
          <div className="col-span-full bg-background-secondary rounded-lg border border-border p-8 text-center text-text-muted shadow-sm transition-colors duration-300">
            <CheckCircle className="mx-auto mb-3 text-success" size={32} />
            No active incidents detected.
          </div>
        ) : (
          tickets.map(ticket => (
            <div 
              key={ticket.ticket_id} 
              className={`bg-background-secondary rounded-lg border transition-colors duration-300 cursor-pointer p-5 flex flex-col shadow-sm ${
                selectedTicket === ticket.ticket_id ? 'border-warning bg-background-active' : 'border-border hover:border-border-hover'
              }`}
              onClick={() => {
                if (selectedTicket !== ticket.ticket_id) {
                  setSelectedTicket(ticket.ticket_id);
                  if (ticket.status !== 'VERIFIED') {
                    fetchDispatchSummary(ticket.ticket_id);
                  } else {
                    setAiSummary(null);
                  }
                }
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {ticket.status === 'VERIFIED' ? (
                    <CheckCircle className="text-success" size={20} />
                  ) : (
                    <AlertTriangle className="text-error" size={20} />
                  )}
                  <span className="font-bold text-text-primary text-lg">
                    #{ticket.ticket_id} - {ticket.fault_type}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-mono border ${
                  ticket.status === 'VERIFIED' ? 'bg-success/10 text-success border-success/30' : 'bg-error/10 text-error border-error/30'
                }`}>
                  {ticket.status}
                </span>
              </div>
              
              <div className="text-sm space-y-2 mb-4 flex-1">
                <p className="flex justify-between">
                  <span className="text-text-secondary">Target Asset:</span> 
                  <span className="font-mono text-text-primary bg-background-primary px-2 py-0.5 rounded border border-border">{ticket.target_id}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-text-secondary">Downstream Impact:</span> 
                  <span className="text-text-primary font-medium">{ticket.affected_count} poles</span>
                </p>
              </div>

              {/* Expanded Details */}
              {selectedTicket === ticket.ticket_id && (
                <div className="mt-auto pt-4 border-t border-border">
                  
                  {/* Lifecycle Actions */}
                  {ticket.status !== 'VERIFIED' && (
                    <div className="flex gap-2 mb-4">
                      {ticket.status === 'DETECTED' && (
                        <button onClick={(e) => { e.stopPropagation(); updateTicketStatus(ticket.ticket_id, 'ACKNOWLEDGED'); }} className="flex-1 bg-background-primary hover:bg-background-hover border border-border py-2 rounded text-sm transition-colors font-medium text-text-primary shadow-sm">Acknowledge</button>
                      )}
                      {ticket.status === 'ACKNOWLEDGED' && (
                        <button onClick={(e) => { e.stopPropagation(); updateTicketStatus(ticket.ticket_id, 'CREW_ASSIGNED'); }} className="flex-1 bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30 py-2 rounded text-sm transition-colors font-medium shadow-sm">Assign Crew</button>
                      )}
                      {ticket.status === 'CREW_ASSIGNED' && (
                        <button onClick={(e) => { e.stopPropagation(); updateTicketStatus(ticket.ticket_id, 'RESOLVED'); }} className="flex-1 bg-success/10 hover:bg-success/20 text-success border border-success/30 py-2 rounded text-sm transition-colors font-medium shadow-sm">Mark Resolved</button>
                      )}
                    </div>
                  )}

                  {/* AI Section */}
                  {ticket.status !== 'VERIFIED' ? (
                    <>
                      <div className="flex items-center gap-2 mb-3 text-warning">
                        <span className="text-sm font-semibold text-text-primary flex items-center gap-2">
                          <Zap size={16} className="text-warning"/> AI Dispatch Brief
                        </span>
                      </div>
                      
                      {loadingAi ? (
                        <p className="text-sm text-text-muted animate-pulse bg-background-primary border border-border p-3 rounded">Synthesizing telemetry data...</p>
                      ) : aiSummary ? (
                        <div className="text-sm space-y-3 bg-background-primary p-3 rounded border border-border shadow-inner transition-colors">
                          <p className="flex justify-between border-b border-border pb-1"><span className="font-semibold text-text-secondary">Priority:</span> <span className="text-text-primary">{aiSummary.priority}</span></p>
                          <p className="flex justify-between border-b border-border pb-1"><span className="font-semibold text-text-secondary">Crew Size:</span> <span className="text-text-primary">{aiSummary.recommended_crew_size}</span></p>
                          <div className="pt-1">
                            <span className="font-semibold text-text-secondary block mb-1">Recommended Action:</span>
                            <p className="text-text-primary leading-relaxed">{aiSummary.dispatch_summary}</p>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="text-center p-3 bg-success/10 border border-success/30 rounded text-success text-sm flex flex-col items-center gap-1 shadow-sm">
                       <CheckCircle size={18} />
                       Incident physically resolved and verified by telemetry.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}