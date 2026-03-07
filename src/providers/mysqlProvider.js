import { pool } from '../config/database.js';

export default {
  async createUser({
    uid,
    username,
    email,
    firstname,
    lastname,
    role = 'volunteer',
  }) {
    const sql = `INSERT INTO users (firebase_uid, username, email, firstname, lastname, role) VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [
      uid,
      username,
      email,
      firstname,
      lastname,
      role,
    ]);
    return { id: result.insertId, uid, username, email, role };
  },

  async upsertUser({
    uid,
    username,
    email,
    firstname,
    lastname,
    role = 'volunteer',
  }) {
    const sql = `
      INSERT INTO users (firebase_uid, username, email, firstname, lastname, role)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        firstname = VALUES(firstname),
        lastname = VALUES(lastname);
    `;
    await pool.execute(sql, [uid, username, email, firstname, lastname, role]);
    return this.findByUid(uid);
  },

  async findByUid(uid) {
    const sql = `SELECT id, firebase_uid AS firebaseUid, username, email, firstname, lastname, role FROM users WHERE firebase_uid = ?`;
    const [rows] = await pool.execute(sql, [uid]);
    return rows[0] || null;
  },

  async getAll() {
    const [rows] = await pool.execute(
      `SELECT username, email, firstname, lastname, role FROM users ORDER BY username ASC`
    );
    return rows;
  }
};
