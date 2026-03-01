const PLAYERS_DB_KEY = 'playersDB';
const CURRENT_USER_KEY = 'currentUser';
const GAME_CONTENT_KEY = 'gameContent';
const CHANGE_LOG_KEY = 'gameChangeLog';
const APP_SAVE_VERSION = 3;

const defaultPlayers = () => ({ players: {}, metadata: { created: Date.now(), lastUpdate: Date.now(), totalPlayers: 0 }, saveVersion: APP_SAVE_VERSION });

const defaultContent = () => ({
  items: {},
  monstersByLocation: {},
  locationChestConfigs: {}
});

export const Storage = {
  getPlayersDB() {
    const raw = localStorage.getItem(PLAYERS_DB_KEY);
    if (!raw) return defaultPlayers();
    try {
      return this.migrate(JSON.parse(raw));
    } catch {
      return defaultPlayers();
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

  getGameContent() {
    try {
      const raw = localStorage.getItem(GAME_CONTENT_KEY);
      if (!raw) return defaultContent();
      const parsed = JSON.parse(raw);
      return { ...defaultContent(), ...parsed, items: parsed.items || {}, monstersByLocation: parsed.monstersByLocation || {}, locationChestConfigs: parsed.locationChestConfigs || {} };
    } catch {
      return defaultContent();
    }
  },

  setGameContent(content) {
    localStorage.setItem(GAME_CONTENT_KEY, JSON.stringify({ ...defaultContent(), ...content }));
  },

  getChangeLog() {
    try {
      return JSON.parse(localStorage.getItem(CHANGE_LOG_KEY) || '[]');
    } catch {
      return [];
    }
  },

  pushChangeLog(entry) {
    const list = this.getChangeLog();
    list.unshift({ at: Date.now(), ...entry });
    localStorage.setItem(CHANGE_LOG_KEY, JSON.stringify(list.slice(0, 300)));
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
    if (next.saveVersion < 3) {
      Object.values(next.players).forEach((u) => {
        if (!u.player?.gold) {
          if (!u.player) u.player = {};
          u.player.gold = 0;
        }
      });
      next.saveVersion = 3;
    }
    return next;
  }
};
