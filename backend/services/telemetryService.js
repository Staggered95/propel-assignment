// Helper to fire telemetry efficiently without blowing up the V8 heap or socket pool
export const blastTelemetry = async (payloads) => {
    const CHUNK_SIZE = 500; 
    
    for (let i = 0; i < payloads.length; i += CHUNK_SIZE) {
        const chunk = payloads.slice(i, i + CHUNK_SIZE);
        
        await Promise.all(chunk.map(payload => 
            fetch('http://localhost:3000/telemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error(`[Simulator] Telemetry send failed for ${payload.pole_id}`))
        ));
        
        // Tiny 50ms delay to let the event loop breathe
        await new Promise(resolve => setTimeout(resolve, 50)); 
    }
};