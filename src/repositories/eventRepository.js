import provider from '../providers/eventPostgresProvider.js';

const eventRepository = {
  getAll: () => provider.getAll(),
  create: (eventData) => provider.create(eventData),
};

export default eventRepository;
