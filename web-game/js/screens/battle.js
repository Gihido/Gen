export function renderBattleScreen({ player, battle, statBar }) {
  const m = battle.monster;
  return `
    <section class="battle-wrap fade-in">
      <header class="battle-head">
        <h2>⚔ Бой: ${m.name}</h2>
        <div class="turn-pill">Ход: <span data-countdown-to="${battle.turnEndsAt}">10</span>с</div>
      </header>

      <div class="battle-arena">
        <article class="fighter-card player">
          <h3>Игрок</h3>
          <div>${player.username}</div>
          <div>HP <span id="live-hp">${player.hp}/${player.hpMax}</span></div>
          ${statBar(player.hp, player.hpMax, 'hp').replace('class="hp"', 'class="hp" data-live-hp')}
          <div>MP <span id="live-mp">${player.mp}/${player.mpMax}</span></div>
          ${statBar(player.mp, player.mpMax, 'mp').replace('class="mp"', 'class="mp" data-live-mp')}
        </article>

        <div class="vs">VS</div>

        <article class="fighter-card monster ${m.isAlive ? '' : 'dead'}">
          <h3>${m.icon || '👹'} ${m.name}</h3>
          <div>HP ${m.hp}/${m.hpMax}</div>
          ${statBar(m.hp, m.hpMax, 'hp')}
          <div class="muted">Атака монстра: ${battle.monsterActed ? 'уже в этом ходу' : `через <span data-countdown-to="${battle.monsterAttackAt}">5</span>с`}</div>
        </article>
      </div>

      <div class="battle-actions ${battle.acted ? 'disabled' : ''}">
        <button data-action="battleAction" data-mode="attack">Атаковать</button>
        <button class="secondary" data-action="openBattleSkills">Умения</button>
      </div>

      <div class="battle-log" id="battle-log">
        ${battle.log.slice(-16).map((x) => `<div class="log-line">• ${x}</div>`).join('')}
      </div>
    </section>
  `;
}
