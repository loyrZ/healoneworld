const db = require('../conf/database');

const { exec } = require('child_process');
const pathToFFMPEG = require('ffmpeg-static');
const path = require('path'); // Import path module

const USER_SELECT = `
    SELECT u.id_pk AS id, u.name, u.email,
        CASE WHEN p.admin THEN 'Admin'
             WHEN p.staff THEN 'Staff'
             ELSE 'User' END AS role
    FROM users u
    LEFT JOIN permission p ON p.id_fk = u.id_pk
`;

module.exports = {
    getAllUsers: async function (req, res, next) {
        try {
            const [rows] = await db.query(`${USER_SELECT} ORDER BY u.name`);
            res.json(rows);
        } catch (err) {
            next(err);
        }
    }
    
}