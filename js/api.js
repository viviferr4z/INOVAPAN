const API_BASE = (window.INOVAPAN_API || 'http://localhost:3000/api').replace(/\/$/, '');
const AUTH_KEY = 'inovapan_session';
function getSession() {
  try { return JSON.parse(sessionStorage.getItem(AUTH_KEY) || 'null'); } catch (_) { return null; }
}
function sair() { sessionStorage.removeItem(AUTH_KEY); location.href = 'login.html'; }
const publicPage = location.pathname.endsWith('/login.html');
if (!publicPage && (!getSession()?.token || getSession().expira_em <= Date.now() / 1000)) location.replace('login.html');
async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  const session = getSession();
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  let response;
  try { response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: options.signal || AbortSignal.timeout(60000) }); }
  catch (_) { throw new Error('Não foi possível conectar à API. Aguarde e tente novamente.'); }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== '/auth/login') {
    sessionStorage.removeItem(AUTH_KEY); location.replace('login.html');
  }
  if (!response.ok) throw new Error(data.erro || `Erro HTTP ${response.status}`);
  return data;
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const moeda = valor => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataHora = valor => {
  if (!valor) return '-';
  const iso = valor.replace(' ', 'T');
  const date = new Date(/Z$|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};
function alerta(id, mensagem, tipo = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  const box = document.createElement('div');
  box.className = `alert alert-${['success','warning','danger','info'].includes(tipo) ? tipo : 'info'} py-2`;
  box.setAttribute('role', 'alert'); box.textContent = mensagem;
  el.replaceChildren(box);
}
