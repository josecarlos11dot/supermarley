(function(){
  // --- Doble tap / doble clic helper ---
  function addDoubleTap(el, windowMs, onFire){
    let last = 0, hintTimer = null;
    function showHint(){
      const prev = el.textContent;
      el.textContent = 'Toca de nuevo para servir';
      el.classList.add('primary');
      clearTimeout(hintTimer);
      hintTimer = setTimeout(()=>{ el.textContent = prev; el.classList.remove('primary'); }, 1200);
    }
    function handle(){
      const now = Date.now();
      if(now - last <= windowMs){ // segundo tap
        clearTimeout(hintTimer);
        onFire();
      } else { // primer tap
        showHint();
      }
      last = now;
    }
    // móvil y desktop
    el.addEventListener('click', handle);
    el.addEventListener('dblclick', (e)=>{ e.preventDefault(); onFire(); });
  }

  function renderPendientes(){
    const cont = $('#pendientes'); cont.innerHTML = '';
    const list = window.SMState.getPendientes();
    if(list.length===0){ cont.innerHTML = '<div class="mini">Sin pendientes. ✨</div>'; return; }

    list.forEach(function(orden){
      const notaHtml = orden.nota ? ('<span class="pill">Nota: ' + orden.nota + '</span>') : '';
      const itemsHtml = orden.items.map(function(i){
        var notaItem = i.nota ? (' <span class="mini">[' + i.nota + ']</span>') : '';
        return '<li>' + i.qty + ' × ' + i.nombre + notaItem + ' — ' + money(i.precio * i.qty) + '</li>';
      }).join('');

      const card = document.createElement('div'); card.className = 'order-card';
      card.innerHTML =
        '<div class="order-head">' +
          '<div>' +
            '<strong>Orden #' + orden.id.slice(-4) + '</strong>' +
            '<span class="pill">' + orden.hora + '</span>' +
            notaHtml +
          '</div>' +
          '<div style="display:flex; gap:6px; align-items:center;">' +
            '<button class="btn warn" data-act="servir" title="Doble tap para servir">Servir</button>' +
          '</div>' +
        '</div>' +
        '<div class="order-items"><ul>' + itemsHtml + '</ul></div>' +
        '<div style="text-align:right; font-weight:800;">Total: ' + money(orden.total) + '</div>';

      const btnServir = card.querySelector('[data-act="servir"]');
      addDoubleTap(btnServir, 400, function(){
        btnServir.textContent = 'Sirviendo…';
        btnServir.disabled = true;
        window.SMState.moverAPapelera(orden.id,'servida');
      });

      cont.appendChild(card);
    });
  }

  function renderPapelera(){
    const cont = $('#papelera'); cont.innerHTML='';
    const list = window.SMState.getPapelera();
    if(list.length===0){ cont.innerHTML = '<div class="mini">Vacía.</div>'; return; }

    list.forEach(function(rec){
      const hora = new Date(rec.timestamp).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
      const resumen = rec.items.map(function(i){
        var notaItem = i.nota ? (' [' + i.nota + ']') : '';
        return i.qty + '× ' + i.nombre + notaItem;
      }).join(', ');

      const div = document.createElement('div'); div.className = 'history-item';
      div.innerHTML =
        '<div>' +
          '<div style="font-weight:700;">#' + rec.id.slice(-4) + ' — ' + resumen + '</div>' +
          '<div class="mini">' + rec.motivo.toUpperCase() + ' · ' + hora + ' · Total ' + money(rec.total) + (rec.nota ? ' · Nota: ' + rec.nota : '') + '</div>' +
        '</div>' +
        '<div class="pill">' + rec.motivo + '</div>';
      cont.appendChild(div);
    });
  }

  window.addEventListener('sm:pendientes:update', renderPendientes);
  window.addEventListener('sm:papelera:update', renderPapelera);
  renderPendientes(); renderPapelera();
})();
