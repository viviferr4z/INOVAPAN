document.addEventListener('DOMContentLoaded', async () => {
  try {
    const d = await api('/dashboard');
    totalClientes.textContent=d.clientes; totalProdutos.textContent=d.produtos; pedidosHoje.textContent=d.pedidos_hoje; vendasHoje.textContent=moeda(d.vendas_hoje); faturamentoTotal.textContent=moeda(d.faturamento_total);
  } catch(e) { alerta('mensagemPagina', e.message, 'danger'); }
});
