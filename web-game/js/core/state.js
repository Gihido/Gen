import { Storage } from './storage.js';

export class AppState {
  constructor() {
    this.screen = 'auth';
    this.currentUser = null;
    this.currentBattle = null;
    this.listeners = [];
    this.playersDB = Storage.getPlayersDB();
  }

  subscribe(listener) { this.listeners.push(listener); }
  notify() { this.listeners.forEach((l) => l(this)); }

  load() {
    this.playersDB = Storage.getPlayersDB();
    const remembered = Storage.getCurrentUser();
    if (remembered && this.playersDB.players[remembered]) {
      this.currentUser = remembered;
      this.screen = 'location';
    }
    this.notify();
  }

  save() {
    Storage.setPlayersDB(this.playersDB);
    Storage.setCurrentUser(this.currentUser);
  }

  get userData() {
    if (!this.currentUser) return null;
    return this.playersDB.players[this.currentUser] || null;
  }

  setScreen(screen) {
    this.screen = screen;
    this.notify();
  }

  dispatch(action) {
    switch (action.type) {
      case 'LOGIN':
        this.currentUser = action.username;
        this.screen = 'location';
        break;
      case 'LOGOUT':
        this.currentUser = null;
        this.currentBattle = null;
        this.screen = 'auth';
        break;
      case 'START_BATTLE':
        this.currentBattle = action.payload;
        this.screen = 'battle';
        break;
      case 'END_BATTLE':
        this.currentBattle = null;
        this.screen = 'location';
        break;
      default:
        break;
    }
    this.save();
    this.notify();
  }
}
