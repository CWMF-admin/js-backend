import { pgPool } from '../config/database.js';

export default {
  async createUser({
    uid,
    username,
    email,
    firstname,
    lastname,
    role = 'volunteer',
  }) {
    const sql = `INSERT INTO users (firebase_uid, username, email, firstname, lastname, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;
    const { rows } = await pgPool.query(sql, [
      uid,
      username,
      email,
      firstname,
      lastname,
      role,
    ]);
    return { id: rows[0].id, uid, username, email, role };
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
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (firebase_uid) DO UPDATE SET
        email = EXCLUDED.email,
        firstname = EXCLUDED.firstname,
        lastname = EXCLUDED.lastname;
    `;
    await pgPool.query(sql, [uid, username, email, firstname, lastname, role]);
    return this.findByUid(uid);
  },

  async findByUid(uid) {
    const sql = `SELECT id, firebase_uid AS "firebaseUid", username, email, firstname, lastname, role FROM users WHERE firebase_uid = $1`;
    const { rows } = await pgPool.query(sql, [uid]);
    return rows[0] || null;
  },

  async getAll() {
    const { rows } = await pgPool.query(
      `SELECT username, email, firstname, lastname, role FROM users ORDER BY username ASC`
    );
    return rows;
  }
};
