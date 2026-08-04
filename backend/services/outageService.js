export async function checkScheduledOutages(dt_id) {
    try {
        const response = await fetch(`http://localhost:3000/outages/active/${dt_id}`);
        const data = await response.json();
        return data.is_scheduled;
    } catch (error) {
        console.error(`[Localization] Failed to check scheduled outages for ${dt_id}:`, error);
        return false; // Fail open
    }
}