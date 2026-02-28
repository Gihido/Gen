export function renderLocationScreen({ player, location, monster, statBar }) {
  const pile = player.world[player.location].lootPile;
  const respawnText = monster && !monster.isAlive && monster.respawnTime
    ? `Респаун через ${Math.max(0, Math.ceil((monster.respawnTime - Date.now()) / 1000))}с`
    : '';

  return `
    <div class="toolbar">
      <button class="secondary" data-action="showInventory">🎒 Сумка</button>
      <button class="secondary" data-action="showCharacterInfo">👤 Профиль</button>
      <button class="danger" data-action="logout">🚪 Выход</button>
    </div>

    <div class="card" style="margin-bottom: 12px;"><h2 style="margin:0;">Локация: ${player.location}</h2></div>

    <div class="layout">
      <div class="card">
        <h3 class="panel-title">Действия и переходы</h3>
        <div class="list">
          ${location.links.map((l) => `<button data-action="travel" data-location="${l}">Перейти: ${l}</button>`).join('')}
          <button data-action="openChest" class="secondary">Открыть сундук</button>
        </div>
      </div>

      <div class="card">
        <h3 class="panel-title">Центр</h3>
        ${monster ? `
          <div class="monster-box">
            <div class="monster-icon">${monster.icon}</div>
            <div><b>${monster.name}</b></div>
            <div>HP: ${monster.hp}/${monster.hpMax}</div>
            ${monster.isAlive ? `<button data-action="startBattle">Сражаться</button>` : `<div class="muted">Монстр мёртв. ${respawnText}</div>`}
          </div>` : '<div class="muted">Здесь спокойно.</div>'}
      </div>

      <div class="card">
        <h3 class="panel-title">Статы</h3>
        <div>HP ${player.hp}/${player.hpMax}</div>
        ${statBar(player.hp, player.hpMax, 'hp')}
        <div>MP ${player.mp}/${player.mpMax}</div>
        ${statBar(player.mp, player.mpMax, 'mp')}
        <div>Уровень: ${player.level} | EXP: ${player.experience}</div>
        <div>Вес: ${player.getCurrentInventoryWeight()}/${player.getMaxInventoryWeight()}</div>
      </div>
    </div>

    <div class="card" style="margin-top:12px;">
      <h3 class="panel-title">Сундук локации</h3>
      <div class="list">
        ${pile.items.map((item) => `<div class="item" title="${item.description || ''}"><b>${item.name}</b> (${item.type}) <button data-action="pickupItem" data-item-id="${item.id}">Подобрать</button></div>`).join('') || '<div class="muted">Пусто.</div>'}
      </div>
    </div>
  `;
}
