import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: "Z",
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  maxIdle: 10,
  idleTimeout: 60000,
});

export const archivedb = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME_ARCHIVE,
  timezone: "+08:00",
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  maxIdle: 10,
  idleTimeout: 60000,
});
