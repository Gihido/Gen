export const STATIC_ITEMS = {
  healing_potion: { key: 'healing_potion', name: 'Зелье лечения', icon: '🧪', type: 'consumable', effect: 'heal', power: 30, value: 15, weight: 1, rarity: 'common', description: 'Восстанавливает здоровье.' },
  mana_potion: { key: 'mana_potion', name: 'Зелье маны', icon: '🔷', type: 'consumable', effect: 'mana', power: 25, value: 15, weight: 1, rarity: 'common', description: 'Восстанавливает ману.' },
  wolf_fang: { key: 'wolf_fang', name: 'Клык волка', icon: '🦷', type: 'weapon', slot: 'weapon', damage: 3, value: 18, weight: 2, rarity: 'common', levelRequirement: 1, classRequirement: null, description: 'Трофейный клык, заточенный под клинок.' },
  leather_helmet: { key: 'leather_helmet', name: 'Кожаный шлем', icon: '🪖', type: 'armor', slot: 'head', defense: 1, value: 20, weight: 2, rarity: 'common', levelRequirement: 1, description: 'Защищает голову.' },
  leather_armor: { key: 'leather_armor', name: 'Кожаный доспех', icon: '🥋', type: 'armor', slot: 'body', defense: 2, value: 25, weight: 4, rarity: 'common', levelRequirement: 1, description: 'Лёгкая защита для путешествий.' },
  leather_legs: { key: 'leather_legs', name: 'Кожаные поножи', icon: '👖', type: 'armor', slot: 'legs', defense: 1, value: 22, weight: 3, rarity: 'common', levelRequirement: 1, description: 'Защита ног.' }
};

export const ITEM_KEYS = Object.keys(STATIC_ITEMS);
