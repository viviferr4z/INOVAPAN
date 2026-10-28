document.getElementById('formLogin').addEventListener('submit', async event => {
  event.preventDefault();
  const button = document.getElementById('entrar');
  button.disabled = true; button.textContent = 'Entrando...';
  try {
    const session = await api('/auth/login', { method: 'POST', body: JSON.stringify({ usuario: document.getElementById('usuario').value.trim(), senha: document.getElementById('senha').value }) });
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
    location.href = 'painel.html';
  } catch (err) { alerta('mensagemLogin', err.message, 'danger'); }
  finally { button.disabled = false; button.textContent = 'Entrar'; }
});
