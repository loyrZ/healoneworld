"use strict";
require("dotenv").config();
const mysql = require("mysql2/promise");

async function getConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });
}

(async function main() {
    let connection = null;

    try {
        connection = await getConnection();

        await connection.query(`USE \`${process.env.DB_NAME}\``);

        // Disable foreign key checks so drop order doesn't matter
        await connection.query(`SET FOREIGN_KEY_CHECKS = 0`);

        await connection.query(`DROP TABLE IF EXISTS classes`);
        // Add a DROP line here for every table you add in dbloader.js

        // Re-enable foreign key checks
        await connection.query(`SET FOREIGN_KEY_CHECKS = 1`);

        console.log("All tables dropped successfully.");
        await connection.end();
    } catch (error) {
        console.error(error);
        if (connection) await connection.end();
        process.exit(1);
    }
})();
