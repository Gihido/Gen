function itemCard(item, actions = '') {
  return `<div class="item fancy"><div class="item-head"><span class="icon">${item.icon || '📦'}</span><b>${item.name}</b></div><div class="muted">${item.description || ''}</div><div class="muted">Тип: ${item.type} | ⚖ ${item.weight || 0} | 💰 ${item.value || 0}</div>${item.damage ? `<div class="muted">⚔ ${item.damage}</div>` : ''}${item.defense ? `<div class="muted">🛡 ${item.defense}</div>` : ''}<div class="row">${actions}</div></div>`;
}

export function renderLocationScreen({ player, location, monster, statBar, ui }) {
  const pile = player.world[player.location].lootPile;
  const mainChest = player.world.mainChest;
  const inMain = player.location === 'Главная';
  const section = ui.section || 'location';
  const respawn = monster && !monster.isAlive && monster.respawnTime ? Math.max(0, Math.ceil((monster.respawnTime - Date.now()) / 1000)) : 0;

  const contentLocation = `
    <div class="card fade-in"><h2>${player.location}</h2>
      <div class="row">${location.links.map((l) => `<button data-action="travel" data-location="${l}">→ ${l}</button>`).join('')}</div>
    </div>
    <div class="layout" style="margin-top:12px;">
      <div class="card fade-in"><h3 class="panel-title">Монстр</h3>
      ${monster ? `<div class="monster-box"><div class="monster-icon pulse">${monster.icon}</div><b>${monster.name}</b><div>HP ${monster.hp}/${monster.hpMax}</div>${monster.isAlive ? `<button data-action="startBattle">Сражаться</button>` : `<div class="muted">Респаун через ${respawn}с</div>`}</div>` : '<div class="muted">Монстров нет</div>'}
      </div>
      <div class="card fade-in"><h3 class="panel-title">Сундук локации (дроп)</h3>
      <div class="list">${pile.items.map((i) => itemCard(i, `<button data-action="pickupItem" data-source="location" data-item-id="${i.id}">Подобрать</button>`)).join('') || '<div class="muted">Пусто</div>'}</div></div>
      <div class="card fade-in"><h3 class="panel-title">Личный сундук (Главная)</h3>
      ${inMain ? `<div class="list">${mainChest.items.map((i) => itemCard(i, `<button data-action="pickupItem" data-source="main" data-item-id="${i.id}">В сумку</button>`)).join('') || '<div class="muted">Пусто</div>'}</div>` : '<div class="muted">Доступен только в Главной</div>'}
      </div>
    </div>`;

  const contentInventory = `
    <div class="card fade-in"><h2>Инвентарь</h2><div class="list">${player.inventory.map((i) => itemCard(i, `${i.type === 'consumable' ? `<button data-action="inventoryAction" data-mode="use" data-item-id="${i.id}">Использовать</button>` : ''}${['weapon', 'armor'].includes(i.type) ? `<button data-action="inventoryAction" data-mode="equip" data-item-id="${i.id}">Экипировать</button>` : ''}<button class="danger" data-action="inventoryAction" data-mode="drop" data-item-id="${i.id}">Выкинуть</button>${inMain ? `<button class="secondary" data-action="toMainChest" data-item-id="${i.id}">В сундук</button>` : ''}`)).join('') || '<div class="muted">Пусто</div>'}</div></div>`;

  const slots = ['weapon', 'head', 'body', 'legs'];
  const slotNames = { weapon: 'Оружие', head: 'Голова', body: 'Тело', legs: 'Ноги' };
  const contentCharacter = `
    <div class="card fade-in"><h2>Персонаж</h2><div class="char-photo">${player.className}</div>
    <div class="grid-slots">${slots.map((s) => `<div class="item"><b>${slotNames[s]}</b><div>${player.equippedItems[s] ? `${player.equippedItems[s].icon || '📦'} ${player.equippedItems[s].name}` : 'Пусто'}</div>${player.equippedItems[s] ? `<button data-action="unequip" data-slot="${s}">Снять</button>` : '<div class="muted">Экипируйте из сумки</div>'}</div>`).join('')}</div></div>`;

  return `
    <div class="topbar"><button class="hamburger" data-action="toggleSidebar">☰</button><h1>Aldos RPG</h1></div>
    <div class="shell ${ui.sidebarOpen ? 'open' : ''}">
      <aside class="sidebar">
        <h3>${player.username}</h3>
        <div>Класс: ${player.className}</div>
        <div>Уровень: ${player.level}</div>
        <div>EXP: ${player.experience}</div>
        <div>HP ${player.hp}/${player.hpMax}</div>${statBar(player.hp, player.hpMax, 'hp')}
        <div>MP ${player.mp}/${player.mpMax}</div>${statBar(player.mp, player.mpMax, 'mp')}
        <div>Вес: ${player.getCurrentInventoryWeight()}/${player.getMaxInventoryWeight()}</div>
        <div class="col" style="margin-top:10px;">
          <button data-action="switchSection" data-section="location">Локация</button>
          <button data-action="switchSection" data-section="inventory">Сумка</button>
          <button data-action="switchSection" data-section="character">Персонаж</button>
          <button class="danger" data-action="logout">Выход</button>
        </div>
      </aside>
      <main class="main">${section === 'inventory' ? contentInventory : section === 'character' ? contentCharacter : contentLocation}</main>
    </div>
  `;
}
