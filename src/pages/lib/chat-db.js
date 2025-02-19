const mysql = require("mysql2/promise");

const chat_pool = mysql.createPool({
    host: 'rentahan-db.ctmeauk6wkzd.ap-southeast-1.rds.amazonaws.com',
    user: 'rentahan_dev', // Default value for debugging
    password: 'Rentahan_db_admin2024',
    database: 'rentahan',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = chat_pool;
