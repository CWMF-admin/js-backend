import { pool } from '../config/database.js';

function toScheduleXFormat(date) {
  const d = new Date(date);
  const yyyy = d.getUTCFullYear();
  const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd   = String(d.getUTCDate()).padStart(2, '0');
  const hh   = String(d.getUTCHours()).padStart(2, '0');
  const min  = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

const eventMysqlProvider = {
  async getAll() {
    const sql = 'SELECT * FROM events ORDER BY start_time ASC';
    const [rows] = await pool.query(sql);

    return rows.map(event => ({
      id:          String(event.id),
      title:       event.title,
      description: event.description,
      location:    event.location,
      capacity:    event.capacity,
      start:       toScheduleXFormat(event.start_time),
      end:         toScheduleXFormat(event.end_time),
    }));
  },

  async create({ creator_id, title, description, start_time, end_time, location, capacity }) {
    const sql = `
      INSERT INTO events (creator_id, title, description, start_time, end_time, location, capacity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      creator_id, title, description, start_time, end_time, location, capacity
    ]);

    return {
      id:          String(result.insertId),
      title,
      description,
      location,
      capacity,
      start:       toScheduleXFormat(start_time),
      end:         toScheduleXFormat(end_time),
    };
  },
};

export default eventMysqlProvider;