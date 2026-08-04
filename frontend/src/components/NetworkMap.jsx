import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

export default function NetworkMap() {
  const [poles, setPoles] = useState([]);

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const res = await axios.get('/api/network');
        setPoles(res.data);
      } catch (err) {
        console.error("Failed to fetch network topology", err);
      }
    };

    fetchNetwork();
    // Refresh map every 10 seconds to show live power states
    const interval = setInterval(fetchNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  // Center roughly on Bengaluru based on our seed data
  const center = [12.9716, 77.5946];

  return (
    <MapContainer center={center} zoom={13} className="w-full h-full rounded-lg z-0">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />
      {poles.map((pole) => (
        <CircleMarker
          key={pole.pole_id}
          center={[pole.lat, pole.lon]}
          radius={pole.is_live ? 3 : 5}
          fillColor={pole.is_live ? '#16a34a' : '#ef4444'}
          color={pole.is_live ? '#16a34a' : '#ef4444'}
          weight={1}
          fillOpacity={pole.is_live ? 0.4 : 0.9}
        >
          <Popup className="bg-stone-800 text-stone-200 border-stone-700">
            <div className="font-sans">
              <strong className="block text-lg mb-1">{pole.pole_id}</strong>
              <p>DT ID: <span className="font-mono text-yellow-500">{pole.dt_id}</span></p>
              <p>Status: {pole.is_live ? '⚡ Live' : '❌ Dark'}</p>
              {pole.device_id && <p className="text-xs text-stone-400 mt-2">Sensor: {pole.device_id}</p>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}