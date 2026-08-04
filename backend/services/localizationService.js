import pool from '../config/db.js';
import { checkScheduledOutages } from './outageService.js';
import { createTicket, verifyTicketsForDT } from './ticketService.js';

export async function runFaultLocalization(dt_id) {
    console.log(`[Localization] Evaluating DT: ${dt_id}`);

    try {
        if (await checkScheduledOutages(dt_id)) {
            console.log(`[Localization] Suppressing alert for ${dt_id}. Scheduled maintenance active.`);
            return;
        }

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

        if (dark_poles == 0) {
            await verifyTicketsForDT(dt_id);
            return; 
        }

        // Adjusted for ~30% packet loss: If 65% or more of the poles are dark, 
        // assume the whole transformer (DT) is down.
        if (dark_poles >= total_poles * 0.65) {
            await createTicket('DT', dt_id, dt_id, dark_poles);
            return;
        }

        // ==========================================
        // THE UNIVERSAL NOISE FILTER
        // If only 1 pole goes dark, assume sensor death regardless of topology.
        // ==========================================
        if (parseInt(dark_poles) === 1) {
            console.log(`[Localization] Dead sensor (Noise) ignored on DT ${dt_id}.`);
            return;
        }

        const isUnmapped = parseInt(mapped_poles) === 0;

        if (isUnmapped) {
            // 60% Case: Unknown Topology
            console.log(`[Localization] 60% Unmapped Case detected for ${dt_id}.`);
            await createTicket('CLUSTER', dt_id, dt_id, dark_poles);
        } else {
            // 40% Case: Known Topology
            const spanQuery = `
                SELECT child.pole_id AS broken_pole, parent.pole_id AS parent_pole, child.pincode
                FROM poles child
                JOIN poles parent ON child.parent_pole_id = parent.pole_id
                WHERE child.dt_id = $1 
                  AND child.is_live = false 
                  AND parent.is_live = true
                  AND NOT EXISTS (
                      SELECT 1 FROM poles grandchild 
                      WHERE grandchild.parent_pole_id = child.pole_id 
                      AND grandchild.is_live = true
                  );
            `;
            const spanRes = await pool.query(spanQuery, [dt_id]);

            if (spanRes.rows.length > 0) {
                for (let fault of spanRes.rows) {
                    const target_id = `${fault.parent_pole} -> ${fault.broken_pole}`;
                    await createTicket('SPAN', dt_id, target_id, dark_poles, fault.pincode);
                }
            } else {
                console.log(`[Localization] SPAN localization completed for mapped DT ${dt_id}.`);
            }
        }
    } catch (error) {
        console.error(`[Localization] Error evaluating ${dt_id}:`, error);
    }
}