import mysql from "mysql2/promise";

/**
 * Base pool configuration
 * Hardened against ECONNRESET / idle socket drops
 */
const basePoolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Pool behavior
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,

    // Timeouts (important for serverless)
    connectTimeout: 10_000,  // 10s to establish TCP connection
    acquireTimeout: 10_000,  // wait time for pool connection
    timeout: 10_000,

    // Keep-alive to prevent idle disconnects
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,

    // Prevent stale idle sockets
    maxIdle: 5,
    idleTimeout: 30_000,

    // Safer defaults
    namedPlaceholders: true,
};

/**
 * Main database pool
 */
export const db = mysql.createPool({
    ...basePoolConfig,
    database: process.env.DB_NAME,
    timezone: "Z",
});

/**
 * Archive database pool
 */
export const archivedb = mysql.createPool({
    ...basePoolConfig,
    database: process.env.DB_NAME_ARCHIVE,
    timezone: "+08:00",
});

/**
 * Attach safety listeners to auto-recover dropped connections
 */
function attachPoolHandlers(pool: any, label: string) {
    pool.on("connection", (conn: any) => {
        console.log(`[DB:${label}] connection established`);

        conn.on("error", (err: any) => {
            console.error(`[DB:${label}] connection error`, err.code);

            if (
                err.code === "PROTOCOL_CONNECTION_LOST" ||
                err.code === "ECONNRESET"
            ) {
                // mysql2 will automatically discard and recreate the connection
                console.warn(`[DB:${label}] connection dropped, recovering...`);
            }
        });
    });
}

attachPoolHandlers(db, "MAIN");
attachPoolHandlers(archivedb, "ARCHIVE");

/**
 * Graceful shutdown (important for Vercel / Node 18+)
 */
async function shutdown() {
    try {
        await Promise.all([
            db.end(),
            archivedb.end(),
        ]);
        console.log("[DB] pools closed");
    } catch (err) {
        console.error("[DB] error closing pools", err);
    }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
