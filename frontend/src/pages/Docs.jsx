import { Database, Network, ShieldAlert } from 'lucide-react';

export default function Docs() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12 h-[calc(100vh-100px)] overflow-y-auto scrollbar-none">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-text-primary transition-colors">KSPDB Project Details</h1>
        <p className="text-lg text-text-muted transition-colors">A physics-aware, highly concurrent fault localization engine.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background-secondary p-6 rounded-lg border border-border shadow-sm transition-colors duration-300">
          <Database className="text-warning mb-4" size={32} />
          <h3 className="text-xl font-bold text-text-primary mb-2">Dataset Scale</h3>
          <p className="text-text-secondary">Generates a synthetic grid of exactly 4,401 nodes mapped across central Bengaluru. Stored securely in PostgreSQL.</p>
        </div>
        
        <div className="bg-background-secondary p-6 rounded-lg border border-border shadow-sm transition-colors duration-300">
          <Network className="text-success mb-4" size={32} />
          <h3 className="text-xl font-bold text-text-primary mb-2">Topology Split</h3>
          <p className="text-text-secondary">Enforces a strict 40/60 rule. 60% of transformers have absolutely no child relationships mapped, requiring dynamic cluster grouping.</p>
        </div>

        <div className="bg-background-secondary p-6 rounded-lg border border-border shadow-sm transition-colors duration-300">
          <ShieldAlert className="text-error mb-4" size={32} />
          <h3 className="text-xl font-bold text-text-primary mb-2">Physics Engine</h3>
          <p className="text-text-secondary">Simulator naturally drops 30% of critical telemetry packets to mimic cellular failure and isolates single-sensor battery deaths (noise).</p>
        </div>
      </div>
      
      <div className="bg-background-secondary p-8 rounded-lg border border-border space-y-4 shadow-sm transition-colors duration-300">
         <h2 className="text-2xl font-bold text-text-primary">How to use the UI</h2>
         <ul className="list-disc list-inside text-text-secondary space-y-2">
            <li><strong>Map Tab:</strong> Use the right-hand panel to inject faults directly onto grid assets.</li>
            <li><strong>Faults Tab:</strong> Watch the tickets roll in. Expand a ticket to query Groq AI for a dispatch summary.</li>
            <li><strong>Repairs:</strong> You cannot manually close a ticket if the poles are still physically dark. You must inject a repair signal via the simulator first.</li>
         </ul>
      </div>
    </div>
  );
}