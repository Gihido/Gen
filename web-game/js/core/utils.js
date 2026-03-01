export const NotificationType = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

// Небезопасно для реальной прод-системы. Только для офлайн localStorage-режима игры.
export const hashPassword = (raw) => btoa(unescape(encodeURIComponent(`${raw}_aldos_salt`)));

export const getExpToNextLevel = (level) => 50 + level * 35;

export function addExperienceProgress(player, amount) {
  player.experience += amount;
  let leveledUp = 0;
  while (player.experience >= getExpToNextLevel(player.level)) {
    player.experience -= getExpToNextLevel(player.level);
    player.level += 1;
    player.stats.strength += 1;
    player.stats.agility += 1;
    player.stats.intelligence += 1;
    player.stats.vitality += 2;
    player.hpMax += 12;
    player.mpMax += 6;
    player.hp = player.hpMax;
    player.mp = player.mpMax;
    player.minDmg += 1;
    player.maxDmg += 2;
    leveledUp += 1;
  }
  return leveledUp;
}
