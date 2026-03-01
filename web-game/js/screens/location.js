function itemCard(item, actions = '') {
  const rarity = item.rarity ? `<span class="rarity ${item.rarity}">${item.rarity}</span>` : '';
  return `
    <article class="item-card">
      <div class="item-card__head">
        <span class="item-card__icon">${item.icon || '📦'}</span>
        <div>
          <h4>${item.name}</h4>
          <div class="muted">${item.description || 'Без описания'}</div>
        </div>
        ${rarity}
      </div>
      <div class="item-card__stats muted">
        <span>Тип: ${item.type}</span>
        <span>⚖ ${item.weight || 0}</span>
        <span>💰 ${item.value || 0}</span>
        ${item.damage ? `<span>⚔ ${item.damage}</span>` : ''}
        ${item.defense ? `<span>🛡 ${item.defense}</span>` : ''}
      </div>
      <div class="row">${actions}</div>
    </article>
  `;
}

function statTile(title, current, max, cls, statBar) {
  return `<section class="stat-tile ${cls}"><div class="stat-tile__title">${title}</div><div class="stat-tile__value">${current}/${max}</div>${statBar(current, max, cls)}</section>`;
}

function skillCard(skill, unlocked, equipped) {
  return `
    <article class="skill-card ${unlocked ? 'unlocked' : 'locked'}">
      <h4>${skill.icon || '✨'} ${skill.name}</h4>
      <div class="muted">${skill.description || ''}</div>
      <div class="muted">MP: ${skill.manaCost || 0}</div>
      <div class="row">
        ${unlocked ? (equipped ? '<span class="tag">Экипировано</span>' : `<button data-action="equipSkill" data-skill-id="${skill.id}">Экипировать</button>`) : '<span class="tag locked">Заблокировано</span>'}
      </div>
    </article>
  `;
}

function renderAdminPanel({ playersDB, selectedAdminUser, ui, items }) {
  const users = Object.keys(playersDB.players || {});
  const selected = playersDB.players[selectedAdminUser] || playersDB.players[users[0]];
  if (!selected) return '<div class="game-panel"><h2>Админ панель</h2><div class="muted">Нет игроков.</div></div>';

  const p = selected.player;
  const itemKeys = Object.keys(items);

  const tabs = `
    <div class="row admin-tabs">
      <button data-action="switchAdminTab" data-tab="players" class="${ui.adminTab === 'players' ? 'ok' : 'secondary'}">Редактор игроков</button>
      <button data-action="switchAdminTab" data-tab="items" class="${ui.adminTab === 'items' ? 'ok' : 'secondary'}">Редактор предметов</button>
      <button data-action="switchAdminTab" data-tab="locations" class="${ui.adminTab === 'locations' ? 'ok' : 'secondary'}">Редактор локаций</button>
      <button data-action="switchAdminTab" data-tab="skills" class="${ui.adminTab === 'skills' ? 'ok' : 'secondary'}">Редактор умений</button>
    </div>
  `;

  const playersTab = `
    <section class="panel-box">
      <h3>👥 Редактор игроков</h3>
      <div class="row">
        <select>${users.map((u) => `<option ${u === selectedAdminUser ? 'selected' : ''}>${u}</option>`).join('')}</select>
        ${users.map((u) => `<button class="secondary" data-action="adminSelectUser" data-username="${u}">${u}</button>`).join('')}
      </div>
      <div class="admin-grid">
        <label>HP <input id="admin-hp" type="number" value="${p.hp}" /></label>
        <label>HP Max <input id="admin-hpmax" type="number" value="${p.hpMax}" /></label>
        <label>MP <input id="admin-mp" type="number" value="${p.mp}" /></label>
        <label>MP Max <input id="admin-mpmax" type="number" value="${p.mpMax}" /></label>
        <label>Уровень <input id="admin-level" type="number" value="${p.level}" /></label>
      </div>
      <div class="row">
        <button data-action="adminSaveStats">Сохранить характеристики</button>
        <button class="danger" data-action="adminToggleBan">${selected.metadata?.isBanned ? 'Разблокировать' : 'Заблокировать'}</button>
      </div>
    </section>
  `;

  const itemsTab = `
    <section class="panel-box">
      <h3>📦 Редактор предметов</h3>
      <div class="row">
        <select id="admin-item-key">${itemKeys.map((key) => `<option value="${key}">${key}</option>`).join('')}</select>
        <button data-action="adminAddItemToPlayer">+ Добавить игроку</button>
        <button class="danger" data-action="adminClearInventory">Очистить инвентарь</button>
      </div>
      <div class="muted">Вы можете расширять список предметов в файле ` + '`web-game/js/data/items.js`' + `.</div>
    </section>
  `;

  const locationsTab = `<section class="panel-box"><h3>📍 Редактор локаций</h3><div class="muted">Базовый редактор активирован. Для глубокого редактирования меняйте ` + '`web-game/js/data/locations.js`' + `.</div></section>`;
  const skillsTab = `<section class="panel-box"><h3>✨ Редактор умений</h3><div class="muted">Добавляйте/изменяйте умения в ` + '`web-game/js/data/skills.js`' + `.</div></section>`;

  return `
    <div class="game-panel fade-in">
      <header class="section-head"><h2>🛠 Контекстный редактор</h2></header>
      ${tabs}
      ${ui.adminTab === 'items' ? itemsTab : ui.adminTab === 'locations' ? locationsTab : ui.adminTab === 'skills' ? skillsTab : playersTab}
    </div>
  `;
}

