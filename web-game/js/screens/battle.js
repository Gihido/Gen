export function renderBattleScreen({ player, battle, statBar }) {
  const m = battle.monster;
  const now = Date.now();
  const playerTime = battle.phase === 'player' ? Math.max(0, Math.ceil((battle.playerDeadline - now) / 1000)) : 0;
  const monsterTime = battle.phase === 'monster' ? Math.max(0, Math.ceil((battle.monsterAttackAt - now) / 1000)) : 0;

  return `
    <div class="card battle-screen fade-in">
      <h2>⚔ Бой: ${m.name}</h2>
      <div class="row">
        <div class="card" style="flex:1"><h3>Игрок</h3><div>HP ${player.hp}/${player.hpMax}</div>${statBar(player.hp, player.hpMax, 'hp')}<div>MP ${player.mp}/${player.mpMax}</div>${statBar(player.mp, player.mpMax, 'mp')}</div>
        <div class="card" style="flex:1"><h3 class="pulse">${m.icon || '👹'} ${m.name}</h3><div>HP ${m.hp}/${m.hpMax}</div>${statBar(m.hp, m.hpMax, 'hp')}</div>
      </div>
      <div class="turn-info">${battle.phase === 'player' ? `Ваш ход: ${playerTime}с` : `Ход монстра через ${monsterTime}с`}</div>
      <div class="battle-actions ${battle.phase !== 'player' || battle.acted ? 'disabled' : ''}">
        <button data-action="battleAction" data-mode="attack">Атаковать</button>
        <button data-action="battleAction" data-mode="magic">Магия</button>
        <button data-action="battleAction" data-mode="defense">Защита</button>
        <button data-action="battleAction" data-mode="item">Предмет</button>
        <button class="secondary" data-action="battleAction" data-mode="escape">Побег</button>
      </div>
      <div class="log">${battle.log.slice(-12).map((x) => `<div class="log-line">• ${x}</div>`).join('')}</div>
    </div>
  `;
}
