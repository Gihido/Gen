import { AppState } from './state.js';
import { Storage } from './storage.js';
import { hashPassword, NotificationType, randomInt } from './utils.js';
import { showNotification, openModal, closeModal, statBar } from './ui.js';
import { CLASSES, DEFAULT_LOCATION_STATE, GENDERS, LOCATION_CONFIG } from '../data/locations.js';
import { STATIC_ITEMS } from '../data/items.js';
import { SKILL_LIBRARY } from '../data/skills.js';
import { Player } from '../models/player.js';
import { LootItem, Monster } from '../models/monster.js';
import { renderAuthScreen } from '../screens/auth.js';
import { renderLocationScreen } from '../screens/location.js';
import { renderBattleScreen } from '../screens/battle.js';

const CLASS_AVATARS = {
  Воин: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Warrior&backgroundColor=b6e3f4,c0aede',
  Маг: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mage&backgroundColor=d1d4f9,ffd5dc',
  Лучник: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Hunter&backgroundColor=c0aede,b6e3f4',
  Жрец: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Priest&backgroundColor=ffdfbf,d1d4f9',
  Разбойник: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Rogue&backgroundColor=ffd5dc,c0aede'
};

export class RPGApp {
  constructor(rootId = 'app') {
    this.root = document.getElementById(rootId);
    this.state = new AppState();
    this.content = Storage.getGameContent();
    this.ui = {
      sidebarOpen: false,
      section: 'location',
      authMode: 'login',
      selectedClass: CLASSES[0],
      selectedGender: GENDERS[0],
      adminTab: 'players',
      adminSelectedUser: null,
      lastRegenAt: Date.now()
    };
    this.applyDynamicContent();
    this.bindGlobalEvents();
    this.state.subscribe(() => this.render());
    this.state.load();
    setInterval(() => this.tick(), 250);
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
    this.updateCountdowns();
    this.tickRegeneration();
    if (this.state.screen === 'location') this.syncMonsterRespawns();
    if (this.state.screen === 'battle') this.handleBattleTimer();
  }

  updateCountdowns() {
    document.querySelectorAll('[data-countdown-to]').forEach((node) => {
      const target = Number(node.dataset.countdownTo || 0);
      if (!target) return;
      const left = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      node.textContent = `${left}`;
    });
  }

  applyDynamicContent() {
    Object.entries(this.content.items || {}).forEach(([key, value]) => {
      STATIC_ITEMS[key] = value;
    });

    Object.entries(this.content.monstersByLocation || {}).forEach(([location, monsters]) => {
      if (!LOCATION_CONFIG[location]) return;
      LOCATION_CONFIG[location].monsters = monsters;
    });
  }

  saveContentLog(action, payload = {}) {
    Storage.pushChangeLog({ action, payload, by: this.state.currentUser || 'system' });
  }

  persistContent() {
    Storage.setGameContent(this.content);
    this.applyDynamicContent();
  }

  tickRegeneration() {
    const now = Date.now();
    if (now - this.ui.lastRegenAt < 1000) return;
    this.ui.lastRegenAt = now;
    const player = this.getUser();
    if (!player) return;
    const prevHp = player.hp;
    const prevMp = player.mp;
    player.hp = Math.min(player.hpMax, player.hp + 1);
    player.mp = Math.min(player.mpMax, player.mp + 1);
    if (player.hp !== prevHp || player.mp !== prevMp) {
      this.saveUser(player);
      this.updateLiveBars(player);
    }
  }

  updateLiveBars(player) {
    const hpValue = document.getElementById('live-hp');
    const mpValue = document.getElementById('live-mp');
    if (hpValue) hpValue.textContent = `${player.hp}/${player.hpMax}`;
    if (mpValue) mpValue.textContent = `${player.mp}/${player.mpMax}`;

    document.querySelectorAll('[data-live-hp]').forEach((node) => {
      node.style.width = `${Math.max(0, Math.min(100, Math.floor((player.hp / player.hpMax) * 100)))}%`;
    });
    document.querySelectorAll('[data-live-mp]').forEach((node) => {
      node.style.width = `${Math.max(0, Math.min(100, Math.floor((player.mp / player.mpMax) * 100)))}%`;
    });
  }

  getUser() {
    const data = this.state.userData;
    if (!data) return null;
    const p = new Player(data.player);
    p.normalize();
    return p;
  }

