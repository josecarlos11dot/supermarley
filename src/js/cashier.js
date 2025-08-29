(function(){
  const MENU = window.CATALOG;

  // Construye filtros dinámicos
  const cats = ['all', ...new Set(MENU.map(p=>p.categoria))];
  const filtros = $('#filtrosCategorias');
  filtros.innerHTML = cats.map((c)=> `<button class="btn ghost" data-cat="${c}">${c==='all'?'Todos':(c.charAt(0).toUpperCase()+c.slice(1))}</button>`).join('');
  filtros.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-cat]'); if(!btn) return;
    [...filtros.querySelectorAll('button')].forEach(b=> b.classList.remove('primary'));
    btn.classList.add('primary');
    renderMenu(btn.dataset.cat);
  });

  // Render del menú con input de nota por pieza y chips rápidos
  function renderMenu(filtro='all'){
    const cont = $('#menu'); cont.innerHTML = '';
    const lista = (filtro==='all') ? MENU : MENU.filter(p=> p.categoria===filtro);
    lista.forEach(prod=>{
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="pic">${prod.emoji}</div>
        <div class="info">
          <div style="font-weight:700">${prod.nombre}</div>
          <div class="price">${money(prod.precio)}</div>
          <div class="mini">Personaliza esta pieza</div>
          <div class="toolbar" data-chips>
            <button class="btn ghost chip" data-val="sin cebolla">sin cebolla</button>
            <button class="btn ghost chip" data-val="con queso">con queso</button>
            <button class="btn ghost chip" data-val="bien dorada">bien dorada</button>
          </div>
          <div class="toolbar" style="gap:8px;">
            <input type="text" placeholder="Nota p/ esta pieza (opcional)" data-note style="flex:1; min-width:0;" />
            <button class="btn" data-add>Agregar</button>
          </div>
        </div>
      `;
      const noteInput = div.querySelector('[data-note]');
      div.querySelectorAll('[data-chips] .chip').forEach(ch=>{
        ch.addEventListener('click', ()=>{
          ch.classList.toggle('primary');
          const chips = [...div.querySelectorAll('[data-chips] .chip.primary')].map(c=>c.dataset.val);
          const manual = noteInput.value.trim();
          const combo = [manual, ...chips].filter(Boolean).join(', ');
          noteInput.value = combo;
        });
      });
      div.querySelector('[data-add]').addEventListener('click', ()=>{
        const nota = (noteInput.value || '').trim();
        addToCart(prod, nota);
        noteInput.value = '';
        div.querySelectorAll('[data-chips] .chip').forEach(c=> c.classList.remove('primary'));
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
    if(idx>=0) CART[idx].qty++;
    else CART.push({_key:key, id:prod.id, nombre:prod.nombre, precio:prod.precio, qty:1, nota});
    renderCart();
  }
  function changeQty(key, qty){
    const it = CART.find(x=> x._key===key); if(!it) return;
    it.qty = Math.max(0, qty|0);
    for(let i=CART.length-1;i>=0;i--) if(CART[i].qty<=0) CART.splice(i,1);
    renderCart();
  }
  function total(){ return CART.reduce((s,i)=> s+i.precio*i.qty, 0); }
  function renderCart(){
    const cont = $('#cart'); cont.innerHTML = CART.length? '' : '<div class="mini">Vacío. Agrega productos del menú.</div>';
    CART.forEach(it=>{
      const row = document.createElement('div'); row.className = 'cart-row';
      row.innerHTML = `
        <div>
          <div>${it.nombre}</div>
          ${it.nota? `<div class="mini">📝 ${it.nota}</div>`:''}
        </div>
        <div class="pill">${money(it.precio)}</div>
        <div class="qty">
          <button class="btn ghost">−</button>
          <input type="number" min="0" value="\${it.qty}" />
          <button class="btn ghost">+</button>
        </div>
        <div style="text-align:right;font-weight:700;">\${money(it.precio*it.qty)}</div>
      `;
      const [btnMenos,input,btnMas] = row.querySelectorAll('button,input');
      btnMenos.addEventListener('click', ()=> changeQty(it._key, it.qty-1));
      btnMas.addEventListener('click', ()=> changeQty(it._key, it.qty+1));
      input.addEventListener('change', e=> changeQty(it._key, e.target.value));
      cont.appendChild(row);
    });
    $('#cartTotal').textContent = money(total());
  }

  // Botones
  $('#btnVaciar').addEventListener('click', ()=>{ CART.length = 0; renderCart(); });
  $('#btnCrearOrden').addEventListener('click', ()=>{
    if(CART.length===0) return alert('Agrega productos antes de crear la orden.');
    const items = CART.map(({_key, ...i})=> ({...i}));
    const orden = { id:'o_'+uid(), items, total: total(), nota: ($('#notaCart')?.value || '').trim(), hora: nowHM() };
    window.SMState.crearOrden(orden);
    CART.length = 0; if($('#notaCart')) $('#notaCart').value = ''; renderCart();
    alert('Orden enviada a /kitchen ✅');
  });

  // Init
  renderMenu('all'); renderCart();
})();
