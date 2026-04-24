import { pgPool } from '../config/database.js';

// helper: converts a JS Date → 'YYYY-MM-DD HH:mm'
function toScheduleXFormat(date) {
  const d = new Date(date);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

const eventPostgresProvider = {
  async getAll() {
    const sql = 'SELECT * FROM events ORDER BY start_time ASC';
    const { rows } = await pgPool.query(sql);
    return rows.map(event => ({
      id:           String(event.id),
      title:        event.title,
      description:  event.description,
      location:     event.location,
      capacity:     event.capacity,
      start:        toScheduleXFormat(event.start_time),
      end:          toScheduleXFormat(event.end_time),
    }));
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
    const event = rows[0];
    return {
      id:          String(event.id),
      title:       event.title,
      description: event.description,
      location:    event.location,
      capacity:    event.capacity,
      start:       toScheduleXFormat(event.start_time),
      end:         toScheduleXFormat(event.end_time),
    };
  },
};

export default eventPostgresProvider;
