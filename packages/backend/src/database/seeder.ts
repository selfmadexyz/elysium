export const seed = async () => {
  // Posts now require a real Better Auth user. Keep the default seed empty so
  // the starter never creates unowned records or fake authentication data.
};

seed().finally(() => {
  process.exit(0);
});
