import pool from '../config/db.js';

export async function createTicket(type, dt_id, target_id, affected_count, pincode = null) {
    const query = `
        INSERT INTO tickets (fault_type, target_id, affected_count, pincode, dt_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING ticket_id;
    `;
    const res = await pool.query(query, [type, target_id, affected_count, pincode, dt_id]);
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