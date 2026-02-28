import { AppState } from './state.js';
import { hashPassword, NotificationType, randomInt } from './utils.js';
import { showNotification, openModal, closeModal, statBar } from './ui.js';
import { CLASSES, DEFAULT_LOCATION_STATE, GENDERS, LOCATION_CONFIG } from '../data/locations.js';
import { ITEM_KEYS } from '../data/items.js';
import { Player } from '../models/player.js';
import { LootItem, Monster } from '../models/monster.js';
import { renderAuthScreen } from '../screens/auth.js';
import { renderLocationScreen } from '../screens/location.js';
import { renderBattleScreen } from '../screens/battle.js';

export class RPGApp {
  constructor(rootId = 'app') {
    this.root = document.getElementById(rootId);
    this.state = new AppState();
    this.bindGlobalEvents();
    this.state.subscribe(() => this.render());
    this.state.load();
    setInterval(() => { if (this.state.screen === 'location' && this.state.currentUser) this.state.notify(); }, 1000);
  }

  bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (!action) return;
      const payload = e.target.dataset;
      if (this[action]) this[action](payload, e);
    });
  }

  getUser() {
    const data = this.state.userData;
    return data ? new Player(data.player) : null;
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
    if (!player.world) {
      player.world = JSON.parse(JSON.stringify(DEFAULT_LOCATION_STATE));
    }
    Object.keys(DEFAULT_LOCATION_STATE).forEach((loc) => {
      if (!player.world[loc]) player.world[loc] = { lootPile: { items: [] }, monsters: {} };
      if (!player.world[loc].lootPile) player.world[loc].lootPile = { items: [] };
      if (!player.world[loc].monsters) player.world[loc].monsters = {};
    });
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
    if (this.state.screen === 'auth') {
      this.root.innerHTML = renderAuthScreen({ classes: CLASSES, genders: GENDERS });
      return;
    }
    const player = this.getUser();
    if (!player) {
      this.state.dispatch({ type: 'LOGOUT' });
      return;
    }
    this.ensureWorld(player);
    if (this.state.screen === 'location') {
      const monster = this.getMonsterForLocation(player, player.location);
      this.saveUser(player);
      this.root.innerHTML = renderLocationScreen({ player, location: LOCATION_CONFIG[player.location], monster, statBar });
    } else if (this.state.screen === 'battle') {
      const battle = this.state.currentBattle;
      this.root.innerHTML = renderBattleScreen({ player, battle, statBar });
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
    const player = Player.create({ username, className, gender });
    const isAdmin = ['admin', 'gihido'].includes(username.toLowerCase());
    this.state.playersDB.players[username] = {
      username,
      passwordHash: hashPassword(password),
      player,
      metadata: { created: Date.now(), lastLogin: null, isBanned: false, banReason: '', isAdmin }
    };
    this.state.save();
    showNotification('Регистрация успешна.', NotificationType.SUCCESS);
  }

  logout() { this.state.dispatch({ type: 'LOGOUT' }); }

  travel({ location }) {
    const player = this.getUser();
    const monster = this.getMonsterForLocation(player, player.location);
    if (monster?.isAlive) return showNotification('Сначала победите монстра!', NotificationType.WARNING);
    player.location = location;
    this.saveUser(player);
    this.state.setScreen('location');
  }

  openChest() {
    const player = this.getUser();
    const pile = player.world[player.location].lootPile;
    if (pile.items.length > 0) return showNotification('В сундуке уже есть добыча.', NotificationType.INFO);
    const count = randomInt(1, 2);
    for (let i = 0; i < count; i++) {
      const key = ITEM_KEYS[randomInt(0, ITEM_KEYS.length - 1)];
      pile.items.push(LootItem.create(key));
    }
    this.saveUser(player);
    this.state.setScreen('location');
  }

  pickupItem({ itemId }) {
    const player = this.getUser();
    const pile = player.world[player.location].lootPile;
    const idx = pile.items.findIndex((x) => x.id === itemId);
    if (idx < 0) return;
    const item = pile.items[idx];
    if (!player.canCarryItem(item)) return showNotification('Перевес! Нельзя подобрать.', NotificationType.WARNING);
    player.inventory.push(item);
    pile.items.splice(idx, 1);
    this.saveUser(player);
    this.state.setScreen('location');
  }

  showInventory() {
    const player = this.getUser();
    const html = `
      <h2>Сумка</h2>
      <div class="row">
        <input id="inv-search" placeholder="Поиск по имени" />
        <select id="inv-filter"><option value="all">Все</option><option value="weapon">Оружие</option><option value="armor">Броня</option><option value="consumable">Расходники</option></select>
        <select id="inv-sort"><option value="name">Сорт: имя</option><option value="weight">Сорт: вес</option><option value="value">Сорт: цена</option></select>
      </div>
      <div id="inv-list" class="list"></div>
      <button data-action="closeAnyModal" class="secondary">Закрыть</button>
    `;
    openModal(html);
    const renderInv = () => {
      const search = (document.getElementById('inv-search').value || '').toLowerCase();
      const filter = document.getElementById('inv-filter').value;
      const sort = document.getElementById('inv-sort').value;
      const items = [...player.inventory]
        .filter((i) => (filter === 'all' ? true : i.type === filter))
        .filter((i) => i.name.toLowerCase().includes(search))
        .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : (a[sort] || 0) - (b[sort] || 0)));
      document.getElementById('inv-list').innerHTML = items.map((i) => `
        <div class="item" title="${i.description || ''}">
          <b>${i.name}</b> <span class="muted">(${i.type})</span> ⚖${i.weight || 0}
          <div class="row">
            ${i.type === 'consumable' ? `<button data-action="inventoryAction" data-mode="use" data-item-id="${i.id}">Использовать</button>` : ''}
            ${['weapon','armor'].includes(i.type) ? `<button data-action="inventoryAction" data-mode="equip" data-item-id="${i.id}">Экипировать</button>` : ''}
            <button class="danger" data-action="inventoryAction" data-mode="drop" data-item-id="${i.id}">Выбросить</button>
          </div>
        </div>
      `).join('') || '<div class="muted">Пусто.</div>';
    };
    renderInv();
    ['inv-search', 'inv-filter', 'inv-sort'].forEach((id) => document.getElementById(id).addEventListener('input', renderInv));
  }

  showCharacterInfo() {
    const player = this.getUser();
    openModal(`
      <h2>Профиль ${player.username}</h2>
      <div class="item">Класс: ${player.className}, Пол: ${player.gender}, Ур: ${player.level}</div>
      <div class="item">Оружие: ${player.equippedItems.weapon?.name || '—'} <button data-action="unequip" data-slot="weapon">Снять</button></div>
      <div class="item">Броня: ${player.equippedItems.armor?.name || '—'} <button data-action="unequip" data-slot="armor">Снять</button></div>
      <button data-action="closeAnyModal" class="secondary">Закрыть</button>
    `);
  }

  closeAnyModal() { closeModal(); }

  inventoryAction({ mode, itemId }) {
    const player = this.getUser();
    const item = player.inventory.find((x) => x.id === itemId);
    if (!item) return;
    if (mode === 'use') player.useConsumable(item);
    if (mode === 'equip') {
      const res = player.equipItem(item.id);
      if (!res.ok) return showNotification(res.reason, NotificationType.WARNING);
    }
    if (mode === 'drop') {
      player.inventory = player.inventory.filter((x) => x.id !== item.id);
      player.world[player.location].lootPile.items.push(item);
    }
    this.saveUser(player);
    this.showInventory();
  }

  unequip({ slot }) {
    const player = this.getUser();
    const res = player.unequipItem(slot);
    if (!res.ok) return showNotification(res.reason, NotificationType.WARNING);
    this.saveUser(player);
    this.showCharacterInfo();
  }

  startBattle() {
    const player = this.getUser();
    const monster = this.getMonsterForLocation(player, player.location);
    if (!monster?.isAlive) return showNotification('Монстра нет.', NotificationType.INFO);
    this.state.dispatch({ type: 'START_BATTLE', payload: { monster: monster.toJSON(), log: ['Бой начался!'] } });
  }

  battleAction({ mode }) {
    const player = this.getUser();
    const battle = this.state.currentBattle;
    const mcfg = LOCATION_CONFIG[player.location].monsters[0];
    const monster = new Monster(mcfg, battle.monster);
    const log = battle.log;

    const doMonsterAttack = () => {
      if (!monster.isAlive) return;
      let raw = monster.attack();
      if (player.battleState.defenseActive) raw = Math.floor(raw / 2);
      const res = player.takeDamage(raw);
      log.push(`${monster.name} наносит ${res.damageTaken} урона.`);
      player.updateBattleState();
      if (!res.alive) {
        player.restoreHealthAndMana();
        log.push('Вы проиграли бой и восстановили силы.');
        this.finishBattle(player, monster, log, false);
        return true;
      }
      return false;
    };

    if (mode === 'attack') {
      const dmg = player.attack();
      monster.takeDamage(dmg);
      log.push(`Вы атаковали на ${dmg}.`);
    }
    if (mode === 'magic') {
      const manaCost = 8;
      if (player.mp < manaCost) return showNotification('Недостаточно маны.', NotificationType.WARNING);
      player.mp -= manaCost;
      const dmg = player.attack() + randomInt(4, 10);
      monster.takeDamage(dmg);
      log.push(`Магический удар: ${dmg}.`);
    }
    if (mode === 'defense') {
      player.battleState.defenseActive = true;
      log.push('Вы приготовились к защите.');
    }
    if (mode === 'item') {
      const consumable = player.inventory.find((x) => x.type === 'consumable');
      if (!consumable) return showNotification('Нет расходников.', NotificationType.WARNING);
      player.useConsumable(consumable);
      log.push(`Использован предмет: ${consumable.name}.`);
    }
    if (mode === 'escape') {
      if (randomInt(1, 100) <= 45) {
        log.push('Вы успешно сбежали!');
        this.finishBattle(player, monster, log, null);
        return;
      }
      log.push('Побег не удался!');
    }

    if (!monster.isAlive) {
      const exp = monster.expReward;
      const lv = player.addExperience(exp);
      const loot = monster.generateLoot();
      player.world[player.location].lootPile.items.push(...loot);
      log.push(`Победа! +${exp} опыта, лут: ${loot.map((i) => i.name).join(', ') || 'нет'}.`);
      if (lv > 0) log.push(`Повышение уровня! +${lv}`);
      this.finishBattle(player, monster, log, true);
      return;
    }

    if (doMonsterAttack()) return;

    this.state.currentBattle = { monster: monster.toJSON(), log };
    this.saveUser(player);
    this.state.notify();
  }

  finishBattle(player, monster, log, victory) {
    player.world[player.location].monsters[monster.key] = monster.toJSON();
    this.saveUser(player);
    this.state.currentBattle = { monster: monster.toJSON(), log };
    if (victory === true) showNotification('Победа!', NotificationType.SUCCESS);
    if (victory === false) showNotification('Поражение!', NotificationType.ERROR);
    this.state.dispatch({ type: 'END_BATTLE' });
  }
}
