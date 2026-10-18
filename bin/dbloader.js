"use strict";
require("dotenv").config();
const mysql = require("mysql2/promise");

function displayWarningMessage(warning) {
    switch (warning.Code) {
        case 1007:
            console.log(`Skipping Database Creation --> ${warning.Message}`);
            break;
        case 1050:
            console.log(`Skipping Table Creation --> ${warning.Message}`);
            break;
        case 1060:
            console.log(`Skipping Column Add --> ${warning.Message}`);
            break;
        default:
            console.log(`Warning [${warning.Code}]: ${warning.Message}`);
    }
}

async function getConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        multipleStatements: true,
    });
}

async function makeDatabase(connection) {
    const [result] = await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`
    );
    if (result && result.warningStatus > 0) {
        const [warningResult] = await connection.query("SHOW WARNINGS");
        displayWarningMessage(warningResult[0]);
    } else {
        console.log("Created Database!");
    }
}

async function makeClassesTable(connection) {
    const [result] = await connection.query(
        `CREATE TABLE IF NOT EXISTS \`${process.env.DB_NAME}\`.\`classes\` (
            id_pk INT UNSIGNED NOT NULL AUTO_INCREMENT,
            class_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            user_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL

            PRIMARY KEY (id_pk)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    if (result && result.warningStatus > 0) {
        const [warningResult] = await connection.query("SHOW WARNINGS");
        displayWarningMessage(warningResult[0]);
    } else {
        console.log("Created Classes Table!");
    }
}

(async function main() {
    let connection = null;
    try {
        connection = await getConnection();
        await makeDatabase(connection);
        await connection.query(`USE \`${process.env.DB_NAME}\``);
        await makeClassesTable(connection);
        await connection.end();
        console.log("\nDatabase build complete.\n");
    } catch (error) {
        console.error(error);
        if (connection != null) await connection.end();
        process.exit(1);
    }
})();
