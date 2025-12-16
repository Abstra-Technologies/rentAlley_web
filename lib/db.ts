import mysql from "mysql2/promise";

/**
 * Base pool configuration (mysql2-safe)
 */
const basePoolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Pool behavior
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,

    // Timeouts
    connectTimeout: 10_000, // ✅ valid

    // Keep-alive
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,

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