  isAdminUser() {
    const user = this.state.userData;
    if (!user) return false;
    return Boolean(user.metadata?.isAdmin) || ['admin', 'gihido'].includes((this.state.currentUser || '').toLowerCase());
  }

  saveUser(playerObj, metadataPatch = {}) {
    const user = this.state.userData;
    if (!user) return;
    user.player = playerObj;
    user.metadata = { ...user.metadata, ...metadataPatch };
    this.state.playersDB.players[this.state.currentUser] = user;
    this.state.save();
  }

  saveAnyUser(username, userRecord) {
    this.state.playersDB.players[username] = userRecord;
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

  syncMonsterRespawns() {
    const player = this.getUser();
    if (!player) return;
    this.ensureWorld(player);
    const cfg = LOCATION_CONFIG[player.location];
    if (!cfg?.monsters?.length) return;
    const mcfg = cfg.monsters[0];
    const persisted = player.world[player.location].monsters[mcfg.key] || {};
    const beforeAlive = persisted.isAlive ?? true;
    const monster = new Monster(mcfg, persisted);
    player.world[player.location].monsters[mcfg.key] = monster.toJSON();
    if (!beforeAlive && monster.isAlive) {
      this.saveUser(player);
      this.state.notify();
      showNotification(`${monster.name} снова появился в локации.`, NotificationType.INFO, 1800);
    }
  }

  render() {
    if (this.state.screen === 'auth') {
      this.root.innerHTML = renderAuthScreen({ classes: CLASSES, genders: GENDERS, mode: this.ui.authMode, selectedClass: this.ui.selectedClass, selectedGender: this.ui.selectedGender });
      return;
    }

    const player = this.getUser();
    if (!player) return this.state.dispatch({ type: 'LOGOUT' });
    this.ensureWorld(player);
    const isAdmin = this.isAdminUser();
    const selectedAdminUser = this.ui.adminSelectedUser || this.state.currentUser;

    if (this.state.screen === 'location') {
      const monster = this.getMonsterForLocation(player, player.location);
      this.saveUser(player);
      this.root.innerHTML = renderLocationScreen({
        player,
        location: LOCATION_CONFIG[player.location],
        monster,
        statBar,
        ui: this.ui,
        isAdmin,
        selectedAdminUser,
        playersDB: this.state.playersDB,
        skills: SKILL_LIBRARY,
        items: STATIC_ITEMS,
        classAvatars: CLASS_AVATARS,
        changeLog: Storage.getChangeLog()
      });
      this.updateLiveBars(player);
    } else {
      this.root.innerHTML = renderBattleScreen({ player, battle: this.state.currentBattle, statBar });
      this.updateLiveBars(player);
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
    const className = document.getElementById('reg-class').value || this.ui.selectedClass;
    const gender = document.getElementById('reg-gender').value || this.ui.selectedGender;
    if (username.length < 3 || password.length < 3) return showNotification('Минимум 3 символа.', NotificationType.WARNING);
    if (this.state.playersDB.players[username]) return showNotification('Пользователь уже существует.', NotificationType.WARNING);
    const isAdmin = ['admin', 'gihido'].includes(username.toLowerCase());
    this.state.playersDB.players[username] = { username, passwordHash: hashPassword(password), player: Player.create({ username, className, gender }), metadata: { created: Date.now(), lastLogin: null, isBanned: false, banReason: '', isAdmin } };
    this.state.save();
    this.ui.authMode = 'login';
    this.state.notify();
    showNotification('Регистрация успешна.', NotificationType.SUCCESS);
  }

  showRegister() { this.ui.authMode = 'register'; this.state.notify(); }
  showLogin() { this.ui.authMode = 'login'; this.state.notify(); }
  selectClass({ className }) { if (CLASSES.includes(className)) { this.ui.selectedClass = className; this.state.notify(); } }
  selectGender({ gender }) { if (GENDERS.includes(gender)) { this.ui.selectedGender = gender; this.state.notify(); } }

  logout() { this.state.dispatch({ type: 'LOGOUT' }); }
  toggleSidebar() { this.ui.sidebarOpen = !this.ui.sidebarOpen; this.state.notify(); }
  switchSection({ section }) { this.ui.section = section; this.state.notify(); }
  switchAdminTab({ tab }) { this.ui.adminTab = tab; this.state.notify(); }

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

  pickupItem({ itemId, source }) {
    const player = this.getUser();
    const pile = source === 'main' ? player.world.mainChest : player.world[player.location].lootPile;
    const idx = pile.items.findIndex((x) => x.id === itemId);
    if (idx < 0) return;
    const item = pile.items[idx];
    if (!player.canCarryItem(item)) return showNotification('Перевес! Нельзя подобрать.', NotificationType.WARNING);
    player.inventory.push(item);
    pile.items.splice(idx, 1);
    this.saveUser(player);
    this.state.notify();
  }

  toMainChest({ itemId }) {
    const player = this.getUser();
    if (player.location !== 'Главная') return showNotification('Личный сундук доступен только в Главной.', NotificationType.WARNING);
    const idx = player.inventory.findIndex((x) => x.id === itemId);
    if (idx < 0) return;
    player.world.mainChest.items.push(player.inventory[idx]);
    player.inventory.splice(idx, 1);
    this.saveUser(player);
    this.state.notify();
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
    this.saveUser(player);
    this.state.notify();
  }

  unequip({ slot }) {
    const player = this.getUser();
    const r = player.unequipItem(slot);
    if (!r.ok) return showNotification(r.reason, NotificationType.WARNING);
    this.saveUser(player);
    this.state.notify();
  }

  equipSkill({ skillId }) {
    const player = this.getUser();
    const r = player.equipSkill(skillId);
    if (!r.ok) return showNotification(r.reason, NotificationType.WARNING);
    this.saveUser(player);
    this.state.notify();
  }

  unequipSkill({ slot }) {
    const player = this.getUser();
    const r = player.unequipSkill(Number(slot));
    if (!r.ok) return showNotification(r.reason, NotificationType.WARNING);
    this.saveUser(player);
    this.state.notify();
  }

  openBattleSkills() {
    const player = this.getUser();
    const equipped = player.skills.equipped.filter(Boolean);
    const html = `<div class="mini-skills"><h3>Экипированные умения</h3>${equipped.length ? equipped.map((id) => {
      const skill = SKILL_LIBRARY[id];
      if (!skill) return '';
      return `<div class="mini-skill-row"><b>${skill.icon || '✨'} ${skill.name}</b><span>MP: ${skill.manaCost || 0}</span><button data-action="battleUseSkill" data-skill-id="${skill.id}">Применить</button></div>`;
    }).join('') : '<div class="muted">Нет экипированных умений.</div>'}<button class="secondary" data-action="closeAnyModal">Закрыть</button></div>`;
    openModal(html);
  }

  battleUseSkill({ skillId }) { closeModal(); this.battleAction({ mode: 'skill', skillId }); }

  startBattle() {
    const player = this.getUser();
    const monster = this.getMonsterForLocation(player, player.location);
    if (!monster?.isAlive) return showNotification('Монстра нет.', NotificationType.INFO);
    this.state.dispatch({ type: 'START_BATTLE', payload: { monster: monster.toJSON(), log: ['Бой начался!'], phase: 'player', acted: false, playerDeadline: Date.now() + 10000, monsterAttackAt: null } });
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
    if (b.phase === 'monster' && now >= b.monsterAttackAt) return this.monsterTurn(player, monster, b.log);
    this.state.currentBattle = { ...b, monster: monster.toJSON() };
  }

  battleAction({ mode, skillId }) {
    const b = this.state.currentBattle;
    if (!b || b.phase !== 'player' || b.acted) return;
    const player = this.getUser();
    const mcfg = LOCATION_CONFIG[player.location].monsters[0];
    const monster = new Monster(mcfg, b.monster);
    const log = b.log;

    if (mode === 'attack') {
      const dmg = player.attack();
      monster.takeDamage(dmg);
      log.push(`Вы атаковали на ${dmg}.`);
    }

    if (mode === 'skill') {
      const used = player.useSkill(skillId, monster);
      if (!used.ok) return showNotification(used.reason, NotificationType.WARNING);
      log.push(used.log);
    }

    if (!monster.isAlive) {
      const exp = monster.expReward;
      const lvl = player.addExperience(exp);
      const loot = monster.generateLoot();
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
    const res = player.takeDamage(monster.attack());
    log.push(`${monster.name} наносит ${res.damageTaken} урона.`);
    player.updateBattleState();
    if (!res.alive) {
      player.restoreHealthAndMana();
      log.push('Поражение. Вы восстановились.');
      return this.finishBattle(player, monster, log, false);
    }
    this.state.currentBattle = { ...this.state.currentBattle, monster: monster.toJSON(), log, phase: 'player', acted: false, playerDeadline: Date.now() + 10000, monsterAttackAt: null };
    this.saveUser(player);
    this.state.notify();
  }

  finishBattle(player, monster, log, victory) {
    player.world[player.location].monsters[monster.key] = monster.toJSON();
    this.saveUser(player);
    if (victory === true) showNotification('Победа!', NotificationType.SUCCESS);
    if (victory === false) showNotification('Поражение!', NotificationType.ERROR);
    this.state.currentBattle = { ...this.state.currentBattle, log };
    this.state.dispatch({ type: 'END_BATTLE' });
  }

  openChestManager() {
    const player = this.getUser();
    const inMain = player.location === 'Главная';
    if (!inMain) return showNotification('Интерфейс личного сундука доступен в Главной.', NotificationType.WARNING);
    const chestItems = player.world.mainChest.items;
    const inv = player.inventory;
    const card = (item, action, txt) => `<div class="item-card"><div><b>${item.icon || '📦'} ${item.name}</b></div><div class="muted">${item.type} | ⚖ ${item.weight || 0}</div><button data-action="${action}" data-item-id="${item.id}">${txt}</button></div>`;
    openModal(`<h3>Сундук хранилища</h3><div class="row"><div style="flex:1"><h4>Сундук</h4>${chestItems.map((i) => card(i, 'pickupItem', 'В сумку').replace('data-action="pickupItem"', 'data-action="pickupItem" data-source="main"')).join('') || '<div class="muted">Пусто</div>'}</div><div style="flex:1"><h4>Сумка</h4>${inv.map((i) => card(i, 'toMainChest', 'В сундук')).join('') || '<div class="muted">Пусто</div>'}</div></div><button class="secondary" data-action="closeAnyModal">Закрыть</button>`);
  }

  adminSelectUser({ username }) {
    if (!this.isAdminUser()) return;
    this.ui.adminSelectedUser = username;
    this.state.notify();
  }

  adminToggleBan() {
    if (!this.isAdminUser()) return;
    const username = this.ui.adminSelectedUser;
    if (!username || username === this.state.currentUser) return showNotification('Нельзя блокировать самого себя.', NotificationType.WARNING);
    const target = this.state.playersDB.players[username];
    if (!target) return;
    target.metadata.isBanned = !target.metadata.isBanned;
    if (target.metadata.isBanned && !target.metadata.banReason) target.metadata.banReason = 'Заблокировано администратором';
    this.saveAnyUser(username, target);
    this.saveContentLog('toggle-ban', { username, banned: target.metadata.isBanned });
    this.state.notify();
  }

  adminSaveStats() {
    if (!this.isAdminUser()) return;
    const username = this.ui.adminSelectedUser;
    const target = this.state.playersDB.players[username];
    if (!target) return;
    const p = new Player(target.player);
    p.normalize();
    p.level = Math.max(1, Number(document.getElementById('admin-level')?.value || p.level));
    p.hpMax = Math.max(1, Number(document.getElementById('admin-hpmax')?.value || p.hpMax));
    p.hp = Math.min(p.hpMax, Math.max(0, Number(document.getElementById('admin-hp')?.value || p.hp)));
    p.mpMax = Math.max(1, Number(document.getElementById('admin-mpmax')?.value || p.mpMax));
    p.mp = Math.min(p.mpMax, Math.max(0, Number(document.getElementById('admin-mp')?.value || p.mp)));
    target.player = p;
    this.saveAnyUser(username, target);
    this.saveContentLog('save-player-stats', { username, hp: p.hp, mp: p.mp, level: p.level });
    this.state.notify();
    showNotification('Характеристики сохранены.', NotificationType.SUCCESS);
  }

  adminCreateItem() {
    if (!this.isAdminUser()) return;
    const id = document.getElementById('item-id')?.value?.trim();
    const name = document.getElementById('item-name')?.value?.trim();
    const type = document.getElementById('item-type')?.value;
    if (!id || !name || !type) return showNotification('Заполните ID, имя и тип.', NotificationType.WARNING);

    const base = {
      key: id,
      name,
      icon: document.getElementById('item-icon')?.value?.trim() || '📦',
      type,
      weight: Number(document.getElementById('item-weight')?.value || 1),
      value: Number(document.getElementById('item-value')?.value || 1),
      rarity: document.getElementById('item-rarity')?.value || 'common',
      classRequirement: document.getElementById('item-class')?.value || null,
      levelRequirement: Number(document.getElementById('item-level')?.value || 1),
      description: document.getElementById('item-desc')?.value || ''
    };

    if (type === 'weapon') base.damage = Number(document.getElementById('item-damage')?.value || 1);
    if (type === 'armor') {
      base.defense = Number(document.getElementById('item-defense')?.value || 1);
      base.slot = document.getElementById('item-slot')?.value || 'body';
    }
    if (type === 'consumable') {
      base.effect = document.getElementById('item-effect')?.value || 'heal';
      base.power = Number(document.getElementById('item-power')?.value || 1);
    }

    this.content.items[id] = base;
    this.persistContent();
    this.saveContentLog('create-item', { id, type });
    showNotification('Предмет сохранён в редакторе.', NotificationType.SUCCESS);
    this.state.notify();
  }

  adminDeleteItem() {
    if (!this.isAdminUser()) return;
    const id = document.getElementById('item-id')?.value?.trim();
    if (!id) return;
    delete this.content.items[id];
    if (STATIC_ITEMS[id]) delete STATIC_ITEMS[id];
    this.persistContent();
    this.saveContentLog('delete-item', { id });
    this.state.notify();
    showNotification('Предмет удалён.', NotificationType.WARNING);
  }

  adminCreateMonster() {
    if (!this.isAdminUser()) return;
    const location = document.getElementById('monster-location')?.value;
    const key = document.getElementById('monster-key')?.value?.trim();
    const name = document.getElementById('monster-name')?.value?.trim();
    if (!location || !key || !name) return showNotification('Укажите локацию, key и имя монстра.', NotificationType.WARNING);
    const loot = [];
    document.querySelectorAll('[data-monster-loot-row]').forEach((row) => {
      const itemKey = row.querySelector('[data-item-key]')?.value;
      const chance = Number(row.querySelector('[data-item-chance]')?.value || 0);
      if (itemKey) loot.push({ itemKey, chance });
    });

    const monster = {
      key,
      name,
      icon: document.getElementById('monster-icon')?.value || '👾',
      level: Number(document.getElementById('monster-level')?.value || 1),
      hpMax: Number(document.getElementById('monster-hp')?.value || 20),
      mpMax: Number(document.getElementById('monster-mp')?.value || 0),
      minDmg: Number(document.getElementById('monster-min')?.value || 2),
      maxDmg: Number(document.getElementById('monster-max')?.value || 5),
      defense: Number(document.getElementById('monster-defense')?.value || 0),
      defaultRespawnTime: Number(document.getElementById('monster-respawn')?.value || 15),
      expReward: Number(document.getElementById('monster-exp')?.value || 10),
      lootTable: loot.slice(0, 10)
    };

    if (!this.content.monstersByLocation[location]) this.content.monstersByLocation[location] = [];
    this.content.monstersByLocation[location].push(monster);
    this.persistContent();
    this.saveContentLog('create-monster', { location, key });
    this.state.notify();
    showNotification('Монстр добавлен.', NotificationType.SUCCESS);
  }

  adminClearInventory() {
    if (!this.isAdminUser()) return;
    const username = this.ui.adminSelectedUser;
    const target = this.state.playersDB.players[username];
    if (!target) return;
    const p = new Player(target.player);
    p.normalize();
    p.inventory = [];
    target.player = p;
    this.saveAnyUser(username, target);
    this.saveContentLog('clear-inventory', { username });
    this.state.notify();
    showNotification('Инвентарь очищен.', NotificationType.WARNING);
  }

  adminAddItemToPlayer() {
    if (!this.isAdminUser()) return;
    const username = this.ui.adminSelectedUser;
    const target = this.state.playersDB.players[username];
    const key = document.getElementById('admin-item-key')?.value;
    if (!target || !key || !STATIC_ITEMS[key]) return;
    const p = new Player(target.player);
    p.normalize();
    p.inventory.push(LootItem.create(key));
    target.player = p;
    this.saveAnyUser(username, target);
    this.saveContentLog('add-item-player', { username, key });
    this.state.notify();
    showNotification('Предмет добавлен игроку.', NotificationType.SUCCESS);
  }

  closeAnyModal() { closeModal(); }
}
