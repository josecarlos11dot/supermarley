window.$ = (sel)=> document.querySelector(sel);
window.$$ = (sel)=> [...document.querySelectorAll(sel)];
window.money = (n)=> n.toLocaleString('es-MX',{style:'currency',currency:'MXN'});
window.uid = ()=> Math.random().toString(36).slice(2,9);
window.nowHM = ()=> new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});

/* ---------- Sonidos (Web Audio) ---------- */
(function(){
  const KEY = 'sm_sound_enabled';
  const Vibrate = (ms)=> { try { if(navigator.vibrate) navigator.vibrate(ms); } catch {} };

  let ctx = null;
  function ensureCtx(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state==='suspended') ctx.resume();
    return ctx;
  }

  // tiny synth: uno o dos osciladores con envolvente
  function blip({freq=880, type='sine', dur=0.08, gain=0.06, detune2=0, freq2=0}={}){
    if(!Sound.enabled()) return;
    const ac = ensureCtx();
    const g = ac.createGain(); g.gain.value = 0; g.connect(ac.destination);

    const o1 = ac.createOscillator(); o1.type = type; o1.frequency.value = freq; o1.connect(g);
    let o2 = null;
    if(freq2>0){
      o2 = ac.createOscillator(); o2.type = type; o2.frequency.value = freq2; o2.detune.value = detune2; o2.connect(g);
      o2.start();
    }
    o1.start();

    const now = ac.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    o1.stop(now + dur + 0.02);
    if(o2) o2.stop(now + dur + 0.02);
  }

  const Sound = {
    enabled(flag){
      if(typeof flag==='boolean'){ localStorage.setItem(KEY, JSON.stringify(flag)); return flag; }
      try { return JSON.parse(localStorage.getItem(KEY)) !== false; } catch { return true; }
    },
    toggle(){
      const v = !Sound.enabled(); Sound.enabled(v); Sound.refreshUI(); return v;
    },
    refreshUI(){
      const btns = $$('.sound-toggle');
      btns.forEach(b=>{
        b.textContent = Sound.enabled() ? '🔊 Sonido on' : '🔇 Sonido off';
      });
    },
    play(name){
      switch(name){
        case 'add': blip({freq:900, type:'triangle', dur:0.06, gain:0.07}); Vibrate(10); break;
        case 'hint': blip({freq:1200, type:'square', dur:0.04, gain:0.05}); break;
        case 'send': blip({freq:660, type:'sine', dur:0.09, gain:0.08}); blip({freq:990, type:'sine', dur:0.08, gain:0.06}); Vibrate(20); break;
        case 'served': blip({freq:440, type:'sawtooth', dur:0.08, gain:0.08}); blip({freq:330, type:'sine', dur:0.07, gain:0.06}); Vibrate(15); break;
      }
    }
  };
  window.Sound = Sound;

  // Delegar click en toggles
  window.addEventListener('click', (e)=>{
    const btn = e.target.closest('.sound-toggle');
    if(!btn) return;
    Sound.toggle();
  });

  // Inicializa UI de toggles si los hay
  document.addEventListener('DOMContentLoaded', Sound.refreshUI);
})();
