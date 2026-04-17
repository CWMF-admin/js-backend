import { pgPool } from '../config/database.js';

const eventPostgresProvider = {
  async getAll() {
    const sql = 'SELECT * FROM events ORDER BY start_time ASC';
    const { rows } = await pgPool.query(sql);
    return rows;
  },

  async create({
    creator_id,
    title,
    description,
    start_time,
    end_time,
    location,
    capacity,
  }) {
    const sql = `
      INSERT INTO events (
        creator_id,
        title,
        description,
        start_time,
        end_time,
        location,
        capacity
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const { rows } = await pgPool.query(sql, [
      creator_id,
      title,
      description,
      start_time,
      end_time,
      location,
      capacity,
    ]);
    return rows[0];
  },
};

export default eventPostgresProvider;
