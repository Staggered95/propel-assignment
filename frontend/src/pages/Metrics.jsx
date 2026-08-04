import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '../contexts/ToastProvider';

export default function Metrics() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ mapped: 0, unmapped: 0, totalAffected: 0 });
  
  const { addToast } = useToast();
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch BOTH tickets and raw network data simultaneously
        const [ticketsRes, networkRes] = await Promise.all([
          axios.get('/api/tickets'),
          axios.get('/api/network')
        ]);
        
        const active = ticketsRes.data;
        const allPoles = networkRes.data;
        
        let mapped = 0; 
        let unmapped = 0; 

        active.forEach(t => {
          if (t.fault_type === 'CLUSTER') {
            unmapped += 1;
          } else {
            mapped += 1;
          }
        });

        // FIX: Calculate true dark poles by looking at the raw sensor state, 
        // completely ignoring ticket overlaps.
        const trueDarkPoles = allPoles.filter(p => !p.is_live).length;

        setTickets(active);
        setStats({ mapped, unmapped, totalAffected: trueDarkPoles });
        hasAlertedRef.current = false;
      } catch (err) {
        if (!hasAlertedRef.current) {
          addToast("Failed to fetch metric data from backend.", "error");
          hasAlertedRef.current = true;
        }
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval);
  }, [addToast]);

  // Data for Recharts using our dynamic CSS variables
  const pieData = [
    { name: 'Mapped 40% (Span/Feeder)', value: stats.mapped, color: 'var(--stat-success)' },
    { name: 'Unmapped 60% (Clusters)', value: stats.unmapped, color: 'var(--stat-warning)' }
  ];

  const barData = [
    { name: 'SPAN', count: tickets.filter(t => t.fault_type === 'SPAN').length },
    { name: 'CLUSTER', count: tickets.filter(t => t.fault_type === 'CLUSTER').length },
    { name: 'DT', count: tickets.filter(t => t.fault_type === 'DT').length },
    { name: 'FEEDER', count: tickets.filter(t => t.fault_type === 'FEEDER').length }
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 h-[calc(100vh-100px)] overflow-y-auto no-scrollbar">
      
      <div className="flex justify-between items-end border-b border-border pb-4 transition-colors">
        <div>
          <h1 className="text-3xl font-bold text-text-primary transition-colors">Batch Processing Metrics</h1>
          <p className="text-text-muted transition-colors">Real-time analysis of the current grid state and algorithmic clustering.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-background-secondary border border-border px-4 py-2 rounded-lg text-center shadow-sm transition-colors">
            <span className="block text-xs text-text-muted uppercase font-bold mb-1">Active Incidents</span>
            <span className="text-xl font-mono text-error font-bold">{tickets.length}</span>
          </div>
          <div className="bg-background-secondary border border-border px-4 py-2 rounded-lg text-center shadow-sm transition-colors">
            <span className="block text-xs text-text-muted uppercase font-bold mb-1">Poles Dark</span>
            <span className="text-xl font-mono text-warning font-bold">{stats.totalAffected}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* The 40/60 Split Pie Chart */}
        <div className="bg-background-secondary border border-border rounded-lg p-6 shadow-lg transition-colors duration-300">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-success"/> Algorithm Routing (40/60 Split)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--bdr)', borderRadius: '8px', color: 'var(--txt-primary)' }}
                  itemStyle={{ color: 'var(--txt-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-sm text-text-secondary mt-4">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-success"></span> Mapped Resolution</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-warning"></span> Unmapped Fallback</div>
          </div>
        </div>

        {/* Fault Distribution Bar Chart */}
        <div className="bg-background-secondary border border-border rounded-lg p-6 shadow-lg transition-colors duration-300">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Activity size={18} className="text-info"/> Fault Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="var(--txt-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-hover)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--bdr)', borderRadius: '8px', color: 'var(--txt-primary)' }}
                />
                <Bar dataKey="count" fill="var(--stat-info)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}