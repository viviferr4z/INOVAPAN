const API_BASE = window.INOVAPAN_API || 'http://localhost:3000/api';

async function api(path, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  };
  const response = await fetch(`${API_BASE}${path}`, config);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.erro || `Erro HTTP ${response.status}`);
  return data;
}

const moeda = valor => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataHora = valor => valor ? new Date(valor.replace(' ', 'T')).toLocaleString('pt-BR') : '-';

function alerta(id, mensagem, tipo = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${tipo} py-2">${mensagem}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 3500);
}
