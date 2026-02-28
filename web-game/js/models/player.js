import { addExperienceProgress, randomInt } from '../core/utils.js';

export class Player {
  constructor(data) {
    Object.assign(this, data);
  }

  static create({ username, className, gender }) {
    return {
      username,
      className,
      gender,
      hp: 100,
      hpMax: 100,
      mp: 40,
      mpMax: 40,
      minDmg: 4,
      maxDmg: 8,
      defense: 1,
      level: 1,
      experience: 0,
      location: 'Главная',
      stats: { strength: 10, agility: 10, intelligence: 10, vitality: 10 },
      inventory: [],
      equippedItems: { weapon: null, armor: null },
      battleState: { stunnedTurns: 0, defenseActive: false },
      world: null
    };
  }

  getMaxInventoryWeight() { return 100 + this.stats.strength * 5; }
  getCurrentInventoryWeight() { return this.inventory.reduce((acc, item) => acc + (item.weight || 0), 0); }
  canCarryItem(item) { return this.getCurrentInventoryWeight() + (item.weight || 0) <= this.getMaxInventoryWeight(); }

  checkItemRequirements(item) {
    if ((item.levelRequirement || 1) > this.level) return { ok: false, reason: 'Недостаточный уровень.' };
    if (item.classRequirement && item.classRequirement !== this.className) return { ok: false, reason: 'Класс не подходит.' };
    return { ok: true };
  }

  equipItem(itemId) {
    const idx = this.inventory.findIndex((x) => x.id === itemId);
    if (idx < 0) return { ok: false, reason: 'Предмет не найден.' };
    const item = this.inventory[idx];
    if (!['weapon', 'armor'].includes(item.type)) return { ok: false, reason: 'Нельзя экипировать.' };
    const req = this.checkItemRequirements(item);
    if (!req.ok) return req;
    const slot = item.type;
    if (this.equippedItems[slot]) this.inventory.push(this.equippedItems[slot]);
    this.equippedItems[slot] = item;
    this.inventory.splice(idx, 1);
    return { ok: true };
  }

  unequipItem(slot) {
    const item = this.equippedItems[slot];
    if (!item) return { ok: false, reason: 'Слот пуст.' };
    if (!this.canCarryItem(item)) return { ok: false, reason: 'Недостаточно места.' };
    this.inventory.push(item);
    this.equippedItems[slot] = null;
    return { ok: true };
  }

  attack() {
    const weaponDmg = this.equippedItems.weapon?.damage || 0;
    return randomInt(this.minDmg, this.maxDmg) + weaponDmg;
  }

  takeDamage(dmg) {
    const armorDef = this.equippedItems.armor?.defense || 0;
    const applied = Math.max(1, dmg - this.defense - armorDef);
    this.hp -= applied;
    if (this.hp < 0) this.hp = 0;
    return { alive: this.hp > 0, damageTaken: applied };
  }

  useConsumable(consumable) {
    const idx = this.inventory.findIndex((x) => x.id === consumable.id);
    if (idx < 0 || consumable.type !== 'consumable') return { ok: false };
    if (consumable.effect === 'heal') this.hp = Math.min(this.hpMax, this.hp + (consumable.power || 0));
    if (consumable.effect === 'mana') this.mp = Math.min(this.mpMax, this.mp + (consumable.power || 0));
    this.inventory.splice(idx, 1);
    return { ok: true };
  }

  updateBattleState() {
    if (this.battleState.stunnedTurns > 0) this.battleState.stunnedTurns -= 1;
    this.battleState.defenseActive = false;
  }

  restoreHealthAndMana() { this.hp = this.hpMax; this.mp = this.mpMax; }
  addExperience(amount) { return addExperienceProgress(this, amount); }
}
