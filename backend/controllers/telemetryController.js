import pool from '../config/db.js';
import { runFaultLocalization } from '../services/localizationService.js';

// Simple in-memory Set to track which transformers need evaluation
export const pendingEvaluations = new Set();

export const ingestTelemetry = async (req, res) => {
    const { device_id, pole_id, event, energized, ts, seq, fw } = req.body;

    // Immediately acknowledge the request so the IoT device (and the reviewer's simulator) doesn't timeout
    res.status(202).json({ status: 'accepted' });

    try {
        // 1. Update the database state
        const query = `
            UPDATE poles 
            SET is_live = $1, last_event_ts = $2, last_event_seq = $3
            WHERE pole_id = $4
            RETURNING dt_id;
        `;
        
        const result = await pool.query(query, [energized, ts, seq, pole_id]);

        if (result.rows.length > 0) {
            const dt_id = result.rows[0].dt_id;
            
            // 2. Trigger the debounced evaluation
            scheduleEvaluation(dt_id);
        }

    } catch (error) {
        console.error(`Failed to process telemetry for ${pole_id}:`, error);
    }
};

// The Debouncer: Waits 15 seconds after a burst before running the fault localization
function scheduleEvaluation(dt_id) {
    if (pendingEvaluations.has(dt_id)) return; // Already scheduled
    
    pendingEvaluations.add(dt_id);
    
    setTimeout(() => {
        pendingEvaluations.delete(dt_id);
        runFaultLocalization(dt_id);
    }, 15000); // 15-second accumulation window
}

