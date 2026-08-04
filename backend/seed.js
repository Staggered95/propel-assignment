import pool from './config/db.js';

const TOTAL_DTS = 50; 
const FEEDERS = ['F-01', 'F-02', 'F-03', 'F-04'];
const BASE_LAT = 12.9716;
const BASE_LON = 77.5946;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSeed() {
    let client;
    let retries = 10;
    
    // The Race Condition Fix: Wait for Postgres to be fully ready
    while (retries) {
        try {
            client = await pool.connect();
            console.log("Database is ready! Starting seed...");
            break;
        } catch (err) {
            console.log(`Waiting for database... (${retries} retries left)`);
            retries -= 1;
            await sleep(2000);
            if (retries === 0) {
                console.error("Database connection timed out.");
                process.exit(1);
            }
        }
    }

    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE poles CASCADE');
        await client.query('TRUNCATE TABLE tickets CASCADE');

        let totalPoles = 0;
        let mappedDTs = 0;
        let unmappedDTs = 0;

        for (let dtIndex = 1; dtIndex <= TOTAL_DTS; dtIndex++) {
            const dtId = `D-${String(dtIndex).padStart(4, '0')}`;
            const feederId = FEEDERS[dtIndex % FEEDERS.length];
            const polesCount = Math.floor(Math.random() * (150 - 9 + 1)) + 9;
            const isMapped = Math.random() >= 0.60; 

            if (isMapped) {
                mappedDTs++;
                totalPoles += await insertMappedDT(client, dtId, feederId, polesCount, totalPoles);
            } else {
                unmappedDTs++;
                totalPoles += await insertUnmappedDT(client, dtId, feederId, polesCount, totalPoles);
            }
        }

        await client.query('COMMIT');
        
        console.log("-------------------------------------------------");
        console.log("✅ Seeding Complete!");
        console.log(`Total Poles Generated: ${totalPoles}`);
        console.log(`Mapped Transformers (40% rule): ${mappedDTs}`);
        console.log(`Unmapped Transformers (60% rule): ${unmappedDTs}`);
        console.log("-------------------------------------------------");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Seeding failed:", err);
    } finally {
        if (client) client.release();
        await pool.end(); 
    }
}

async function insertMappedDT(client, dtId, feederId, polesCount, globalPoleOffset) {
    let insertedCount = 0;
    let previousPoleId = null;
    let poleIds = []; 

    for (let i = 1; i <= polesCount; i++) {
        const poleId = `P-${String(globalPoleOffset + i).padStart(6, '0')}`;
        poleIds.push(poleId);

        let parentId = null;
        if (i > 1) {
            if (Math.random() < 0.15 && poleIds.length > 2) {
                parentId = poleIds[Math.floor(Math.random() * (poleIds.length - 2))];
            } else {
                parentId = previousPoleId;
            }
        }

        await insertPole(client, poleId, feederId, dtId, i, parentId);
        previousPoleId = poleId;
        insertedCount++;
    }
    return insertedCount;
}

async function insertUnmappedDT(client, dtId, feederId, polesCount, globalPoleOffset) {
    let insertedCount = 0;
    for (let i = 1; i <= polesCount; i++) {
        const poleId = `P-${String(globalPoleOffset + i).padStart(6, '0')}`;
        await insertPole(client, poleId, feederId, dtId, null, null);
        insertedCount++;
    }
    return insertedCount;
}

async function insertPole(client, poleId, feederId, dtId, seqOnLine, parentId) {
    const lat = BASE_LAT + (Math.random() - 0.5) * 0.05;
    const lon = BASE_LON + (Math.random() - 0.5) * 0.05;
    const hasDevice = Math.random() >= 0.09;
    const deviceId = hasDevice ? `DEV-${poleId}` : null;
    const pincode = "560078"; 

    const query = `
        INSERT INTO poles (pole_id, lat, lon, feeder_id, dt_id, seq_on_line, parent_pole_id, device_id, pincode)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    await client.query(query, [poleId, lat, lon, feederId, dtId, seqOnLine, parentId, deviceId, pincode]);
}

runSeed();