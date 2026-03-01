import { AppState } from './state.js';
import { hashPassword, NotificationType, randomInt } from './utils.js';
import { showNotification, openModal, closeModal, statBar } from './ui.js';
import { CLASSES, DEFAULT_LOCATION_STATE, GENDERS, LOCATION_CONFIG } from '../data/locations.js';
import { Player } from '../models/player.js';
import { LootItem, Monster } from '../models/monster.js';
import { renderAuthScreen } from '../screens/auth.js';
import { renderLocationScreen } from '../screens/location.js';
import { renderBattleScreen } from '../screens/battle.js';

export class RPGApp {
  constructor(rootId = 'app') {
    this.root = document.getElementById(rootId);
    this.state = new AppState();
    this.ui = { sidebarOpen: false, section: 'location' };
    this.bindGlobalEvents();
    this.state.subscribe(() => this.render());
    this.state.load();
    setInterval(() => this.tick(), 1000);
  }

  bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, ...payload } = btn.dataset;
      if (this[action]) this[action](payload, e);
    });
  }

  tick() {
    if (this.state.screen === 'location') this.state.notify();
    if (this.state.screen === 'battle') this.handleBattleTimer();
  }

  getUser() {
    const data = this.state.userData;
    if (!data) return null;
    const p = new Player(data.player);
    p.normalize();
    return p;
  }

  saveUser(playerObj, metadataPatch = {}) {
    const user = this.state.userData;
    if (!user) return;
    user.player = playerObj;
    user.metadata = { ...user.metadata, ...metadataPatch };
    this.state.playersDB.players[this.state.currentUser] = user;
    this.state.save();
  }

  ensureWorld(player) {
    if (!player.world) player.world = JSON.parse(JSON.stringify(DEFAULT_LOCATION_STATE));
    for (const loc of Object.keys(DEFAULT_LOCATION_STATE)) {
      if (!player.world[loc]) player.world[loc] = { lootPile: { items: [] }, monsters: {} };
      if (!player.world[loc].lootPile) player.world[loc].lootPile = { items: [] };
      if (!player.world[loc].monsters) player.world[loc].monsters = {};
    }
    if (!player.world.mainChest) player.world.mainChest = { items: [] };
  }

  getMonsterForLocation(player, locationName) {
    const cfg = LOCATION_CONFIG[locationName];
    if (!cfg?.monsters?.length) return null;
    const mcfg = cfg.monsters[0];
    const persisted = player.world[locationName].monsters[mcfg.key] || {};
    const monster = new Monster(mcfg, persisted);
    player.world[locationName].monsters[mcfg.key] = monster.toJSON();
    return monster;
  }

  render() {
    if (this.state.screen === 'auth') return (this.root.innerHTML = renderAuthScreen({ classes: CLASSES, genders: GENDERS }));
    const player = this.getUser();
    if (!player) return this.state.dispatch({ type: 'LOGOUT' });
    this.ensureWorld(player);
    if (this.state.screen === 'location') {
      const monster = this.getMonsterForLocation(player, player.location);
      this.saveUser(player);
      this.root.innerHTML = renderLocationScreen({ player, location: LOCATION_CONFIG[player.location], monster, statBar, ui: this.ui });
    } else {
      this.root.innerHTML = renderBattleScreen({ player, battle: this.state.currentBattle, statBar });
    }
  }

  login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const user = this.state.playersDB.players[username];
    if (!user || user.passwordHash !== hashPassword(password)) return showNotification('Неверный логин или пароль', NotificationType.ERROR);
    if (user.metadata?.isBanned) return showNotification(`Аккаунт заблокирован: ${user.metadata.banReason || 'Без причины'}`, NotificationType.ERROR);
    user.metadata.lastLogin = Date.now();
    this.state.dispatch({ type: 'LOGIN', username });
    showNotification('Успешный вход', NotificationType.SUCCESS);
  }

  register() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const className = document.getElementById('reg-class').value;
    const gender = document.getElementById('reg-gender').value;
    if (username.length < 3 || password.length < 3) return showNotification('Минимум 3 символа.', NotificationType.WARNING);
    if (this.state.playersDB.players[username]) return showNotification('Пользователь уже существует.', NotificationType.WARNING);
    const isAdmin = ['admin', 'gihido'].includes(username.toLowerCase());
    this.state.playersDB.players[username] = { username, passwordHash: hashPassword(password), player: Player.create({ username, className, gender }), metadata: { created: Date.now(), lastLogin: null, isBanned: false, banReason: '', isAdmin } };
    this.state.save();
    showNotification('Регистрация успешна.', NotificationType.SUCCESS);
  }

  logout() { this.state.dispatch({ type: 'LOGOUT' }); }
  toggleSidebar() { this.ui.sidebarOpen = !this.ui.sidebarOpen; this.state.notify(); }
  switchSection({ section }) { this.ui.section = section; this.state.notify(); }

  travel({ location }) {
    const player = this.getUser();
    const currentMonster = this.getMonsterForLocation(player, player.location);
    if (currentMonster?.isAlive) return showNotification('Сначала победите монстра!', NotificationType.WARNING);
    if (!LOCATION_CONFIG[location]) return;
    player.location = location;
    this.ui.section = 'location';
    this.saveUser(player);
    this.state.notify();
  }

  openChest() { showNotification('Вещи в сундук локации попадают только с монстров.', NotificationType.INFO); }

  pickupItem({ itemId, source }) {
    const player = this.getUser();
    const pile = source === 'main' ? player.world.mainChest : player.world[player.location].lootPile;
    const idx = pile.items.findIndex((x) => x.id === itemId);
    if (idx < 0) return;
    const item = pile.items[idx];
    if (!player.canCarryItem(item)) return showNotification('Перевес! Нельзя подобрать.', NotificationType.WARNING);
    player.inventory.push(item); pile.items.splice(idx, 1);
    this.saveUser(player); this.state.notify();
  }

  toMainChest({ itemId }) {
    const player = this.getUser();
    if (player.location !== 'Главная') return showNotification('Личный сундук доступен только в Главной.', NotificationType.WARNING);
    const idx = player.inventory.findIndex((x) => x.id === itemId);
    if (idx < 0) return;
    player.world.mainChest.items.push(player.inventory[idx]);
    player.inventory.splice(idx, 1);
    this.saveUser(player); this.state.notify();
  }

  inventoryAction({ mode, itemId }) {
    const player = this.getUser();
    const item = player.inventory.find((x) => x.id === itemId);
    if (!item) return;
    if (mode === 'use') player.useConsumable(item);
    if (mode === 'equip') {
      const r = player.equipItem(item.id);
      if (!r.ok) return showNotification(r.reason, NotificationType.WARNING);
    }
    if (mode === 'drop') {
      player.inventory = player.inventory.filter((x) => x.id !== item.id);
      player.world[player.location].lootPile.items.push(item);
    }
    this.saveUser(player); this.state.notify();
  }

  unequip({ slot }) {
    const player = this.getUser();
    const r = player.unequipItem(slot);
    if (!r.ok) return showNotification(r.reason, NotificationType.WARNING);
    this.saveUser(player); this.state.notify();
  }

  startBattle() {
    const player = this.getUser();
    const monster = this.getMonsterForLocation(player, player.location);
    if (!monster?.isAlive) return showNotification('Монстра нет.', NotificationType.INFO);
    this.state.dispatch({
      type: 'START_BATTLE',
      payload: {
        monster: monster.toJSON(),
        log: ['Бой начался!'],
        phase: 'player',
        acted: false,
        playerDeadline: Date.now() + 10000,
        monsterAttackAt: null
      }
    });
  }

  handleBattleTimer() {
    const b = this.state.currentBattle;
    if (!b) return;
    const now = Date.now();
    const player = this.getUser();
    const mcfg = LOCATION_CONFIG[player.location]?.monsters?.[0];
    if (!mcfg) return;
    const monster = new Monster(mcfg, b.monster);
    if (b.phase === 'player' && now >= b.playerDeadline) {
      b.log.push('⏱️ Время вышло: ход пропущен.');
      b.phase = 'monster';
      b.monsterAttackAt = now + randomInt(5000, 10000);
    }
    if (b.phase === 'monster' && now >= b.monsterAttackAt) {
      this.monsterTurn(player, monster, b.log);
      return;
    }
    this.state.currentBattle = { ...b, monster: monster.toJSON() };
    this.state.notify();
  }

  battleAction({ mode }) {
    const b = this.state.currentBattle;
    if (!b || b.phase !== 'player' || b.acted) return;
    const player = this.getUser();
    const mcfg = LOCATION_CONFIG[player.location].monsters[0];
    const monster = new Monster(mcfg, b.monster);
    const log = b.log;

    if (mode === 'escape') {
      if (randomInt(1, 100) <= 45) return this.finishBattle(player, monster, [...log, 'Вы успешно сбежали!'], null);
      log.push('Побег не удался!');
    } else if (mode === 'attack') {
      const dmg = player.attack(); monster.takeDamage(dmg); log.push(`Вы атаковали на ${dmg}.`);
    } else if (mode === 'magic') {
      if (player.mp < 8) return showNotification('Недостаточно маны.', NotificationType.WARNING);
      player.mp -= 8; const dmg = player.attack() + randomInt(4, 10); monster.takeDamage(dmg); log.push(`Магический удар: ${dmg}.`);
    } else if (mode === 'defense') {
      player.battleState.defenseActive = true; log.push('Вы встали в защиту.');
    } else if (mode === 'item') {
      const c = player.inventory.find((x) => x.type === 'consumable');
      if (!c) return showNotification('Нет расходников.', NotificationType.WARNING);
      player.useConsumable(c); log.push(`Использован ${c.name}.`);
    }

    if (!monster.isAlive) {
      const exp = monster.expReward; const lvl = player.addExperience(exp); const loot = monster.generateLoot();
      player.world[player.location].lootPile.items.push(...loot);
      log.push(`Победа! +${exp} EXP. Лут: ${loot.map((i) => `${i.icon || '📦'} ${i.name}`).join(', ') || 'нет'}`);
      if (lvl > 0) log.push(`Новый уровень: +${lvl}`);
      return this.finishBattle(player, monster, log, true);
    }

    this.state.currentBattle = { ...b, monster: monster.toJSON(), log, acted: true, phase: 'monster', monsterAttackAt: Date.now() + randomInt(5000, 10000) };
    this.saveUser(player);
    this.state.notify();
  }

  monsterTurn(player, monster, log) {
    let raw = monster.attack(); if (player.battleState.defenseActive) raw = Math.floor(raw / 2);
    const res = player.takeDamage(raw); log.push(`${monster.name} наносит ${res.damageTaken} урона.`); player.updateBattleState();
    if (!res.alive) {
      player.restoreHealthAndMana(); log.push('Поражение. Вы восстановились.');
      return this.finishBattle(player, monster, log, false);
    }
    this.state.currentBattle = { ...this.state.currentBattle, monster: monster.toJSON(), log, phase: 'player', acted: false, playerDeadline: Date.now() + 10000, monsterAttackAt: null };
    this.saveUser(player); this.state.notify();
  }

  finishBattle(player, monster, log, victory) {
    player.world[player.location].monsters[monster.key] = monster.toJSON();
    this.saveUser(player);
    if (victory === true) showNotification('Победа!', NotificationType.SUCCESS);
    if (victory === false) showNotification('Поражение!', NotificationType.ERROR);
    this.state.currentBattle = { ...this.state.currentBattle, log };
    this.state.dispatch({ type: 'END_BATTLE' });
  }

  closeAnyModal() { closeModal(); }
}
