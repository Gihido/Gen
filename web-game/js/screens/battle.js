export function renderBattleScreen({ player, battle, statBar }) {
  const m = battle.monster;
  return `
    <div class="card">
      <h2>Бой: ${m.name}</h2>
      <div class="row" style="align-items:flex-start;">
        <div style="flex:1;min-width:260px;" class="card">
          <h3>Игрок</h3>
          <div>HP ${player.hp}/${player.hpMax}</div>
          ${statBar(player.hp, player.hpMax, 'hp')}
          <div>MP ${player.mp}/${player.mpMax}</div>
          ${statBar(player.mp, player.mpMax, 'mp')}
        </div>
        <div style="flex:1;min-width:260px;" class="card">
          <h3>${m.icon || '👹'} ${m.name}</h3>
          <div>HP ${m.hp}/${m.hpMax}</div>
          ${statBar(m.hp, m.hpMax, 'hp')}
        </div>
      </div>
      <div class="battle-actions">
        <button data-action="battleAction" data-mode="attack">Атаковать</button>
        <button data-action="battleAction" data-mode="magic">Магия</button>
        <button data-action="battleAction" data-mode="defense">Защита</button>
        <button data-action="battleAction" data-mode="item">Предмет</button>
        <button class="secondary" data-action="battleAction" data-mode="escape">Побег</button>
      </div>
      <div class="log" style="margin-top:10px;">${battle.log.map((x) => `<div>• ${x}</div>`).join('')}</div>
    </div>
  `;
}
