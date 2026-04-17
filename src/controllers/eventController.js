import eventRepository from '../repositories/eventRepository.js';

const eventController = {
  async getAllEvents(_req, res) {
    try {
      const events = await eventRepository.getAll();

      res.status(200).json(events);
    } catch (error) {
      console.error('Get all events error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async createEvent(req, res) {
    try {
      const {
        creator_id,
        title,
        description,
        start_time,
        end_time,
        location,
        capacity,
      } = req.body;

      const event = await eventRepository.create({
        creator_id,
        title,
        description,
        start_time,
        end_time,
        location,
        capacity,
      });

      res.status(201).json(event);
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default eventController;
