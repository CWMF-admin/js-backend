import provider from '../providers/eventMysqlProvider.js';

const eventRepository = {
  getAll: () => provider.getAll(),
  create: (eventData) => provider.create(eventData),
};

export default eventRepository;
