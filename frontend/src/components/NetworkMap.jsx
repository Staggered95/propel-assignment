import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeProvider';
import { useToast } from '../contexts/ToastProvider';

export default function NetworkMap() {
  const [poles, setPoles] = useState([]);
  const [activeTickets, setActiveTickets] = useState([]);
  
  // Consume Contexts
  const { theme } = useTheme();
  const { addToast } = useToast();
  
  // Use a ref to prevent spamming the error toast every 10 seconds
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [networkRes, ticketsRes] = await Promise.all([
          axios.get('/api/network'),
          axios.get('/api/tickets')
        ]);
        setPoles(networkRes.data);
        setActiveTickets(ticketsRes.data.filter(t => t.status !== 'VERIFIED'));
        
        // Reset the alert lock if the fetch succeeds
        hasAlertedRef.current = false; 
      } catch (err) {
        console.error("Failed to fetch map data", err);
        if (!hasAlertedRef.current) {
          addToast('Failed to sync telemetry data. Retrying in background...', 'error');
          hasAlertedRef.current = true;
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval);
  }, [addToast]);

  const center = [12.9716, 77.5946];

  // Dynamically assign exact hex codes based on the active theme
  const getNodeStyle = (pole) => {
    const isDark = theme === 'dark';
    
    // Everforest specific hex mappings
    const colors = {
      live: isDark ? '#a7c080' : '#8da101',
      dead: isDark ? '#e67e80' : '#f85552',
      unmonitored: isDark ? '#859289' : '#939f91'
    };

    if (!pole.is_live) return { fillColor: colors.dead, radius: 5, opacity: 0.9 };
    if (!pole.device_id) return { fillColor: colors.unmonitored, radius: 3, opacity: 0.4 };
    return { fillColor: colors.live, radius: 4, opacity: 0.6 };
  };

  // Switch map tile base layer
  const mapUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <MapContainer center={center} zoom={14} className="w-full h-full rounded-lg z-0 transition-colors duration-300">
      <TileLayer
        key={theme} // Forces Leaflet to re-render the tiles instantly when theme changes
        url={mapUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {poles.map((pole) => {
        const { fillColor, radius, opacity } = getNodeStyle(pole);
        
        const relatedTicket = !pole.is_live 
          ? activeTickets.find(t => t.dt_id === pole.dt_id) 
          : null;

        return (
          <CircleMarker
            key={pole.pole_id}
            center={[pole.lat, pole.lon]}
            radius={radius}
            fillColor={fillColor}
            color={fillColor}
            weight={1}
            fillOpacity={opacity}
          >
            {/* Themed Popup */}
            <Popup className="bg-background-secondary text-text-primary border-border min-w-[200px] shadow-xl">
              <div className="font-sans">
                <strong className="block text-lg mb-1 border-b border-border pb-1">{pole.pole_id}</strong>
                
                <div className="space-y-1 mt-2 text-sm">
                  <p className="flex justify-between text-text-secondary"><span>Transformer:</span> <span className="font-mono text-text-primary">{pole.dt_id}</span></p>
                  <p className="flex justify-between text-text-secondary"><span>Feeder:</span> <span className="font-mono text-text-primary">{pole.feeder_id}</span></p>
                  
                  {pole.device_id ? (
                    <p className="flex justify-between text-success"><span>Sensor:</span> <span className="font-mono">{pole.device_id}</span></p>
                  ) : (
                    <p className="flex justify-between text-text-muted"><span>Sensor:</span> <span>Unmonitored</span></p>
                  )}
                </div>

                {/* Active ticket alert inside the popup */}
                {relatedTicket && (
                  <div className="mt-3 p-2 bg-error/10 border border-error/30 rounded flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-error font-bold text-sm">
                      <AlertTriangle size={14} /> Ticket #{relatedTicket.ticket_id}
                    </div>
                    <span className="text-xs text-error opacity-90">{relatedTicket.fault_type} FAULT</span>
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}