export function renderLocationScreen({ player, location, monster, statBar, ui, isAdmin, selectedAdminUser, playersDB, skills, items }) {
  const pile = player.world[player.location].lootPile;
  const mainChest = player.world.mainChest;
  const inMain = player.location === 'Главная';
  const section = ui.section || 'location';
  const respawn = monster && !monster.isAlive && monster.respawnTime ? Math.max(0, Math.ceil((monster.respawnTime - Date.now()) / 1000)) : 0;

  const contentLocation = `
    <div class="game-panel fade-in">
      <header class="section-head">
        <h2>📍 ${player.location}</h2>
        <div class="row">${location.links.map((l) => `<button class="nav-btn" data-action="travel" data-location="${l}">→ ${l}</button>`).join('')}</div>
      </header>
      <div class="location-grid">
        <section class="panel-box">
          <h3>Монстр</h3>
          ${monster ? `<div class="monster-box ${monster.isAlive ? '' : 'dead'}"><div class="monster-icon">${monster.icon}</div><div class="monster-name">${monster.name}</div><div class="muted">HP ${monster.hp}/${monster.hpMax}</div>${monster.isAlive ? '<button class="ok" data-action="startBattle">⚔ Сражаться</button>' : `<div class="muted">Респаун через <span data-countdown-to="${monster.respawnTime}">${respawn}</span>с</div>`}</div>` : '<div class="muted">Монстров нет</div>'}
        </section>
        <section class="panel-box"><h3>Сундук локации</h3><div class="list">${pile.items.map((i) => itemCard(i, `<button data-action="pickupItem" data-source="location" data-item-id="${i.id}">Подобрать</button>`)).join('') || '<div class="muted">Пусто</div>'}</div></section>
        <section class="panel-box"><h3>Личный сундук</h3>${inMain ? `<div class="list">${mainChest.items.map((i) => itemCard(i, `<button data-action="pickupItem" data-source="main" data-item-id="${i.id}">В сумку</button>`)).join('') || '<div class="muted">Пусто</div>'}</div>` : '<div class="muted">Доступен только в Главной</div>'}</section>
      </div>
    </div>`;

  const contentInventory = `<div class="game-panel fade-in"><header class="section-head"><h2>🎒 Сумка инвентаря</h2></header><div class="list">${player.inventory.map((i) => itemCard(i, `${i.type === 'consumable' ? `<button data-action="inventoryAction" data-mode="use" data-item-id="${i.id}">Использовать</button>` : ''}${['weapon', 'armor'].includes(i.type) ? `<button data-action="inventoryAction" data-mode="equip" data-item-id="${i.id}">Экипировать</button>` : ''}<button class="danger" data-action="inventoryAction" data-mode="drop" data-item-id="${i.id}">Выкинуть</button>${inMain ? `<button class="secondary" data-action="toMainChest" data-item-id="${i.id}">В сундук</button>` : ''}`)).join('') || '<div class="muted">Сумка пуста</div>'}</div></div>`;

  const slots = ['weapon', 'head', 'body', 'legs'];
  const slotNames = { weapon: 'Оружие', head: 'Голова', body: 'Тело', legs: 'Ноги' };
  const contentCharacter = `<div class="game-panel fade-in"><header class="section-head"><h2>👤 Персонаж</h2></header><div class="character-hero">${player.className}</div><div class="equipment-grid">${slots.map((s) => `<div class="equip-slot"><h4>${slotNames[s]}</h4><div>${player.equippedItems[s] ? `${player.equippedItems[s].icon || '📦'} ${player.equippedItems[s].name}` : 'Пусто'}</div>${player.equippedItems[s] ? `<button data-action="unequip" data-slot="${s}">Снять</button>` : '<div class="muted">Экипируйте из сумки</div>'}</div>`).join('')}</div></div>`;

  const unlocked = player.skills.unlocked;
  const equipped = player.skills.equipped;
  const contentSkills = `
    <div class="game-panel fade-in">
      <header class="section-head"><h2>✨ Система умений</h2></header>
      <section class="panel-box">
        <h3>Экипированные умения</h3>
        <div class="skill-slots">
          ${equipped.map((id, idx) => `<div class="equip-slot"><h4>Слот ${idx + 1}</h4>${id && skills[id] ? `<div>${skills[id].icon || '✨'} ${skills[id].name}</div><button data-action="unequipSkill" data-slot="${idx}">Снять</button>` : '<div class="muted">Пусто</div>'}</div>`).join('')}
        </div>
      </section>
      <section class="panel-box">
        <h3>Доступные и заблокированные умения</h3>
        <div class="list">${Object.values(skills).map((s) => skillCard(s, unlocked.includes(s.id), equipped.includes(s.id))).join('')}</div>
      </section>
    </div>
  `;

  const contentAdmin = renderAdminPanel({ playersDB, selectedAdminUser, ui, items });

  return `
    <div class="topbar"><button class="hamburger" data-action="toggleSidebar">☰</button><h1>ALDOS RPG</h1></div>
    <div class="shell ${ui.sidebarOpen ? 'open' : ''}">
      <aside class="sidebar">
        <div class="sidebar-head"><h3>Игрок</h3><button class="secondary" data-action="toggleSidebar">✕</button></div>
        ${statTile('HP', player.hp, player.hpMax, 'hp', statBar)}
        ${statTile('MP', player.mp, player.mpMax, 'mp', statBar)}
        <div class="meta-card"><div><b>Имя:</b> ${player.username}</div><div><b>Класс:</b> ${player.className}</div><div><b>Уровень:</b> ${player.level}</div><div><b>Опыт:</b> ${player.experience}</div><div><b>Вес:</b> ${player.getCurrentInventoryWeight()}/${player.getMaxInventoryWeight()}</div></div>
        <div class="col">
          <button data-action="switchSection" data-section="location">Локация</button>
          <button data-action="switchSection" data-section="inventory">Сумка</button>
          <button data-action="switchSection" data-section="character">Персонаж</button>
          <button data-action="switchSection" data-section="skills">Умения</button>
          ${isAdmin ? '<button data-action="switchSection" data-section="admin">⚡ Админ панель</button>' : ''}
          <button class="danger" data-action="logout">Выход</button>
        </div>
      </aside>
      <main class="main">${section === 'inventory' ? contentInventory : section === 'character' ? contentCharacter : section === 'skills' ? contentSkills : section === 'admin' && isAdmin ? contentAdmin : contentLocation}</main>
    </div>
  `;
}
