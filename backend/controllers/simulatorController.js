import pool from '../config/db.js';

export const injectFault = async (req, res) => {
    const { fault_type, target_id } = req.body;
    // fault_type: 'SPAN', 'DT', or 'FEEDER'
    // target_id: The ID of the parent pole (for span), the DT, or the Feeder

    if (!fault_type || !target_id) {
        return res.status(400).json({ error: "Missing fault_type or target_id" });
    }

    res.status(202).json({ message: `Simulating ${fault_type} fault on ${target_id}. Telemetry firing...` });

    try {
        let affectedPoles = [];

        if (fault_type === 'FEEDER') {
            const result = await pool.query(`SELECT pole_id, device_id FROM poles WHERE feeder_id = $1`, [target_id]);
            affectedPoles = result.rows;
        } 
        
        else if (fault_type === 'DT') {
            const result = await pool.query(`SELECT pole_id, device_id FROM poles WHERE dt_id = $1`, [target_id]);
            affectedPoles = result.rows;
        } 
        
        else if (fault_type === 'SPAN') {
            // Recursive CTE to find the target pole AND everything physically downstream of it
            //in memory for reducing recursive call ---
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

        console.log(`[Simulator] ${fault_type} fault on ${target_id} affects ${affectedPoles.length} poles.`);

        // Fire the synthetic telemetry bursts
        for (const pole of affectedPoles) {
            // The 9% rule: Pole has no device fitted (already NULL in DB)
            if (!pole.device_id) continue;

            // The 70% rule: 30% of devices fail to send their dying gasp
            if (Math.random() < 0.30) continue;

            const payload = {
                device_id: pole.device_id,
                pole_id: pole.pole_id,
                event: 'power_lost',
                energized: false,
                ts: new Date().toISOString(),
                seq: Math.floor(Math.random() * 10000),
                fw: '1.4.2' // Standard firmware
            };

            // Fire and forget via internal fetch (simulating IoT devices hitting our API)
            fetch('http://localhost:3000/telemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error(`Failed to send mock telemetry for ${pole.pole_id}`));
        }

    } catch (error) {
        console.error("[Simulator] Error injecting fault:", error);
    }
};



export const repairFault = async (req, res) => {
    const { ticket_id } = req.body;

    if (!ticket_id) {
        return res.status(400).json({ error: "Missing ticket_id" });
    }

    try {
        // 1. Look up the ticket to know what to fix
        const ticketRes = await pool.query(`SELECT fault_type, target_id FROM tickets WHERE ticket_id = $1`, [ticket_id]);
        if (ticketRes.rows.length === 0) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        const { fault_type, target_id } = ticketRes.rows[0];
        let affectedPoles = [];

        // 2. Find the poles that need repairing based on the ticket type
        if (fault_type === 'CLUSTER' || fault_type === 'DT') {
            const result = await pool.query(`SELECT pole_id, device_id FROM poles WHERE dt_id = $1`, [target_id]);
            affectedPoles = result.rows;
        } else if (fault_type === 'SPAN') {
            // target_id for span looks like "P-102 -> P-104", we need the broken child pole
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

        res.status(202).json({ message: `Simulating repair for ticket ${ticket_id}. Firing restoration telemetry...` });

        // 3. Fire the synthetic restoration telemetry
        for (const pole of affectedPoles) {
            if (!pole.device_id) continue;

            // On power return, devices send `boot` then `power_restored` typically within 20 seconds
            const payload = {
                device_id: pole.device_id,
                pole_id: pole.pole_id,
                event: 'power_restored',
                energized: true,
                ts: new Date().toISOString(),
                seq: 0, // seq resets to 0 on boot
                fw: '1.4.2'
            };

            fetch('http://localhost:3000/telemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error(`Failed to send repair telemetry for ${pole.pole_id}`));
        }

    } catch (error) {
        console.error("[Simulator] Error injecting repair:", error);
    }
};