import express from 'express';

import adminMiddleware from '../middleware/adminMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';
import eventRepository from '../repositories/eventRepository.js';
import eventSignupRepository from '../repositories/eventSignupRepository.js';
import userRepository from '../repositories/userRepository.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const events = await eventRepository.getAll();
    res.json(events); // sends the data to browser
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Volunteer sees their own signups
router.get('/my-signups', authMiddleware, async (req, res) => {
  try {
    const dbUser = await userRepository.findByUid(req.user.uid);
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const signups = await eventSignupRepository.getByUser(dbUser.id);
    res.json(signups);
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

// Returns all events formatted for Schedule-X
router.get('/calendar', authMiddleware, async (req, res) => {
  try {
    const events = await eventRepository.getAll();
    const dbUser = await userRepository.findByUid(req.user.uid);

    const formatted = await Promise.all(
      events.map(async (event) => {
        const signupCount = await eventSignupRepository.getSignupCount(event.id);
        const isSignedUp = dbUser
          ? await eventSignupRepository.isSignedUp(event.id, dbUser.id)
          : false;

        // Convert to Schedule-X format
        const toChicagoISO = (mysqlDatetime) => {
          const d = new Date(mysqlDatetime);
          // Get offset for America/Chicago at this specific datetime
          const chicagoStr = d.toLocaleString('en-US', { timeZone: 'America/Chicago' });
          const chicagoDate = new Date(chicagoStr + ' UTC');
          const offsetMs = chicagoDate - d;
          const offsetHrs = Math.round(offsetMs / 36e5);
          const sign = offsetHrs >= 0 ? '+' : '-';
          const pad = (n) => String(Math.abs(n)).padStart(2, '0');
          const iso = d.toISOString().replace('Z', '');
          const [datePart, timePart] = iso.split('T');
          const timeNoMs = timePart.split('.')[0];
          // Adjust to local Chicago time
          const localDate = new Date(d.getTime() + offsetMs);
          const localIso = localDate.toISOString().replace('Z', '');
          const [localDatePart, localTimePart] = localIso.split('T');
          const localTimeNoMs = localTimePart.split('.')[0];
          return `${localDatePart}T${localTimeNoMs}${sign}${pad(offsetHrs)}:00[America/Chicago]`;
        };

        return {
          id: String(event.id),
          title: `${event.title} (${signupCount}/${event.capacity})`,
          start: toChicagoISO(event.start_time),
          end: toChicagoISO(event.end_time),
          description: event.description || '',
          location: event.location || '',
          // Extra fields the frontend can use (Schedule-X ignores unknown fields)
          eventId: event.id,
          capacity: event.capacity,
          signupCount,
          isSignedUp,
        };
      })
    );

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Volunteer signs up for an event
router.post('/:id/signup', authMiddleware, async (req, res) => {
  try {
    const dbUser = await userRepository.findByUid(req.user.uid);
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await eventSignupRepository.signup(
      parseInt(req.params.id),
      dbUser.id
    );

    if (result.error === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (result.error === 'EVENT_FULL') {
      return res.status(409).json({ error: 'Event is full' });
    }
    if (result.error === 'ALREADY_SIGNED_UP') {
      return res.status(409).json({ error: 'Already signed up for this event' });
    }

    res.status(201).json({ message: 'Signed up successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Volunteer cancels their signup
router.delete('/:id/signup', authMiddleware, async (req, res) => {
  try {
    const dbUser = await userRepository.findByUid(req.user.uid);
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cancelled = await eventSignupRepository.cancel(
      parseInt(req.params.id),
      dbUser.id
    );

    if (!cancelled) {
      return res.status(404).json({ error: 'Signup not found' });
    }

    res.json({ message: 'Signup cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin sees who signed up for an event
router.get('/:id/signups', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const signups = await eventSignupRepository.getByEvent(req.params.id);
    res.json(signups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
