import { CLASSES, LOCATION_CONFIG } from '../data/locations.js';
import { getExpToNextLevel } from '../core/utils.js';

function itemCard(item, actions = '') {
  const stats = [];
  if (item.damage) stats.push(`⚔ ${item.damage}`);
  if (item.defense) stats.push(`🛡 ${item.defense}`);
  if (item.levelRequirement) stats.push(`⭐ ${item.levelRequirement}`);
  if (item.classRequirement) stats.push(`🎓 ${item.classRequirement}`);
  return `
    <article class="item-card">
      <div class="item-card__head">
        <span class="item-card__icon">${item.icon || '📦'}</span>
        <div>
          <h4>${item.name}</h4>
          <div class="muted">${item.description || 'Без описания'}</div>
        </div>
        <span class="rarity ${item.rarity || 'common'}">${item.rarity || 'common'}</span>
      </div>
      <div class="item-card__stats muted"><span>${item.type}</span><span>⚖ ${item.weight || 0}</span><span>💰 ${item.value || 0}</span>${stats.map((s) => `<span>${s}</span>`).join('')}</div>
      <div class="row">${actions}</div>
    </article>
  `;
}

function statTile(title, current, max, cls, statBar, valueId, barAttr) {
  return `<section class="stat-tile ${cls}"><div class="stat-tile__title">${title}</div><div class="stat-tile__value" id="${valueId}">${current}/${max}</div>${statBar(current, max, cls).replace(`class=\"${cls}\"`, `class=\"${cls}\" ${barAttr}`)}</section>`;
}

function skillCard(skill, unlocked, equipped) {
  return `<article class="skill-card ${unlocked ? 'unlocked' : 'locked'}"><h4>${skill.icon || '✨'} ${skill.name}</h4><div class="muted">${skill.description || ''}</div><div class="muted">MP: ${skill.manaCost || 0} | Ур: ${skill.levelRequirement || 1}</div><div class="row">${unlocked ? (equipped ? '<span class="tag">Экипировано</span>' : `<button data-action="equipSkill" data-skill-id="${skill.id}">Экипировать</button>`) : '<span class="tag locked">Заблокировано</span>'}</div></article>`;
}

function adminItemEditor(items, ui) {
  const type = ui.adminItemType || 'weapon';
  const typeFields = type === 'weapon'
    ? `<label>Урон<input id="item-damage" type="number" value="8" /></label>`
    : type === 'armor'
      ? `<label>Броня<input id="item-defense" type="number" value="3" /></label><label>Слот<select id="item-slot"><option value="head">Голова</option><option value="body">Тело</option><option value="legs">Ноги</option></select></label>`
      : `<label>Эффект<select id="item-effect"><option value="heal">Лечение HP</option><option value="mana">Лечение MP</option></select></label><label>Сила эффекта<input id="item-power" type="number" value="15" /></label>`;

  return `
    <section class="panel-box">
      <h3>🧰 Редактор вещей</h3>
      <div class="admin-grid">
        <label>ID<input id="item-id" placeholder="new_item" /></label>
        <label>Название<input id="item-name" placeholder="Новый предмет" /></label>
        <label>Иконка<input id="item-icon" placeholder="🗡" /></label>
        <label>Тип
          <select id="item-type" data-change-action="adminItemTypeChange">
            <option value="weapon" ${type === 'weapon' ? 'selected' : ''}>Оружие</option>
            <option value="armor" ${type === 'armor' ? 'selected' : ''}>Броня</option>
            <option value="consumable" ${type === 'consumable' ? 'selected' : ''}>Расходник</option>
          </select>
        </label>
        <label>Редкость<select id="item-rarity"><option>common</option><option>rare</option><option>epic</option></select></label>
        <label>Класс<select id="item-class"><option value="">Любой</option>${CLASSES.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <label>Уровень<input id="item-level" type="number" value="1" /></label>
        <label>Вес<input id="item-weight" type="number" value="1" step="0.1" /></label>
        <label>Цена<input id="item-value" type="number" value="1" /></label>
        <label>Описание<input id="item-desc" placeholder="Описание" /></label>
        ${typeFields}
      </div>
      <div class="row"><button data-action="adminCreateItem">Сохранить предмет</button><button class="danger" data-action="adminDeleteItem">Удалить предмет</button></div>
      <div class="muted">Ключи: ${Object.keys(items).slice(0, 18).join(', ')}${Object.keys(items).length > 18 ? '...' : ''}</div>
    </section>
  `;
}

