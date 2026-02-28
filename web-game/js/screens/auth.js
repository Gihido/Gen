export function renderAuthScreen({ classes, genders }) {
  return `
    <div class="row">
      <div class="card" style="flex:1;min-width:280px;">
        <h2>Вход</h2>
        <div class="col">
          <input id="login-username" placeholder="Username" />
          <input id="login-password" type="password" placeholder="Password" />
          <button data-action="login">Вход</button>
        </div>
      </div>
      <div class="card" style="flex:1;min-width:280px;">
        <h2>Регистрация</h2>
        <div class="col">
          <input id="reg-username" placeholder="Username" />
          <input id="reg-password" type="password" placeholder="Password" />
          <select id="reg-class">${classes.map((c) => `<option>${c}</option>`).join('')}</select>
          <select id="reg-gender">${genders.map((g) => `<option>${g}</option>`).join('')}</select>
          <button data-action="register">Регистрация</button>
        </div>
      </div>
    </div>
  `;
}
