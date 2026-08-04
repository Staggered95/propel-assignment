import pool from '../config/db.js';
import { getAffectedPoles, allPoles } from '../services/topologyService.js';
import { blastTelemetry } from '../services/telemetryService.js';

export const injectFault = async (req, res) => {
    const requests = Array.isArray(req.body) ? req.body : [req.body];
    if (requests.length === 0) return res.status(400).json({ error: "Empty payload" });

    res.status(202).json({ message: `Processing ${requests.length} fault injections. Telemetry firing in background...` });

    (async () => {
        try {
            const payloads = [];
            
            for (const request of requests) {
                if (!request.fault_type || !request.target_id) continue;

                // Defensive programming: sanitize incoming strings
                const fault_type = String(request.fault_type).trim().toUpperCase();
                const target_id = String(request.target_id).trim().toUpperCase();

                const affectedPoles = getAffectedPoles(fault_type, target_id);

                if (affectedPoles.length === 0) {
                    console.log(`[Simulator] ⚠️ Warning: Target ${target_id} (${fault_type}) not found in memory map.`);
                    continue;
                }

                let missingDeviceCount = 0;
                let droppedCount = 0;

                for (const pole of affectedPoles) {
                    if (!pole.device_id) {
                        missingDeviceCount++;
                        continue;
                    }
                    if (Math.random() < 0.30) {
                        droppedCount++;
                        continue; 
                    }

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
                
                console.log(`[Simulator] ${target_id}: Found ${affectedPoles.length} poles. ${missingDeviceCount} unmonitored. ${droppedCount} dropped (simulated failure).`);
            }
            
            console.log(`[Simulator] Batch assembled: ${payloads.length} telemetry packets. Blasting...`);
            if (payloads.length > 0) {
                await blastTelemetry(payloads);
            }

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
                if (!request.ticket_id) continue;
                
                const ticket_id = String(request.ticket_id).trim();

                const ticketRes = await pool.query(`SELECT fault_type, target_id FROM tickets WHERE ticket_id = $1`, [ticket_id]);
                if (ticketRes.rows.length === 0) continue;

                const { fault_type, target_id } = ticketRes.rows[0];
                
                let lookupId = target_id;
                if (fault_type === 'SPAN') {
                    lookupId = target_id.split(' -> ')[1]; 
                }

                const affectedPoles = getAffectedPoles(fault_type, lookupId);

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
            if (payloads.length > 0) {
                await blastTelemetry(payloads);
            }

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
                if (!request.target_id) continue;
                
                const target_id = String(request.target_id).trim().toUpperCase();

                const pole = allPoles[target_id];
                if (!pole) {
                    console.log(`[Simulator] ⚠️ Warning: Noise target ${target_id} not found in memory map.`);
                    continue;
                }
                if (!pole.device_id) continue;

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
            
            if (payloads.length > 0) {
                await blastTelemetry(payloads);
            }
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