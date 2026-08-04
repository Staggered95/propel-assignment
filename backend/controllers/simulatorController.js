import pool from '../config/db.js';

// Helper to fire telemetry efficiently without blowing up the V8 heap or socket pool
// This ensures we can easily meet the "5,000 messages in 10s" burst requirement
const blastTelemetry = async (payloads) => {
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
        // Tiny 50ms delay to let the event loop breathe and simulate realistic cellular network jitter
        await new Promise(resolve => setTimeout(resolve, 50)); 
    }
};

export const injectFault = async (req, res) => {
    // Support both single objects and arrays for batch processing
    const requests = Array.isArray(req.body) ? req.body : [req.body];
    
    if (requests.length === 0) return res.status(400).json({ error: "Empty payload" });

    // Release the frontend instantly
    res.status(202).json({ message: `Processing ${requests.length} fault injections. Telemetry firing in background...` });

    // Background processing
    (async () => {
        try {
            const payloads = [];
            
            for (const request of requests) {
                const { fault_type, target_id } = request;
                if (!fault_type || !target_id) continue;

                let affectedPoles = [];
                if (fault_type === 'FEEDER') {
                    const result = await pool.query(`SELECT pole_id, device_id FROM poles WHERE feeder_id = $1`, [target_id]);
                    affectedPoles = result.rows;
                } else if (fault_type === 'DT') {
                    const result = await pool.query(`SELECT pole_id, device_id FROM poles WHERE dt_id = $1`, [target_id]);
                    affectedPoles = result.rows;
                } else if (fault_type === 'SPAN') {
                    const query = `
                        WITH RECURSIVE downstream AS (
                            SELECT pole_id, device_id FROM poles WHERE pole_id = $1
                            UNION ALL
                            SELECT p.pole_id, p.device_id FROM poles p
                            INNER JOIN downstream d ON p.parent_pole_id = d.pole_id
                        )
                        SELECT pole_id, device_id FROM downstream;
                    `;
                    const result = await pool.query(query, [target_id]);
                    affectedPoles = result.rows;
                }

                for (const pole of affectedPoles) {
                    if (!pole.device_id) continue;
                    // 30% drop rate to simulate cellular failure
                    if (Math.random() < 0.30) continue; 

                    payloads.push({
                        device_id: pole.device_id,
                        pole_id: pole.pole_id,
                        event: 'power_lost',
                        energized: false,
                        ts: new Date().toISOString(),
                        seq: Math.floor(Math.random() * 10000),
                        fw: '1.4.2'
                    });
                }
            }
            
            console.log(`[Simulator] Batch assembled: ${payloads.length} telemetry packets. Blasting...`);
            await blastTelemetry(payloads);

        } catch (error) {
            console.error("[Simulator] Error in background fault injection:", error);
        }
    })();
};

export const repairFault = async (req, res) => {
    const requests = Array.isArray(req.body) ? req.body : [req.body];
    if (requests.length === 0) return res.status(400).json({ error: "Empty payload" });

    res.status(202).json({ message: `Processing ${requests.length} repairs. Firing restoration telemetry...` });

    (async () => {
        try {
            const payloads = [];

            for (const request of requests) {
                const { ticket_id } = request;
                if (!ticket_id) continue;

                const ticketRes = await pool.query(`SELECT fault_type, target_id FROM tickets WHERE ticket_id = $1`, [ticket_id]);
                if (ticketRes.rows.length === 0) continue;

                const { fault_type, target_id } = ticketRes.rows[0];
                let affectedPoles = [];

                if (fault_type === 'CLUSTER' || fault_type === 'DT') {
                    const result = await pool.query(`SELECT pole_id, device_id FROM poles WHERE dt_id = $1`, [target_id]);
                    affectedPoles = result.rows;
                } else if (fault_type === 'SPAN') {
                    const brokenPole = target_id.split(' -> ')[1];
                    const query = `
                        WITH RECURSIVE downstream AS (
                            SELECT pole_id, device_id FROM poles WHERE pole_id = $1
                            UNION ALL
                            SELECT p.pole_id, p.device_id FROM poles p
                            INNER JOIN downstream d ON p.parent_pole_id = d.pole_id
                        )
                        SELECT pole_id, device_id FROM downstream;
                    `;
                    const result = await pool.query(query, [brokenPole]);
                    affectedPoles = result.rows;
                }

                for (const pole of affectedPoles) {
                    if (!pole.device_id) continue;
                    payloads.push({
                        device_id: pole.device_id,
                        pole_id: pole.pole_id,
                        event: 'power_restored',
                        energized: true,
                        ts: new Date().toISOString(),
                        seq: 0, 
                        fw: '1.4.2'
                    });
                }
            }

            console.log(`[Simulator] Repair batch assembled: ${payloads.length} telemetry packets. Blasting...`);
            await blastTelemetry(payloads);

        } catch (error) {
            console.error("[Simulator] Error injecting repair:", error);
        }
    })();
};

export const injectNoise = async (req, res) => {
    const requests = Array.isArray(req.body) ? req.body : [req.body];
    if (requests.length === 0) return res.status(400).json({ error: "Empty payload" });

    res.status(202).json({ message: `Processing ${requests.length} dead sensors.` });

    (async () => {
        try {
            const payloads = [];
            for (const request of requests) {
                const { target_id } = request;
                if (!target_id) continue;

                const result = await pool.query(`SELECT pole_id, device_id FROM poles WHERE pole_id = $1`, [target_id]);
                if (result.rows.length === 0 || !result.rows[0].device_id) continue;

                payloads.push({
                    device_id: result.rows[0].device_id,
                    pole_id: result.rows[0].pole_id,
                    event: 'power_lost',
                    energized: false,
                    ts: new Date().toISOString(),
                    seq: Math.floor(Math.random() * 10000),
                    fw: '1.4.2'
                });
            }
            
            await blastTelemetry(payloads);
        } catch (error) {
            console.error("[Simulator] Error injecting noise:", error);
        }
    })();
};

export const resetGrid = async (req, res) => {
    try {
        await pool.query('DELETE FROM tickets;');
        await pool.query('UPDATE poles SET is_live = true;');
        console.log('[Simulator] Grid completely reset to baseline by operator.');
        res.status(200).json({ message: 'Grid restored to optimal state.' });
    } catch (error) {
        console.error('[Simulator] Failed to reset grid:', error);
        res.status(500).json({ error: 'Failed to reset grid.' });
    }
};