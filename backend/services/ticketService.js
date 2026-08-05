import pool from '../config/db.js';

export async function createTicket(type, dt_id, target_id, affected_count, pincode = null) {
    // 1. Check if an active (unverified) ticket already exists for this specific target
    const checkQuery = `
        SELECT ticket_id, affected_count 
        FROM tickets 
        WHERE dt_id = $1 AND target_id = $2 AND status != 'VERIFIED'
    `;
    const checkRes = await pool.query(checkQuery, [dt_id, target_id]);

    // 2. If it exists, update it if the outage has spread (more poles affected)
    if (checkRes.rows.length > 0) {
        const existingTicket = checkRes.rows[0];
        
        if (affected_count > existingTicket.affected_count) {
            const updateQuery = `
                UPDATE tickets 
                SET affected_count = $1 
                WHERE ticket_id = $2
            `;
            await pool.query(updateQuery, [affected_count, existingTicket.ticket_id]);
            console.log(`🔄 Ticket Updated [${type}] - Target: ${target_id} | New Count: ${affected_count}`);
        }
        // Exit early so we don't insert a duplicate ticket
        return; 
    }

    // 3. If no active ticket exists, create a brand new one
    const insertQuery = `
        INSERT INTO tickets (fault_type, target_id, affected_count, pincode, dt_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING ticket_id;
    `;
    const res = await pool.query(insertQuery, [type, target_id, affected_count, pincode, dt_id]);
    console.log(`✅ Ticket Created [${type}] - Target: ${target_id} | ID: ${res.rows[0].ticket_id}`);
}

export async function verifyTicketsForDT(dt_id) {
    const verifyQuery = `
        UPDATE tickets 
        SET status = 'VERIFIED', verified_at = CURRENT_TIMESTAMP
        WHERE dt_id = $1 AND status != 'VERIFIED'
        RETURNING ticket_id;
    `;
    const verifyRes = await pool.query(verifyQuery, [dt_id]);
    
    if (verifyRes.rows.length > 0) {
        console.log(`[Verification] Ticket(s) ${verifyRes.rows.map(r => r.ticket_id).join(', ')} auto-verified based on telemetry.`);
    }
}