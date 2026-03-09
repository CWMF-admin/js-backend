import express from 'express';
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

export default router;