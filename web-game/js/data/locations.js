export const CLASSES = ['Воин', 'Маг', 'Лучник', 'Разбойник', 'Жрец'];
export const GENDERS = ['Мужчина', 'Женщина'];

export const LOCATION_CONFIG = {
  'Главная': {
    title: 'Главная',
    links: ['Перелесок'],
    hasChest: true,
    monsters: []
  },
  'Перелесок': {
    title: 'Перелесок',
    links: ['Главная', 'Развалины', 'Пещера'],
    hasChest: true,
    monsters: [
      {
        key: 'wolf_perelesok',
        name: 'Волк',
        icon: '🐺',
        hpMax: 10,
        mpMax: 5,
        minDmg: 2,
        maxDmg: 4,
        defaultRespawnTime: 15,
        lootKeys: ['healing_potion', 'mana_potion', 'wolf_fang']
      }
    ]
  },
  'Развалины': {
    title: 'Развалины',
    links: ['Перелесок'],
    hasChest: true,
    monsters: []
  },
  'Пещера': {
    title: 'Пещера',
    links: ['Перелесок'],
    hasChest: true,
    monsters: []
  }
};

export const DEFAULT_LOCATION_STATE = Object.fromEntries(
  Object.keys(LOCATION_CONFIG).map((name) => [name, { lootPile: { items: [] }, monsters: {} }])
);
