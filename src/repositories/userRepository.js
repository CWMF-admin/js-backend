// Switch this import to swap between Supabase (Postgres) and AWS (MySQL)
// import provider from '../providers/postgresProvider.js';
import provider from '../providers/mysqlProvider.js';

const userRepository = {
  createUser: (userData) => provider.createUser(userData),
  findByUid: (uid) => provider.findByUid(uid),
  getAll: () => provider.getAll(),
  upsertUser: (userData) => provider.upsertUser(userData),
};

export default userRepository;
