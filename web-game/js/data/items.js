export const STATIC_ITEMS = {
  healing_potion: { key: 'healing_potion', name: 'Зелье лечения', type: 'consumable', effect: 'heal', power: 30, value: 15, weight: 1, rarity: 'common', description: 'Восстанавливает здоровье.' },
  mana_potion: { key: 'mana_potion', name: 'Зелье маны', type: 'consumable', effect: 'mana', power: 25, value: 15, weight: 1, rarity: 'common', description: 'Восстанавливает ману.' },
  wolf_fang: { key: 'wolf_fang', name: 'Клык волка', type: 'weapon', damage: 3, value: 18, weight: 2, rarity: 'common', levelRequirement: 1, classRequirement: null, description: 'Трофейный клык, заточенный под клинок.' },
  leather_armor: { key: 'leather_armor', name: 'Кожаная броня', type: 'armor', defense: 2, value: 25, weight: 4, rarity: 'common', levelRequirement: 1, classRequirement: null, description: 'Лёгкая защита для путешествий.' }
};

export const ITEM_KEYS = Object.keys(STATIC_ITEMS);
