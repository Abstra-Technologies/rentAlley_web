import mysql from "mysql2/promise";

const globalForDB = global as unknown as {
    db?: mysql.Pool;
    archivedb?: mysql.Pool;
};

const basePoolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    connectionLimit: 20, // increase slightly for prod
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10_000,

    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,

    namedPlaceholders: true,
};

export const db =
    globalForDB.db ??
    mysql.createPool({
        ...basePoolConfig,
        database: process.env.DB_NAME,
        timezone: "Z",
    });

export const archivedb =
    globalForDB.archivedb ??
    mysql.createPool({
        ...basePoolConfig,
        database: process.env.DB_NAME_ARCHIVE,
        timezone: "+08:00",
    });

if (process.env.NODE_ENV !== "production") {
    globalForDB.db = db;
    globalForDB.archivedb = archivedb;
}
