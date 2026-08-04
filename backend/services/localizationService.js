import pool from '../config/db.js';

export async function runFaultLocalization(dt_id) {
    console.log(`[Localization] Evaluating DT: ${dt_id}`);

    try {
        // Step 1: Check the Scheduled Outage Mock API first
        const isScheduled = await checkScheduledOutages(dt_id);
        if (isScheduled) {
            console.log(`[Localization] Suppressing alert for ${dt_id}. Scheduled maintenance active.`);
            return;
        }

        // Step 2: Get total poles and dark poles for this DT
        const statsQuery = `
            SELECT 
                COUNT(*) as total_poles,
                COUNT(*) FILTER (WHERE is_live = false) as dark_poles,
                COUNT(*) FILTER (WHERE parent_pole_id IS NOT NULL) as mapped_poles
            FROM poles
            WHERE dt_id = $1;
        `;
        const statsRes = await pool.query(statsQuery, [dt_id]);
        const { total_poles, dark_poles, mapped_poles } = statsRes.rows[0];

        if (dark_poles == 0) return; // False alarm or already resolved

        // Step 3: DT Fault Check (Are ALL poles dark?)
        if (dark_poles === total_poles) {
            await createTicket('DT', dt_id, dt_id, dark_poles);
            return;
        }

        // Step 4: The 40/60 Split Logic
        const isUnmapped = parseInt(mapped_poles) === 0;

        if (isUnmapped) {
            // 60% Case: Unknown Topology
            // We can't find a span, so we group all dark poles under a DT-level ticket
            console.log(`[Localization] 60% Unmapped Case detected for ${dt_id}.`);
            await createTicket('CLUSTER', dt_id, dt_id, dark_poles);
        } else {
            // 40% Case: Known Topology
            // Find the exact broken span: A dark pole whose parent is still live.
            const spanQuery = `
                SELECT child.pole_id AS broken_pole, parent.pole_id AS parent_pole, child.pincode
                FROM poles child
                JOIN poles parent ON child.parent_pole_id = parent.pole_id
                WHERE child.dt_id = $1 
                  AND child.is_live = false 
                  AND parent.is_live = true;
            `;
            const spanRes = await pool.query(spanQuery, [dt_id]);

            if (spanRes.rows.length > 0) {
                // There could be multiple simultaneous faults, loop through them
                for (let fault of spanRes.rows) {
                    const target_id = `${fault.parent_pole} -> ${fault.broken_pole}`;
                    await createTicket('SPAN', dt_id, target_id, dark_poles, fault.pincode);
                }
            } else {
                // Edge case: A single sensor died, but its children are live.
                console.log(`[Localization] Dead sensor detected under ${dt_id}. No ticket created.`);
            }
        }
    } catch (error) {
        console.error(`[Localization] Error evaluating ${dt_id}:`, error);
    }
}

// --- Helper Functions ---

async function createTicket(type, dt_id, target_id, affected_count, pincode = null) {
    const query = `
        INSERT INTO tickets (fault_type, target_id, affected_count, pincode)
        VALUES ($1, $2, $3, $4)
        RETURNING ticket_id;
    `;
    const res = await pool.query(query, [type, target_id, affected_count, pincode]);
    console.log(`✅ Ticket Created [${type}] - Target: ${target_id} | ID: ${res.rows[0].ticket_id}`);
}

async function checkScheduledOutages(target_id) {
    // In a real app, this would be an HTTP call to the Mock API.
    // For now, we stub it to return false.
    return false; 
}