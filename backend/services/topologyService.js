import pool from '../config/db.js';

let parentToChildren = {};
let feederToPoles = {};
let dtToPoles = {};
export let allPoles = {}; // Exported for single-pole lookups (like Noise injection)

// Call this once when the Node server boots up
export const initTopologyCache = async () => {
    try {
        const res = await pool.query('SELECT pole_id, parent_pole_id, feeder_id, dt_id, device_id FROM poles');
        
        parentToChildren = {};
        feederToPoles = {};
        dtToPoles = {};
        allPoles = {};

        res.rows.forEach(row => {
            allPoles[row.pole_id] = row;

            // Build physical span relationships
            if (row.parent_pole_id) {
                if (!parentToChildren[row.parent_pole_id]) parentToChildren[row.parent_pole_id] = [];
                parentToChildren[row.parent_pole_id].push(row.pole_id);
            }

            // Build Feeder clusters
            if (row.feeder_id) {
                if (!feederToPoles[row.feeder_id]) feederToPoles[row.feeder_id] = [];
                feederToPoles[row.feeder_id].push(row);
            }

            // Build DT clusters
            if (row.dt_id) {
                if (!dtToPoles[row.dt_id]) dtToPoles[row.dt_id] = [];
                dtToPoles[row.dt_id].push(row);
            }
        });
        console.log(`[Topology Service] In-memory grid loaded into RAM. Tracking ${res.rows.length} assets.`);
    } catch (error) {
        console.error('[Topology Service] Failed to load grid to memory:', error);
    }
};

// Extremely fast, 0-database-query retrieval for fault simulation
export const getAffectedPoles = (fault_type, target_id) => {
    if (fault_type === 'FEEDER') return feederToPoles[target_id] || [];
    if (fault_type === 'DT' || fault_type === 'CLUSTER') return dtToPoles[target_id] || [];
    
    if (fault_type === 'SPAN') {
        const affected = [];
        const queue = [target_id]; // Use a Breadth-First Search (BFS) array to trace the wires
        
        while(queue.length > 0) {
            const current = queue.shift();
            if (allPoles[current]) {
                affected.push(allPoles[current]);
            }
            // Add all downstream children to the queue
            const children = parentToChildren[current] || [];
            queue.push(...children);
        }
        return affected;
    }
    return [];
};