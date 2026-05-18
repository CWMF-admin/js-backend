import { pool } from '../config/database.js';

export default {
  // Sign a volunteer up for an event
  async signup(eventId, userId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Lock the event row
      const [[event]] = await conn.execute(
        'SELECT capacity FROM events WHERE id = ? FOR UPDATE',
        [eventId]
      );

      if (!event) {
        await conn.rollback();
        return { error: 'EVENT_NOT_FOUND' };
      }

      const [[{ count }]] = await conn.execute(
        'SELECT COUNT(*) AS count FROM event_signups WHERE event_id = ?',
        [eventId]
      );

      if (count >= event.capacity) {
        await conn.rollback();
        return { error: 'EVENT_FULL' };
      }

      await conn.execute(
        'INSERT INTO event_signups (event_id, user_id) VALUES (?, ?)',
        [eventId, userId]
      );

      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      // Duplicate entry = already signed up
      if (err.code === 'ER_DUP_ENTRY') {
        return { error: 'ALREADY_SIGNED_UP' };
      }
      throw err;
    } finally {
      conn.release();
    }
  },

  // Cancel a signup
  async cancel(eventId, userId) {
    const [result] = await pool.execute(
      'DELETE FROM event_signups WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );
    return result.affectedRows > 0;
  },

  // Get all signups for an event (admin use)
  async getByEvent(eventId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.firstname, u.lastname, es.signed_up_at
       FROM event_signups es
       JOIN users u ON u.id = es.user_id
       WHERE es.event_id = ?
       ORDER BY es.signed_up_at ASC`,
      [eventId]
    );
    return rows;
  },

  // Get all events a volunteer has signed up for
  async getByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT e.*, es.signed_up_at
       FROM event_signups es
       JOIN events e ON e.id = es.event_id
       WHERE es.user_id = ?
       ORDER BY e.start_time ASC`,
      [userId]
    );
    return rows;
  },

  // Check if a specific user is signed up for a specific event
  async isSignedUp(eventId, userId) {
    const [[row]] = await pool.execute(
      'SELECT id FROM event_signups WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );
    return !!row;
  },

  // Get current signup count for an event
  async getSignupCount(eventId) {
    const [[{ count }]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM event_signups WHERE event_id = ?',
      [eventId]
    );
    return count;
  },
};