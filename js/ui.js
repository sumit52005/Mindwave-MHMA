// js/ui.js
// in-page bottom-right notifications (no alerts)
(function () {
  function ensureEl() {
    let el = document.getElementById('me-notification');
    if (!el) {
      el = document.createElement('div');
      el.id = 'me-notification';
      el.style.cssText = [
        'position:fixed',
        'right:20px',
        'bottom:20px',
        'padding:12px 18px',
        'border-radius:12px',
        'color:#fff',
        'font-weight:600',
        'z-index:9999',
        'box-shadow:0 6px 20px rgba(0,0,0,0.12)',
        'opacity:0',
        'transform:translateY(20px)',
        'transition:all .35s ease'
      ].join(';');
      document.body.appendChild(el);
    }
    return el;
  }

  window.showNotification = function (text, type = 'success', duration = 2200) {
    const el = ensureEl();
    el.textContent = text;
    el.style.background = (type === 'error') ? '#e74c3c' : '#28a745';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    // hide after duration
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
    }, duration);
  };
})();
