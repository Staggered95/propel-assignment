import pool from '../config/db.js';

export const getNetworkTopology = async (req, res) => {
    try {
        // We only fetch the fields strictly necessary for plotting points and lines
        const query = `
            SELECT 
                pole_id, 
                lat, 
                lon, 
                is_live, 
                dt_id, 
                feeder_id,
                parent_pole_id, 
                device_id 
            FROM poles;
        `;
        const result = await pool.query(query);
        
        console.log(`[API] Served ${result.rows.length} poles to the frontend map.`);
        res.json(result.rows);
    } catch (error) {
        console.error("Failed to fetch network topology:", error);
        res.status(500).json({ error: "Failed to fetch network topology" });
    }
};