function adminMonsterEditor(items, ui) {
  const location = ui.adminMonsterLocation || 'Главная';
  const currentMonsters = LOCATION_CONFIG[location]?.monsters || [];
  const itemKeys = Object.keys(items);

  const list = currentMonsters.length
    ? `<div class="list">${currentMonsters.map((m) => `<div class="item-card"><b>${m.icon || '👾'} ${m.name}</b><div class="muted">${m.key} | ур ${m.level || 1} | dmg ${m.minDmg}-${m.maxDmg}</div><div class="row"><button class="secondary" data-action="adminLoadMonster" data-location="${location}" data-key="${m.key}">Загрузить в форму</button></div></div>`).join('')}</div>`
    : '<div class="muted">Монстров в локации пока нет.</div>';

  const lootRows = Array.from({ length: 10 }, (_, i) => `<div class="row" data-monster-loot-row><select data-item-key><option value="">Без предмета</option>${itemKeys.map((k) => `<option value="${k}">${k}</option>`).join('')}</select><input data-item-chance type="number" min="0" max="100" value="${Math.max(0, 20 - i * 2)}" /></div>`).join('');

  return `
    <section class="panel-box">
      <h3>👾 Редактор монстров</h3>
      <div class="admin-grid">
        <label>Локация<select id="monster-location" data-change-action="adminMonsterLocationChange">${Object.keys(LOCATION_CONFIG).map((l) => `<option ${l === location ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label>Key<input id="monster-key" placeholder="new_monster" /></label>
        <label>Имя<input id="monster-name" placeholder="Новый монстр" /></label>
        <label>Иконка<select id="monster-icon"><option>🐺</option><option>🕷️</option><option>🧟</option><option>🐉</option><option>🦂</option><option>👹</option></select></label>
        <label>Уровень<input id="monster-level" type="number" value="1" /></label>
        <label>Защита<input id="monster-defense" type="number" value="0" /></label>
        <label>HP<input id="monster-hp" type="number" value="20" /></label>
        <label>MP<input id="monster-mp" type="number" value="0" /></label>
        <label>Мин урон<input id="monster-min" type="number" value="2" /></label>
        <label>Макс урон<input id="monster-max" type="number" value="5" /></label>
        <label>EXP<input id="monster-exp" type="number" value="12" /></label>
        <label>Респавн сек<input id="monster-respawn" type="number" value="15" /></label>
      </div>
      <h4>Лут-таблица (до 10)</h4>
      <div class="list">${lootRows}</div>
      <div class="row"><button data-action="adminCreateMonster">Сохранить монстра</button><button class="danger" data-action="adminDeleteMonster">Удалить по key</button></div>
      <h4>Текущие монстры (${currentMonsters.length}/5)</h4>
      ${list}
    </section>
  `;
}

function adminLocationEditor() {
  return `<section class="panel-box"><h3>📍 Локации / сундук</h3><button data-action="openChestManager">Открыть личный сундук</button><div class="muted">Сундук локации (дроп) остается в локации, личный сундук — только в Главной.</div></section>`;
}


function adminSkillsEditor(skills) {
  const keys = Object.keys(skills);
  return `
    <section class="panel-box">
      <h3>✨ Редактор умений</h3>
      <div class="admin-grid">
        <label>ID<input id="skill-id" placeholder="new_skill" /></label>
        <label>Название<input id="skill-name" placeholder="Новое умение" /></label>
        <label>Иконка<input id="skill-icon" placeholder="✨" /></label>
        <label>Описание<input id="skill-desc" placeholder="Описание" /></label>
        <label>Мана<input id="skill-mana" type="number" value="5" /></label>
        <label>Требуемый уровень<input id="skill-level" type="number" value="1" /></label>
        <label>Тип эффекта<select id="skill-effect"><option value="damage">Урон</option><option value="heal">Лечение</option></select></label>
        <label>Сила<input id="skill-power" type="number" value="8" /></label>
      </div>
      <div class="row"><button data-action="adminCreateSkill">Сохранить умение</button><button class="danger" data-action="adminDeleteSkill">Удалить умение</button></div>
      <div class="muted">Ключи: ${keys.slice(0, 20).join(', ')}${keys.length > 20 ? '...' : ''}</div>
    </section>
  `;
}

function renderAdminPanel({ playersDB, selectedAdminUser, ui, items, changeLog, skills }) {
  const users = Object.keys(playersDB.players || {});
  const selectedName = selectedAdminUser || users[0];
  const selected = playersDB.players[selectedName];
  if (!selected) return '<div class="game-panel"><h2>Админ панель</h2><div class="muted">Нет игроков.</div></div>';
  const p = selected.player;

  const playersTab = `
    <section class="panel-box">
      <h3>👤 Редактор игроков</h3>
      <div class="row">${users.map((u) => `<button class="secondary" data-action="adminSelectUser" data-username="${u}">${u}</button>`).join('')}</div>
      <div class="admin-grid">
        <label>HP<input id="admin-hp" type="number" value="${p.hp}" /></label>
        <label>HP MAX<input id="admin-hpmax" type="number" value="${p.hpMax}" /></label>
        <label>MP<input id="admin-mp" type="number" value="${p.mp}" /></label>
        <label>MP MAX<input id="admin-mpmax" type="number" value="${p.mpMax}" /></label>
        <label>Уровень<input id="admin-level" type="number" value="${p.level}" /></label>
        <label>Добавить предмет<select id="admin-item-key">${Object.keys(items).map((k) => `<option>${k}</option>`).join('')}</select></label>
      </div>
      <div class="row"><button data-action="adminSaveStats">Сохранить</button><button data-action="adminAddItemToPlayer">Добавить предмет</button><button class="danger" data-action="adminToggleBan">${selected.metadata?.isBanned ? 'Разблокировать' : 'Заблокировать'}</button><button class="danger" data-action="adminClearInventory">Очистить инвентарь</button></div>
    </section>
  `;

  const logs = `<section class="panel-box"><h3>🧾 Журнал изменений</h3><div class="battle-log">${(changeLog || []).slice(0, 40).map((x) => `<div class="log-line">${new Date(x.at).toLocaleString()} — ${x.by}: ${x.action}</div>`).join('') || '<div class="muted">Изменений пока нет.</div>'}</div></section>`;

  return `
    <div class="game-panel fade-in">
      <header class="section-head"><h2>🛠 Контекстный редактор</h2></header>
      <div class="row admin-tabs">
        <button data-action="switchAdminTab" data-tab="players" class="${ui.adminTab === 'players' ? 'ok' : 'secondary'}">Редактор игроков</button>
        <button data-action="switchAdminTab" data-tab="items" class="${ui.adminTab === 'items' ? 'ok' : 'secondary'}">Редактор вещей</button>
        <button data-action="switchAdminTab" data-tab="monsters" class="${ui.adminTab === 'monsters' ? 'ok' : 'secondary'}">Редактор монстров</button>
        <button data-action="switchAdminTab" data-tab="locations" class="${ui.adminTab === 'locations' ? 'ok' : 'secondary'}">Локации/сундук</button><button data-action="switchAdminTab" data-tab="skills" class="${ui.adminTab === 'skills' ? 'ok' : 'secondary'}">Редактор умений</button>
      </div>
      ${ui.adminTab === 'items' ? adminItemEditor(items, ui) : ui.adminTab === 'monsters' ? adminMonsterEditor(items, ui) : ui.adminTab === 'locations' ? adminLocationEditor() : ui.adminTab === 'skills' ? adminSkillsEditor(skills) : playersTab}
      ${logs}
    </div>
  `;
}

export function renderLocationScreen({ player, location, monster, monsters, statBar, ui, isAdmin, selectedAdminUser, playersDB, skills, items, classAvatars, changeLog }) {
  const pile = player.world[player.location].lootPile;
  const mainChest = player.world.mainChest;
  const inMain = player.location === 'Главная';
  const section = ui.section || 'location';
  const expNeed = getExpToNextLevel(player.level);

  const monsterCards = (monsters || []).map((m) => {
    const respawn = !m.isAlive && m.respawnTime ? Math.max(0, Math.ceil((m.respawnTime - Date.now()) / 1000)) : 0;
    return `<div class="monster-box ${m.isAlive ? '' : 'dead'}"><div class="monster-icon">${m.icon}</div><div class="monster-name">${m.name}</div><div class="muted">HP ${m.hp}/${m.hpMax}</div>${m.isAlive ? `<button class="ok" data-action="startBattle" data-monster-key="${m.key}">⚔ Сражаться</button>` : `<div class="muted">Респавн через <span data-countdown-to="${m.respawnTime}">${respawn}</span>с</div>`}</div>`;
  }).join('') || '<div class="muted">Монстров нет</div>';

  const contentLocation = `<div class="game-panel fade-in"><header class="section-head"><h2>📍 ${player.location}</h2><div class="row">${location.links.map((l) => `<button class="nav-btn location-nav" data-action="travel" data-location="${l}">${l}</button>`).join('')}</div></header><div class="location-grid"><section class="panel-box"><h3>Монстры</h3><div class="monster-strip scroll-pane">${monsterCards}</div></section><section class="panel-box"><h3>Сундук локации</h3><div class="list scroll-pane">${pile.items.map((i) => itemCard(i, `<button data-action="pickupItem" data-source="location" data-item-id="${i.id}">Подобрать</button>`)).join('') || '<div class="muted">Пусто</div>'}</div></section><section class="panel-box"><h3>Личный сундук</h3>${inMain ? `<button class="secondary" data-action="openChestManager">Открыть</button><div class="list">${mainChest.items.slice(0, 3).map((i) => itemCard(i)).join('') || '<div class="muted">Пусто</div>'}</div>` : '<div class="muted">Доступен только в Главной</div>'}</section></div></div>`;

  const contentInventory = `<div class="game-panel fade-in"><header class="section-head"><h2>🎒 Сумка инвентаря</h2></header><div class="list scroll-pane">${player.inventory.map((i) => itemCard(i, `${i.type === 'consumable' ? `<button data-action="inventoryAction" data-mode="use" data-item-id="${i.id}">Использовать</button>` : ''}${['weapon', 'armor'].includes(i.type) ? `<button data-action="inventoryAction" data-mode="equip" data-item-id="${i.id}">Экипировать</button>` : ''}<button class="danger" data-action="inventoryAction" data-mode="drop" data-item-id="${i.id}">Выкинуть</button>${inMain ? `<button class="secondary" data-action="toMainChest" data-item-id="${i.id}">В сундук</button>` : ''}`)).join('') || '<div class="muted">Сумка пуста</div>'}</div></div>`;

  const slots = ['weapon', 'head', 'body', 'legs'];
  const slotNames = { weapon: 'Оружие', head: 'Голова', body: 'Тело', legs: 'Ноги' };
  const equipItemDetails = (it) => it ? `<div><b>${it.icon || '📦'} ${it.name}</b><div class="muted">${it.damage ? `⚔ ${it.damage}` : ''} ${it.defense ? `🛡 ${it.defense}` : ''}</div><div class="muted">Класс: ${it.classRequirement || 'Любой'} | Ур: ${it.levelRequirement || 1} | ⚖ ${it.weight || 0}</div></div>` : '<div class="muted">Пусто</div>';
  const contentCharacter = `<div class="game-panel fade-in"><header class="section-head"><h2>👤 Персонаж</h2></header><div class="row" style="align-items:center"><img src="${classAvatars[player.className] || classAvatars['Воин']}" alt="avatar" style="width:96px;height:96px;border-radius:14px;border:1px solid var(--line);background:#fff" /><div class="character-hero">${player.className}</div></div><div class="equipment-grid">${slots.map((s) => `<div class="equip-slot"><h4>${slotNames[s]}</h4>${equipItemDetails(player.equippedItems[s])}${player.equippedItems[s] ? `<button data-action="unequip" data-slot="${s}">Снять</button>` : '<div class="muted">Экипируйте из сумки</div>'}</div>`).join('')}</div></div>`;

  const contentSkills = `<div class="game-panel fade-in"><header class="section-head"><h2>✨ Система умений</h2></header><section class="panel-box"><h3>Экипированные умения</h3><div class="skill-slots">${player.skills.equipped.map((id, idx) => `<div class="equip-slot"><h4>Слот ${idx + 1}</h4>${id && skills[id] ? `<div>${skills[id].icon || '✨'} ${skills[id].name}</div><button data-action="unequipSkill" data-slot="${idx}">Снять</button>` : '<div class="muted">Пусто</div>'}</div>`).join('')}</div></section><section class="panel-box"><h3>Доступные/заблокированные</h3><div class="list">${Object.values(skills).map((s) => skillCard(s, player.skills.unlocked.includes(s.id), player.skills.equipped.includes(s.id))).join('')}</div></section></div>`;

  const contentAdmin = renderAdminPanel({ playersDB, selectedAdminUser, ui, items, changeLog, skills });

  return `
    <div class="topbar"><button class="hamburger" data-action="toggleSidebar">☰</button><h1>ALDOS RPG</h1></div>
    <div class="shell ${ui.sidebarOpen ? 'open' : ''}">
      <aside class="sidebar">
        <div class="sidebar-head"><h3>Игрок</h3><button class="secondary" data-action="toggleSidebar">✕</button></div>
        ${statTile('HP', player.hp, player.hpMax, 'hp', statBar, 'live-hp', 'data-live-hp')}
        ${statTile('MP', player.mp, player.mpMax, 'mp', statBar, 'live-mp', 'data-live-mp')}
        <section class="stat-tile mp"><div class="stat-tile__title">Опыт</div><div class="stat-tile__value">${player.experience}/${expNeed}</div>${statBar(player.experience, expNeed, 'mp')}</section>
        <div class="meta-card"><div><b>Имя:</b> ${player.username}</div><div><b>Класс:</b> ${player.className}</div><div><b>Уровень:</b> ${player.level}</div><div><b>Вес игрока:</b> ${player.getCurrentInventoryWeight()}/${player.getMaxInventoryWeight()}</div></div>
        <div class="col"><button data-action="switchSection" data-section="location">Локация</button><button data-action="switchSection" data-section="inventory">Сумка</button><button data-action="switchSection" data-section="character">Персонаж</button><button data-action="switchSection" data-section="skills">Умения</button>${isAdmin ? '<button data-action="switchSection" data-section="admin">⚡ Админ панель</button>' : ''}<button class="danger" data-action="logout">Выход</button></div>
      </aside>
      <main class="main">${section === 'inventory' ? contentInventory : section === 'character' ? contentCharacter : section === 'skills' ? contentSkills : section === 'admin' && isAdmin ? contentAdmin : contentLocation}</main>
    </div>
  `;
}
