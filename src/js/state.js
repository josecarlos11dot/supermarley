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
  function emitLocal(evt){ window.dispatchEvent(new CustomEvent(evt)); }

  window.SMState = {
    getPendientes(){ return [...STATE.pendientes]; },
    getPapelera(){ return [...STATE.papelera]; },       // compat
    getServidos(){ return [...STATE.papelera]; },       // alias
    crearOrden(orden){
      STATE.pendientes.unshift(orden);
      save(KEYS.PEND, STATE.pendientes);
      // avisos locales inmediatos
      emitLocal('sm:pendientes:update');
      // broadcast a otras pestañas
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
      // avisos locales inmediatos
      emitLocal('sm:pendientes:update');
      emitLocal('sm:papelera:update');
      emitLocal('sm:servidos:update'); // nuevo nombre
      // broadcast a otras pestañas
      publish('pendientes:update', STATE.pendientes);
      publish('papelera:update',   STATE.papelera);
    }
  };

  // Cuando llegan eventos de otras pestañas, sincroniza y emite locales
  chan.addEventListener('message', (e)=>{
    const { type, payload } = e.data || {};
    if(type==='pendientes:update'){
      STATE.pendientes = payload; save(KEYS.PEND, STATE.pendientes);
      emitLocal('sm:pendientes:update');
    }
    if(type==='papelera:update'){
      STATE.papelera = payload; save(KEYS.BIN, STATE.papelera);
      emitLocal('sm:papelera:update');
      emitLocal('sm:servidos:update');
    }
  });

  // storage (otras pestañas con localStorage)
  window.addEventListener('storage', (e)=>{
    if(e.key===KEYS.PEND){ STATE.pendientes = load(KEYS.PEND, []); emitLocal('sm:pendientes:update'); }
    if(e.key===KEYS.BIN){  STATE.papelera   = load(KEYS.BIN,  []); emitLocal('sm:papelera:update'); emitLocal('sm:servidos:update'); }
  });
})();
