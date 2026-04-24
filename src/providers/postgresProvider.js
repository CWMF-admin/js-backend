const notSupported = () => {
  throw new Error('Postgres provider is no longer supported in this backend');
};

export default {
  createUser: notSupported,
  upsertUser: notSupported,
  findByUid: notSupported,
  getAll: notSupported,
};
