export function renderBattleScreen({ player, battle, statBar }) {
  const m = battle.monster;
  return `
    <section class="battle-wrap fade-in">
      <header class="battle-head">
        <h2>⚔ Бой: ${m.name}</h2>
        <div class="turn-pill ${battle.phase}">
          ${battle.phase === 'player'
            ? `Ваш ход: <span data-countdown-to="${battle.playerDeadline}">10</span>с`
            : `Атака монстра через <span data-countdown-to="${battle.monsterAttackAt}">5</span>с`}
        </div>
      </header>

      <div class="battle-arena">
        <article class="fighter-card player">
          <h3>Игрок</h3>
          <div>${player.username}</div>
          <div>HP ${player.hp}/${player.hpMax}</div>
          ${statBar(player.hp, player.hpMax, 'hp')}
          <div>MP ${player.mp}/${player.mpMax}</div>
          ${statBar(player.mp, player.mpMax, 'mp')}
        </article>

        <div class="vs">VS</div>

        <article class="fighter-card monster ${m.isAlive ? '' : 'dead'}">
          <h3>${m.icon || '👹'} ${m.name}</h3>
          <div>HP ${m.hp}/${m.hpMax}</div>
          ${statBar(m.hp, m.hpMax, 'hp')}
        </article>
      </div>

      <div class="battle-actions ${battle.phase !== 'player' || battle.acted ? 'disabled' : ''}">
        <button data-action="battleAction" data-mode="attack">Атаковать</button>
        <button class="secondary" data-action="openBattleSkills">Умения</button>
      </div>

      <div class="battle-log" id="battle-log">
        ${battle.log.slice(-14).map((x) => `<div class="log-line">• ${x}</div>`).join('')}
      </div>
    </section>
  `;
}
