window.$ = (sel)=> document.querySelector(sel);
window.$$ = (sel)=> [...document.querySelectorAll(sel)];
window.money = (n)=> n.toLocaleString('es-MX',{style:'currency',currency:'MXN'});
window.uid = ()=> Math.random().toString(36).slice(2,9);
window.nowHM = ()=> new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
