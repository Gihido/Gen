const PLAYERS_DB_KEY = 'playersDB';
const CURRENT_USER_KEY = 'currentUser';
const APP_SAVE_VERSION = 2;

export const Storage = {
  getPlayersDB() {
    const raw = localStorage.getItem(PLAYERS_DB_KEY);
    if (!raw) {
      return { players: {}, metadata: { created: Date.now(), lastUpdate: Date.now(), totalPlayers: 0 }, saveVersion: APP_SAVE_VERSION };
    }
    try {
      return this.migrate(JSON.parse(raw));
    } catch {
      return { players: {}, metadata: { created: Date.now(), lastUpdate: Date.now(), totalPlayers: 0 }, saveVersion: APP_SAVE_VERSION };
    }
  },
  setPlayersDB(db) {
    db.metadata.lastUpdate = Date.now();
    db.metadata.totalPlayers = Object.keys(db.players || {}).length;
    db.saveVersion = APP_SAVE_VERSION;
    localStorage.setItem(PLAYERS_DB_KEY, JSON.stringify(db));
  },
  getCurrentUser() {
    return localStorage.getItem(CURRENT_USER_KEY);
  },
  setCurrentUser(username) {
    if (username) localStorage.setItem(CURRENT_USER_KEY, username);
    else localStorage.removeItem(CURRENT_USER_KEY);
  },
  migrate(db) {
    const next = db || {};
    if (!next.players) next.players = {};
    if (!next.metadata) next.metadata = { created: Date.now(), lastUpdate: Date.now(), totalPlayers: 0 };
    if (!next.saveVersion) next.saveVersion = 1;
    if (next.saveVersion < 2) {
      Object.values(next.players).forEach((u) => {
        if (!u.metadata) u.metadata = {};
        if (u.metadata.isBanned === undefined) u.metadata.isBanned = false;
        if (u.metadata.banReason === undefined) u.metadata.banReason = '';
      });
      next.saveVersion = 2;
    }
    return next;
  }
};
