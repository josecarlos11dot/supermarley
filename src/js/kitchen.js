(function(){
  function renderPendientes(){
    const cont = $('#pendientes'); cont.innerHTML = '';
    const list = window.SMState.getPendientes();
    if(list.length===0){ cont.innerHTML = '<div class="mini">Sin pendientes. ✨</div>'; return; }
    list.forEach(orden=>{
      const card = document.createElement('div'); card.className = 'order-card';
      card.innerHTML = `
        <div class="order-head">
          <div>
            <strong>Orden #\${orden.id.slice(-4)}</strong>
            <span class="pill">\${orden.hora}</span>
            \${orden.nota? `<span class="pill">Nota: \${orden.nota}</span>`:''}
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn warn" data-act="servir">Servir</button>
            <button class="btn danger" data-act="cancelar">Cancelar</button>
          </div>
        </div>
        <div class="order-items">
          <ul>
            \${orden.items.map(i=> `<li>\${i.qty} × \${i.nombre}\${i.nota? ` <span class="mini">[\${i.nota}]</span>`:''} — \${money(i.precio*i.qty)}</li>`).join('')}
          </ul>
        </div>
        <div style="text-align:right; font-weight:800;">Total: \${money(orden.total)}</div>
      `;
      card.querySelector('[data-act="servir"]').addEventListener('click', ()=> window.SMState.moverAPapelera(orden.id,'servida'));
      card.querySelector('[data-act="cancelar"]').addEventListener('click', ()=> window.SMState.moverAPapelera(orden.id,'cancelada'));
      cont.appendChild(card);
    });
  }
  function renderPapelera(){
    const cont = $('#papelera'); cont.innerHTML='';
    const list = window.SMState.getPapelera();
    if(list.length===0){ cont.innerHTML = '<div class="mini">Vacía.</div>'; return; }
    list.forEach(rec=>{
      const div = document.createElement('div'); div.className = 'history-item';
      const hora = new Date(rec.timestamp).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
      const resumen = rec.items.map(i=> `\${i.qty}× \${i.nombre}\${i.nota? ` [\${i.nota}]`:''}`).join(', ');
      div.innerHTML = `
        <div>
          <div style="font-weight:700;">#\${rec.id.slice(-4)} — \${resumen}</div>
          <div class="mini">\${rec.motivo.toUpperCase()} · \${hora} · Total \${money(rec.total)} \${rec.nota? '· Nota: '+rec.nota : ''}</div>
        </div>
        <div class="pill">\${rec.motivo}</div>
      `;
      cont.appendChild(div);
    });
  }
  window.addEventListener('sm:pendientes:update', renderPendientes);
  window.addEventListener('sm:papelera:update', renderPapelera);
  renderPendientes(); renderPapelera();
})();
