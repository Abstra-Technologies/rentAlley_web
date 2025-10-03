// lib/cronDB.js
const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: "Z",
    waitForConnections: true,
    connectionLimit: 10,   // ⚠️ keep this smaller for cron jobs
    queueLimit: 0,
});

module.exports = { db };
