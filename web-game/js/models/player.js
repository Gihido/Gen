import { addExperienceProgress, randomInt } from '../core/utils.js';
import { DEFAULT_UNLOCKED_SKILLS, SKILL_LIBRARY } from '../data/skills.js';

export class Player {
  constructor(data) { Object.assign(this, data); }

  static create({ username, className, gender }) {
    return {
      username, className, gender,
      hp: 100, hpMax: 100, mp: 40, mpMax: 40,
      minDmg: 4, maxDmg: 8, defense: 1,
      level: 1, experience: 0, location: 'Главная',
      stats: { strength: 10, agility: 10, intelligence: 10, vitality: 10 },
      inventory: [],
      equippedItems: { weapon: null, head: null, body: null, legs: null },
      battleState: { stunnedTurns: 0, defenseActive: false },
      skills: { unlocked: [...DEFAULT_UNLOCKED_SKILLS], equipped: [DEFAULT_UNLOCKED_SKILLS[0], null, null] },
      world: null,
      avatar: className
    };
  }

  normalize() {
    if (!this.equippedItems) this.equippedItems = { weapon: null, head: null, body: null, legs: null };
    if (this.equippedItems.armor && !this.equippedItems.body) {
      this.equippedItems.body = this.equippedItems.armor;
      delete this.equippedItems.armor;
    }
    ['weapon', 'head', 'body', 'legs'].forEach((s) => { if (this.equippedItems[s] === undefined) this.equippedItems[s] = null; });
    if (!this.skills) this.skills = { unlocked: [...DEFAULT_UNLOCKED_SKILLS], equipped: [DEFAULT_UNLOCKED_SKILLS[0], null, null] };
    if (!Array.isArray(this.skills.unlocked)) this.skills.unlocked = [...DEFAULT_UNLOCKED_SKILLS];
    if (!Array.isArray(this.skills.equipped)) this.skills.equipped = [null, null, null];
    while (this.skills.equipped.length < 3) this.skills.equipped.push(null);
  }

  getMaxInventoryWeight() { return 100 + this.stats.strength * 5; }
  getCurrentInventoryWeight() { return this.inventory.reduce((a, i) => a + (i.weight || 0), 0); }
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
    const slot = item.type === 'weapon' ? 'weapon' : (item.slot || 'body');
    const req = this.checkItemRequirements(item);
    if (!req.ok) return req;
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

  equipSkill(skillId) {
    if (!this.skills.unlocked.includes(skillId)) return { ok: false, reason: 'Умение не разблокировано.' };
    if (this.skills.equipped.includes(skillId)) return { ok: false, reason: 'Умение уже экипировано.' };
    const slot = this.skills.equipped.findIndex((s) => !s);
    if (slot < 0) return { ok: false, reason: 'Нет свободного слота умения.' };
    this.skills.equipped[slot] = skillId;
    return { ok: true };
  }

  unequipSkill(slot) {
    if (!this.skills.equipped[slot]) return { ok: false, reason: 'Слот пуст.' };
    this.skills.equipped[slot] = null;
    return { ok: true };
  }

  useSkill(skillId, monster) {
    if (!this.skills.unlocked.includes(skillId)) return { ok: false, reason: 'Умение не разблокировано.' };
    const skill = SKILL_LIBRARY[skillId];
    if (!skill) return { ok: false, reason: 'Умение не найдено.' };
    const manaCost = skill.manaCost || 0;
    if (this.mp < manaCost) return { ok: false, reason: 'Недостаточно маны.' };
    this.mp -= manaCost;

    if (skill.effect?.type === 'heal') {
      const value = skill.effect.value || 0;
      this.hp = Math.min(this.hpMax, this.hp + value);
      return { ok: true, log: `${skill.icon || '✨'} ${skill.name}: восстановлено ${value} HP.` };
    }

    const bonusDamage = skill.effect?.value || 0;
    const dmg = this.attack() + bonusDamage;
    if (monster) monster.takeDamage(dmg);
    return { ok: true, log: `${skill.icon || '✨'} ${skill.name}: нанесено ${dmg} урона.` };
  }

  attack() { return randomInt(this.minDmg, this.maxDmg) + (this.equippedItems.weapon?.damage || 0); }

  takeDamage(dmg) {
    const armorDef = ['head', 'body', 'legs'].reduce((a, s) => a + (this.equippedItems[s]?.defense || 0), 0);
    const applied = Math.max(1, dmg - this.defense - armorDef);
    this.hp = Math.max(0, this.hp - applied);
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

  updateBattleState() { if (this.battleState.stunnedTurns > 0) this.battleState.stunnedTurns -= 1; this.battleState.defenseActive = false; }
  restoreHealthAndMana() { this.hp = this.hpMax; this.mp = this.mpMax; }
  addExperience(amount) { return addExperienceProgress(this, amount); }
}
