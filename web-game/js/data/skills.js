export const SKILL_LIBRARY = {
  power_strike: {
    id: 'power_strike',
    name: 'Силовой удар',
    icon: '💥',
    description: 'Мощная атака по врагу.',
    manaCost: 6,
    effect: { type: 'damage', value: 8 }
  },
  first_aid: {
    id: 'first_aid',
    name: 'Первая помощь',
    icon: '🩹',
    description: 'Лечит героя в бою.',
    manaCost: 5,
    effect: { type: 'heal', value: 18 }
  },
  arcane_bolt: {
    id: 'arcane_bolt',
    name: 'Чародейский заряд',
    icon: '✨',
    description: 'Магический урон одной цели.',
    manaCost: 8,
    effect: { type: 'damage', value: 12 }
  }
};

export const DEFAULT_UNLOCKED_SKILLS = ['power_strike'];
