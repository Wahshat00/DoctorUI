(() => {
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function toast(message) { const el=$("toast"); if(!el)return; el.textContent=message; el.classList.add("show"); clearTimeout(el._timer); el._timer=setTimeout(()=>el.classList.remove("show"),3400); }
  window.$=$; window.escapeHTML=escapeHTML; window.toast=toast;
})();
