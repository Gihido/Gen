import { generateId, randomInt } from '../core/utils.js';
import { STATIC_ITEMS } from '../data/items.js';

export class LootItem {
  static create(baseKey) {
    const base = STATIC_ITEMS[baseKey];
    if (!base) return null;
    return {
      ...base,
      id: generateId(baseKey),
      rarity: base.rarity || 'common',
      weight: base.weight ?? 1,
      value: base.value ?? 1
    };
  }
}

export class Monster {
  constructor(config, persisted = {}) {
    this.key = config.key;
    this.name = config.name;
    this.icon = config.icon;
    this.hpMax = persisted.hpMax ?? config.hpMax;
    this.mpMax = persisted.mpMax ?? config.mpMax;
    this.hp = persisted.hp ?? config.hpMax;
    this.mp = persisted.mp ?? config.mpMax;
    this.minDmg = config.minDmg;
    this.maxDmg = config.maxDmg;
    this.defaultRespawnTime = config.defaultRespawnTime;
    this.lootKeys = config.lootKeys || [];
    this.respawnTime = persisted.respawnTime || null;
    this.isAlive = persisted.isAlive ?? true;
    this.expReward = Math.floor(this.hpMax / 2 + this.maxDmg * 2);
    this.tryRespawn();
  }

  toJSON() {
    return { key: this.key, hp: this.hp, hpMax: this.hpMax, mp: this.mp, mpMax: this.mpMax, respawnTime: this.respawnTime, isAlive: this.isAlive };
  }

  tryRespawn() {
    if (!this.isAlive && this.respawnTime && Date.now() >= this.respawnTime) {
      this.isAlive = true;
      this.hp = this.hpMax;
      this.mp = this.mpMax;
      this.respawnTime = null;
    }
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
      this.respawnTime = Date.now() + this.defaultRespawnTime * 1000;
    }
    return this.isAlive;
  }

  attack() { return randomInt(this.minDmg, this.maxDmg); }

  generateLoot() {
    const count = randomInt(1, 2);
    const result = [];
    for (let i = 0; i < count; i++) {
      const key = this.lootKeys[randomInt(0, this.lootKeys.length - 1)];
      const item = LootItem.create(key);
      if (item) result.push(item);
    }
    return result;
  }
}
