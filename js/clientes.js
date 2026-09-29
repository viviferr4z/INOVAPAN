let clientesCache = [];
let editandoCliente = null;

async function carregarClientes() {
  try {
    const q = document.getElementById('pesquisaCliente')?.value?.trim() || '';
    clientesCache = await api(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    document.getElementById('contadorClientes').textContent = `${clientesCache.length} cliente(s)`;
    document.getElementById('listaClientes').innerHTML = clientesCache.map(c => `
      <tr><td>${c.nome}</td><td>${c.telefone}</td><td>${c.email || '-'}</td><td>${c.endereco || '-'}</td>
      <td class="text-nowrap"><button class="btn btn-sm btn-outline-primary" onclick="editarCliente(${c.id})">Editar</button>
      <button class="btn btn-sm btn-outline-danger" onclick="excluirCliente(${c.id})">Excluir</button></td></tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted">Nenhum cliente cadastrado.</td></tr>';
  } catch (e) { alerta('mensagemPagina', e.message, 'danger'); }
}

function editarCliente(id) {
  const c = clientesCache.find(x => x.id === id); if (!c) return;
  editandoCliente = id;
  document.getElementById('tituloModalCliente').textContent = 'Editar cliente';
  nomeCliente.value = c.nome; telefoneCliente.value = c.telefone; emailCliente.value = c.email || ''; enderecoCliente.value = c.endereco || '';
  bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCliente')).show();
}

async function excluirCliente(id) {
  if (!confirm('Deseja realmente excluir este cliente?')) return;
  try { await api(`/clientes/${id}`, { method: 'DELETE' }); await carregarClientes(); alerta('mensagemPagina', 'Cliente excluído.'); }
  catch (e) { alerta('mensagemPagina', e.message, 'danger'); }
}

document.addEventListener('DOMContentLoaded', () => {
  carregarClientes();
  pesquisaCliente.addEventListener('input', carregarClientes);
  modalCliente.addEventListener('hidden.bs.modal', () => { editandoCliente = null; formCliente.reset(); tituloModalCliente.textContent = 'Novo cliente'; });
  formCliente.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = { nome: nomeCliente.value, telefone: telefoneCliente.value, email: emailCliente.value, endereco: enderecoCliente.value };
    try {
      await api(editandoCliente ? `/clientes/${editandoCliente}` : '/clientes', { method: editandoCliente ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      bootstrap.Modal.getInstance(modalCliente).hide(); await carregarClientes(); alerta('mensagemPagina', 'Cliente salvo com sucesso.');
    } catch (err) { alerta('mensagemCliente', err.message, 'danger'); }
  });
});
