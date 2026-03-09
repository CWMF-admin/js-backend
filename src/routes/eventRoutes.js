import express from 'express';

import adminMiddleware from '../middleware/adminMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';
import eventRepository from '../repositories/eventRepository.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const events = await eventRepository.getAll();
    res.json(events); // sends the data to browser
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await eventRepository.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, location, capacity, start_time, end_time } =
      req.body;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        error: 'Title, start_time, and end_time are required',
      });
    }

    const event = await eventRepository.create({
      creator_id: req.dbUser.id,
      title,
      description: description || null,
      location: location || null,
      capacity: capacity || 20,
      start_time,
      end_time,
    });

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, location, capacity, start_time, end_time } =
      req.body;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        error: 'Title, start_time, and end_time are required',
      });
    }

    const event = await eventRepository.update(req.params.id, {
      title,
      description: description || null,
      location: location || null,
      capacity: capacity || 20,
      start_time,
      end_time,
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await eventRepository.delete(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      message: 'Event deleted successfully',
      event,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
