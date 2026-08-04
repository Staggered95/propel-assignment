import NetworkMap from '../components/NetworkMap';
import SimulatorControls from '../components/SimulatorControls';

export default function Home() {
  return (
    <div className="flex gap-4 h-[calc(100vh-100px)]">
      {/* Map Container */}
      <div className="flex-[2] bg-background-primary rounded-lg border border-border overflow-hidden relative shadow-lg transition-colors duration-300">
        <NetworkMap />
      </div>
      
      {/* Simulator Panel Container */}
      <div className="flex-1 min-w-[400px]">
        <SimulatorControls />
      </div>
    </div>
  );
}