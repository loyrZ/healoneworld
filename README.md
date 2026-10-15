# Heal One World - Claude Helped with this read me

Node + Express server with a MySQL database on Railway.

### 1. Setup

First time:

```
git clone https://github.com/loyrZ/healoneworld.git
cd healoneworld
npm install
```

Put the .env file from the group chat in the project folder, next to package.json. Then:

```
npm run builddb
npm run dev
```

Go to http://127.0.0.1:3000/health, it should say {"server":"ok","db":"ok"}

Every time after that:

```
git pull
npm install
npm run dev
```

### 2. Where things are

```
app.js              express setup, new routes get added here
bin/www             starts the server, don't need to touch it
bin/dbloader.js     makes the tables, new tables go here
bin/dropdb.js       deletes the tables, every table needs a line here too
conf/database.js    database connection
routes/             server routes, index.js has /health
public/             html, css, client js, images
.env                database login, not on github, never commit it
package.json        libraries and npm commands
```

### 3. Commands

- npm run dev - starts the server, restarts when you save
- npm start - starts the server
- npm run builddb - makes any tables that don't exist yet
- npm run dropdb - deletes every table, don't run this, we all share one database

### 4. Adding a table

In bin/dbloader.js, copy makeClassesTable and change the name and columns:

```js
async function makeStudentsTable(connection) {
    const [result] = await connection.query(
        `CREATE TABLE IF NOT EXISTS \`${process.env.DB_NAME}\`.\`students\` (
            id_pk INT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id_pk)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    if (result && result.warningStatus > 0) {
        const [warningResult] = await connection.query("SHOW WARNINGS");
        displayWarningMessage(warningResult[0]);
    } else {
        console.log("Created Students Table!");
    }
}
```

Call it in main() under the other tables:

```js
await makeClassesTable(connection);
await makeStudentsTable(connection);
```

Add a drop line for it in bin/dropdb.js:

```js
await connection.query(`DROP TABLE IF EXISTS students`);
```

Then run npm run builddb, and commit and push so everyone has it.

### 5. Linking tables

To link tables, store the other table's id_pk. Example, enrollments links students to classes:

```js
async function makeEnrollmentsTable(connection) {
    const [result] = await connection.query(
        `CREATE TABLE IF NOT EXISTS \`${process.env.DB_NAME}\`.\`enrollments\` (
            id_pk INT UNSIGNED NOT NULL AUTO_INCREMENT,
            student_id INT UNSIGNED NOT NULL,
            class_id INT UNSIGNED NOT NULL,
            enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id_pk),
            UNIQUE KEY one_enrollment (student_id, class_id),
            FOREIGN KEY (student_id) REFERENCES students(id_pk) ON DELETE CASCADE,
            FOREIGN KEY (class_id) REFERENCES classes(id_pk) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    if (result && result.warningStatus > 0) {
        const [warningResult] = await connection.query("SHOW WARNINGS");
        displayWarningMessage(warningResult[0]);
    } else {
        console.log("Created Enrollments Table!");
    }
}
```

- the fk column has to be the same type as the id_pk it points to (INT UNSIGNED)
- call it in main() after the tables it points to
- ON DELETE CASCADE means deleting a student deletes their enrollments too
- the UNIQUE KEY stops someone enrolling in the same class twice

### 6. Changing a table that already exists

builddb skips tables that already exist, so editing the CREATE TABLE won't change it. Run an ALTER TABLE once instead (Railway Data tab works):

```sql
ALTER TABLE students ADD COLUMN phone VARCHAR(20) NULL;
```

Then update the CREATE TABLE in dbloader.js to match. Tell the group first since we all share the database.

### 7. Adding a route

Make a file in routes/, for example routes/classes.js:

```js
"use strict";

const express = require("express");
const db = require("../conf/database");
const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const [rows] = await db.query("SELECT * FROM classes ORDER BY id_pk");
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const [result] = await db.query(
            "INSERT INTO classes (class_name) VALUES (?)",
            [req.body.class_name]
        );
        res.status(201).json({ id_pk: result.insertId });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
```

Then add it in app.js under the other routes:

```js
app.use("/classes", require("./routes/classes"));
```

### 8. Queries

```js
const db = require("../conf/database");

const [rows] = await db.query("SELECT * FROM students WHERE email = ?", [email]);
```

Always use ? for values. Don't put user input straight into the sql string, that lets people run their own sql on our database.

### 9. Pages

Put them in public/. public/about.html shows up at /about.html.

### 10. Libraries

npm install the library, then commit package.json and package-lock.json so everyone gets it.

### 11. Deploying

Push to main and Railway redeploys on its own. Check https://healoneworld-production-9f6b.up.railway.app/health after.

### 12. Rules

- never commit .env
- don't run npm run dropdb
- always use ? in queries
- npm install after you pull
- save all before running anything (Option + Cmd + S in VS Code)
- tell the group before changing or deleting a table

### 13. If something breaks

- "Missing in .env" or Access denied for user '' - your .env is missing or empty
- ER_ACCESS_DENIED_ERROR - wrong password in .env
- ETIMEDOUT or ECONNREFUSED - wrong DB_HOST or DB_PORT
- Port 3000 is already in use - another server is still running, ctrl + c it
- app.set is not a function / argument handler must be a function - a file is empty, save all
- error about a foreign key when running builddb - the table it points to doesn't exist yet or the types don't match
