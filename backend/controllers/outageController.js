import pool from '../config/db.js';

export const scheduleOutage = async (req, res) => {
    const { dt_id, duration_minutes } = req.body;

    if (!dt_id || !duration_minutes) {
        return res.status(400).json({ error: "Missing dt_id or duration_minutes" });
    }

    try {
        const query = `
            INSERT INTO scheduled_outages (dt_id, end_time) 
            VALUES ($1, CURRENT_TIMESTAMP + ($2 || ' minutes')::interval)
            RETURNING end_time;
        `;
        const result = await pool.query(query, [dt_id, duration_minutes]);
        
        console.log(`[Mock External API] Persistent outage scheduled for ${dt_id}.`);
        res.json({ 
            message: `Outage scheduled for ${dt_id}`, 
            expires_at: result.rows[0].end_time 
        });
    } catch (error) {
        console.error("Database error scheduling outage:", error);
        res.status(500).json({ error: "Failed to schedule outage" });
    }
};

export const checkOutage = async (req, res) => {
    const { dt_id } = req.params;

    try {
        // Only look for active outages (end_time is in the future)
        const query = `
            SELECT 1 FROM scheduled_outages 
            WHERE dt_id = $1 AND end_time > CURRENT_TIMESTAMP;
        `;
        const result = await pool.query(query, [dt_id]);
        
        res.json({ is_scheduled: result.rows.length > 0 });
    } catch (error) {
        console.error("Database error checking outage:", error);
        res.json({ is_scheduled: false }); // Fail open to avoid missing real faults
    }
};