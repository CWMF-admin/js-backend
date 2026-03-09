import { pgPool } from '../config/database.js';

export default {
  async getAll() {
    const { rows } = await pgPool.query(
      'SELECT * FROM events ORDER BY start_time ASC'
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pgPool.query('SELECT * FROM events WHERE id = $1', [
      id,
    ]);
    return rows[0] || null;
  },

  async create({
    creator_id,
    title,
    description,
    location,
    capacity,
    start_time,
    end_time,
  }) {
    const sql = `
      INSERT INTO events (
        creator_id,
        title,
        description,
        location,
        capacity,
        start_time,
        end_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const { rows } = await pgPool.query(sql, [
      creator_id,
      title,
      description,
      location,
      capacity,
      start_time,
      end_time,
    ]);
    return rows[0];
  },

  async update(
    id,
    { title, description, location, capacity, start_time, end_time }
  ) {
    const sql = `
      UPDATE events
      SET
        title = $2,
        description = $3,
        location = $4,
        capacity = $5,
        start_time = $6,
        end_time = $7
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pgPool.query(sql, [
      id,
      title,
      description,
      location,
      capacity,
      start_time,
      end_time,
    ]);
    return rows[0] || null;
  },

  async delete(id) {
    const { rows } = await pgPool.query(
      'DELETE FROM events WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0] || null;
  },
};
