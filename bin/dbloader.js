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
            user_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
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

async function makeUsersTable(connection) {
    const [result] = await connection.query(
        `CREATE TABLE IF NOT EXISTS \`${process.env.DB_NAME}\`.\`users\` (
        id_pk INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        clerk_user_id VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NULL,
        password_hash VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_pk),
        UNIQUE KEY uq_users_clerk_user_id (clerk_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    if (result && result.warningStatus > 0) {
        const [warningResult] = await connection.query("SHOW WARNINGS");
        displayWarningMessage(warningResult[0]);
    } else {
        console.log("Created Users Table!");
    }
}

async function makePermissionTable(connection) {
    const [result] = await connection.query(
        `CREATE TABLE IF NOT EXISTS \`${process.env.DB_NAME}\`.\`permission\` (
            id_fk INT UNSIGNED NOT NULL,
            instructor boolean not null DEFAULT FALSE,
            staff boolean not null DEFAULT FALSE,
            admin boolean not null DEFAULT FALSE,
            volunteer boolean not null DEFAULT FALSE,
            PRIMARY KEY (id_fk),
            FOREIGN KEY (id_fk) REFERENCES users(id_pk)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    if (result && result.warningStatus > 0) {
        const [warningResult] = await connection.query("SHOW WARNINGS");
        displayWarningMessage(warningResult[0]);
    } else {
        console.log("Created User's Permission Table!");
    }
}

async function makeAnnouncementsTable(connection) {
    const [result] = await connection.query(`
        CREATE TABLE IF NOT EXISTS \`${process.env.DB_NAME}\`.\`announcements\` (
            id_pk INT UNSIGNED NOT NULL AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
            visibility ENUM('public') NOT NULL DEFAULT 'public',
            published_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id_pk)
        ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
    `);

    if (result && result.warningStatus > 0) {
        const [warningResult] = await connection.query("SHOW WARNINGS");
        displayWarningMessage(warningResult[0]);
    } else {
        console.log("Created Announcements Table!");
    }
}

async function makeVolunteerProfilesTable(connection) {
    const [result] = await connection.query(
        `CREATE TABLE IF NOT EXISTS \`${process.env.DB_NAME}\`.\`volunteer_profiles\` (
            clerk_user_id VARCHAR(64) NOT NULL,
            phone VARCHAR(20) NOT NULL DEFAULT '',
            interests VARCHAR(500) NOT NULL DEFAULT '',
            availability VARCHAR(500) NOT NULL DEFAULT '',
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (clerk_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    if (result && result.warningStatus > 0) {
        const [warningResult] = await connection.query("SHOW WARNINGS");
        displayWarningMessage(warningResult[0]);
    } else {
        console.log("Created Volunteer Profiles Table!");
    }
}
(async function main() {
    let connection = null;
    try {
        connection = await getConnection();
        await makeDatabase(connection);
        await connection.query(`USE \`${process.env.DB_NAME}\``);
        await makeClassesTable(connection);
        await makeUsersTable(connection);
        await makePermissionTable(connection);
        await makeAnnouncementsTable(connection);
        await makeVolunteerProfilesTable(connection);
        await connection.end();
        console.log("\nDatabase build complete.\n");
    } catch (error) {
        console.error(error);
        if (connection != null) await connection.end();
        process.exit(1);
    }
})();
