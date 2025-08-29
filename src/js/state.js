(function(){
  const NS = 'sm_';
  const KEYS = { PEND: NS+'pendientes', BIN: NS+'papelera' };
  const STATE = {
    pendientes: load(KEYS.PEND, []),
    papelera:   load(KEYS.BIN,  [])
  };
  function load(k, def){ try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } }
  function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
  const chan = new BroadcastChannel('super_marley_bus');
  function publish(type, payload){ chan.postMessage({ type, payload, ts: Date.now() }); }
  window.SMState = {
    getPendientes(){ return [...STATE.pendientes]; },
    getPapelera(){ return [...STATE.papelera]; },
    crearOrden(orden){
      STATE.pendientes.unshift(orden);
      save(KEYS.PEND, STATE.pendientes);
      publish('pendientes:update', STATE.pendientes);
    },
    moverAPapelera(id, motivo){
      const idx = STATE.pendientes.findIndex(o=> o.id===id);
      if(idx<0) return;
      const [orden] = STATE.pendientes.splice(idx,1);
      const registro = { ...orden, motivo, timestamp: Date.now() };
      STATE.papelera.unshift(registro);
      STATE.papelera = STATE.papelera.slice(0,5);
      save(KEYS.PEND, STATE.pendientes);
      save(KEYS.BIN, STATE.papelera);
      publish('pendientes:update', STATE.pendientes);
      publish('papelera:update', STATE.papelera);
    }
  };
  chan.addEventListener('message', (e)=>{
    const { type, payload } = e.data || {};
    if(type==='pendientes:update'){
      STATE.pendientes = payload; save(KEYS.PEND, STATE.pendientes);
      window.dispatchEvent(new CustomEvent('sm:pendientes:update'));
    }
    if(type==='papelera:update'){
      STATE.papelera = payload; save(KEYS.BIN, STATE.papelera);
      window.dispatchEvent(new CustomEvent('sm:papelera:update'));
    }
  });
  window.addEventListener('storage', (e)=>{
    if(e.key===KEYS.PEND){ STATE.pendientes = load(KEYS.PEND, []); window.dispatchEvent(new CustomEvent('sm:pendientes:update')); }
    if(e.key===KEYS.BIN){  STATE.papelera   = load(KEYS.BIN,  []); window.dispatchEvent(new CustomEvent('sm:papelera:update')); }
  });
})();
