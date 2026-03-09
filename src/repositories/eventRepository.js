import { pgPool } from '../config/database.js';

export default {
  async getAll() {
    const { rows } = await pgPool.query('SELECT * FROM events ORDER BY start_time ASC');
    return rows;
  },
  async create({ creator_id, title, description, location, capacity, start_time, end_time }) {
    const sql = `INSERT INTO events (creator_id, title, description, location, capacity, start_time, end_time) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const { rows } = await pgPool.query(sql, [creator_id, title, description, location, capacity, start_time, end_time]);
    return rows[0];
  }
};