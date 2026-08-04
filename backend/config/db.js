import pg from 'pg';

const pool = new pg.Pool({
    user: process.env.DB_USER || 'kspdb_admin',
    password: process.env.DB_PASSWORD || 'kspdb@admin',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'kspdb',
    max: 20,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    process.exit(-1);
});

export default pool;