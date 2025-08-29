(function(){
  const MENU = window.CATALOG;

  // Filtros dinámicos
  const cats = ['all', ...new Set(MENU.map(p=>p.categoria))];
  const filtros = $('#filtrosCategorias');
  filtros.innerHTML = cats.map(c => '<button class="btn ghost" data-cat="' + c + '">' + (c==='all'?'Todos':(c.charAt(0).toUpperCase()+c.slice(1))) + '</button>').join('');
  filtros.addEventListener('click', function(e){
    const btn = e.target.closest('button[data-cat]'); if(!btn) return;
    [...filtros.querySelectorAll('button')].forEach(b=> b.classList.remove('primary'));
    btn.classList.add('primary');
    renderMenu(btn.dataset.cat);
  });

  // Render menú con nota por pieza
  function renderMenu(filtro='all'){
    const cont = $('#menu'); cont.innerHTML = '';
    const lista = (filtro==='all') ? MENU : MENU.filter(p=> p.categoria===filtro);
    lista.forEach(function(prod){
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML =
        '<div class="pic">' + prod.emoji + '</div>' +
        '<div class="info">' +
          '<div style="font-weight:700">' + prod.nombre + '</div>' +
          '<div class="price">' + money(prod.precio) + '</div>' +
          '<div class="mini">Personaliza esta pieza</div>' +
          '<div class="toolbar" data-chips>' +
            '<button class="btn ghost chip" data-val="sin cebolla">sin cebolla</button>' +
            '<button class="btn ghost chip" data-val="con queso">con queso</button>' +
            '<button class="btn ghost chip" data-val="bien dorada">bien dorada</button>' +
          '</div>' +
          '<div class="toolbar" style="gap:8px;">' +
            '<input type="text" placeholder="Nota p/ esta pieza (opcional)" data-note style="flex:1; min-width:0;" />' +
            '<button class="btn" data-add>Agregar</button>' +
          '</div>' +
        '</div>';
      const noteInput = div.querySelector('[data-note]');
      div.querySelectorAll('[data-chips] .chip').forEach(function(ch){
        ch.addEventListener('click', function(){
          ch.classList.toggle('primary');
          const chips = [...div.querySelectorAll('[data-chips] .chip.primary')].map(c=>c.dataset.val);
          const manual = noteInput.value.trim();
          noteInput.value = [manual, ...chips].filter(Boolean).join(', ');
        });
      });
      div.querySelector('[data-add]').addEventListener('click', function(){
        addToCart(prod, (noteInput.value||'').trim());
        // feedback rápido en mobile: destello de la mini-barra
        const bar = $('#miniCartBar'); if(bar){ bar.classList.remove('hidden'); bar.style.boxShadow='0 -10px 24px rgba(16,185,129,.45)'; setTimeout(()=> bar.style.boxShadow='', 250); }
        noteInput.value=''; div.querySelectorAll('[data-chips] .chip').forEach(c=> c.classList.remove('primary'));
        window.scrollTo({top:0, behavior:'smooth'}); // sube para ver filtros/indicador
      });
      cont.appendChild(div);
    });
  }

  // Carrito local
  const CART = [];
  const keyFrom = (prod, nota)=> prod.id + (nota? '#'+nota : '');
  function addToCart(prod, nota=''){
    const key = keyFrom(prod, nota);
    const idx = CART.findIndex(x=> x._key===key);
    if(idx>=0) CART[idx].qty++; else CART.push({_key:key, id:prod.id, nombre:prod.nombre, precio:prod.precio, qty:1, nota});
    renderCart();
  }
  function changeQty(key, qty){
    const it = CART.find(x=> x._key===key); if(!it) return;
    it.qty = Math.max(0, qty|0);
    for(let i=CART.length-1;i>=0;i--) if(CART[i].qty<=0) CART.splice(i,1);
    renderCart();
  }
  function total(){ return CART.reduce((s,i)=> s+i.precio*i.qty, 0); }

  // Render en panel desktop (#cart) y en drawer mobile (#cartDrawerBody)
  function renderCart(){
    // contenedores posibles
    const targets = [
      {root: $('#cart'), totalLbl: $('#cartTotal')},
      {root: $('#cartDrawerBody'), totalLbl: $('#cartTotalMobile')}
    ];
    targets.forEach(t=>{
      if(!t.root) return;
      t.root.innerHTML = CART.length? '' : '<div class="mini">Vacío. Agrega productos del menú.</div>';
      CART.forEach(function(it){
        const row = document.createElement('div'); row.className = 'cart-row';
        row.innerHTML =
          '<div><div>'+it.nombre+'</div>' + (it.nota? '<div class="mini">📝 '+it.nota+'</div>':'' ) + '</div>' +
          '<div class="pill">' + money(it.precio) + '</div>' +
          '<div class="qty">' +
            '<button class="btn ghost">−</button>' +
            '<input type="number" min="0" value="' + it.qty + '" />' +
            '<button class="btn ghost">+</button>' +
          '</div>' +
          '<div style="text-align:right;font-weight:700;">' + money(it.precio*it.qty) + '</div>';
        const btnMenos = row.querySelectorAll('button')[0];
        const input = row.querySelector('input');
        const btnMas = row.querySelectorAll('button')[1];
        btnMenos.addEventListener('click', function(){ changeQty(it._key, it.qty-1); });
        btnMas.addEventListener('click',  function(){ changeQty(it._key, it.qty+1); });
        input.addEventListener('change', function(e){ changeQty(it._key, e.target.value); });
        t.root.appendChild(row);
      });
      if(t.totalLbl) t.totalLbl.textContent = money(total());
    });

    // Mini-barra
    const bar = $('#miniCartBar');
    if(bar){
      if(CART.length>0){ bar.classList.remove('hidden'); }
      $('#miniCount').textContent = String(CART.reduce((s,i)=>s+i.qty,0));
      $('#miniTotal').textContent = money(total());
    }
  }

  // Crear orden (función común)
  function crearOrdenComun(nota){
    if(CART.length===0){ alert('Agrega productos antes de crear la orden.'); return; }
    const items = CART.map(function(it){ const {_key, ...rest} = it; return rest; });
    const orden = { id:'o_'+uid(), items, total: total(), nota: (nota||'').trim(), hora: nowHM() };
    window.SMState.crearOrden(orden);
    CART.length = 0; renderCart();
    // limpia inputs de notas globales si existen
    if($('#notaCart')) $('#notaCart').value = '';
    if($('#notaCartMobile')) $('#notaCartMobile').value = '';
    // cierra drawer si estaba abierto
    const dlg = $('#cartDrawer'); if(dlg && typeof dlg.close==='function' && dlg.open) dlg.close();
    alert('Orden enviada a /kitchen ✅');
  }

  // Botones (desktop)
  if($('#btnVaciar')) $('#btnVaciar').addEventListener('click', function(){ CART.length = 0; renderCart(); });
  if($('#btnCrearOrden')) $('#btnCrearOrden').addEventListener('click', function(){
    crearOrdenComun($('#notaCart')? $('#notaCart').value : '');
  });

  // Mini-barra (mobile)
  const dlg = $('#cartDrawer');
  if($('#miniCartOpen')) $('#miniCartOpen').addEventListener('click', function(){ if(dlg && typeof dlg.showModal==='function') dlg.showModal(); });
  if($('#drawerClose')) $('#drawerClose').addEventListener('click', function(){ if(dlg && typeof dlg.close==='function') dlg.close(); });
  if($('#miniCreate')) $('#miniCreate').addEventListener('click', function(){
    // si el drawer no está abierto, usamos la nota desktop si existe (normalmente vacío en mobile)
    crearOrdenComun($('#notaCartMobile')? $('#notaCartMobile').value : ($('#notaCart')? $('#notaCart').value : ''));
  });
  if($('#btnVaciarMobile')) $('#btnVaciarMobile').addEventListener('click', function(){ CART.length = 0; renderCart(); });
  if($('#btnCrearOrdenMobile')) $('#btnCrearOrdenMobile').addEventListener('click', function(){
    crearOrdenComun($('#notaCartMobile')? $('#notaCartMobile').value : '');
  });

  // Init
  renderMenu('all'); renderCart();
})();
