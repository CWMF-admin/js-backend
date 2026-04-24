import { pool } from '../config/database.js';

export default {
  async getAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM events ORDER BY start_time ASC'
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [
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
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      creator_id,
      title,
      description,
      location,
      capacity,
      start_time,
      end_time,
    ]);
    return this.findById(result.insertId);
  },

  async update(
    id,
    { title, description, location, capacity, start_time, end_time }
  ) {
    const [result] = await pool.execute(
      `
      UPDATE events
      SET
        title = ?,
        description = ?,
        location = ?,
        capacity = ?,
        start_time = ?,
        end_time = ?
      WHERE id = ?
    `,
      [
        title,
        description,
        location,
        capacity,
        start_time,
        end_time,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  },

  async delete(id) {
    const event = await this.findById(id);

    if (!event) {
      return null;
    }

    await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    return event;
  },
};
