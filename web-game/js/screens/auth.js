function classCard(cls, active) {
  const icons = { Воин: '⚔', Маг: '✦', Лучник: '🏹', Разбойник: '🗡', Жрец: '✚' };
  return `<button class="class-card ${active ? 'active' : ''}" data-action="selectClass" data-class-name="${cls}"><span>${icons[cls] || '◆'}</span><b>${cls}</b></button>`;
}

export function renderAuthScreen({ classes, genders, mode = 'login', selectedClass = classes[0], selectedGender = genders[0] }) {
  if (mode === 'login') {
    return `
      <div class="auth-wrap">
        <div class="auth-panel">
          <div class="auth-title">🎮 ALDOS RPG</div>
          <label>Имя персонажа:</label>
          <input id="login-username" placeholder="Username" />
          <label>Пароль:</label>
          <input id="login-password" type="password" placeholder="Password" />
          <div class="auth-actions">
            <button class="ok" data-action="login">🎮 Войти</button>
            <button data-action="showRegister">📝 Создать</button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="auth-wrap">
      <div class="auth-panel register">
        <div class="auth-title">📝 СОЗДАНИЕ ПЕРСОНАЖА</div>
        <label>Имя персонажа</label>
        <input id="reg-username" placeholder="Имя" />
        <label>Пароль</label>
        <input id="reg-password" type="password" placeholder="Минимум 3 символа" />
        <label>Выберите класс</label>
        <div class="class-grid">${classes.map((c) => classCard(c, c === selectedClass)).join('')}</div>
        <label>Пол</label>
        <div class="gender-row">
          ${genders.map((g) => `<button data-action="selectGender" data-gender="${g}" class="gender-btn ${g === selectedGender ? 'active' : ''}">${g}</button>`).join('')}
        </div>
        <input type="hidden" id="reg-class" value="${selectedClass}" />
        <input type="hidden" id="reg-gender" value="${selectedGender}" />
        <div class="auth-actions">
          <button class="ok" data-action="register">✅ Начать приключение</button>
          <button class="secondary" data-action="showLogin">◀ Назад</button>
        </div>
      </div>
    </div>
  `;
}
