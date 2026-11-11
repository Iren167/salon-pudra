(function () {
  var bar = document.querySelector('.s-bar'), burger = document.querySelector('.s-bar__burger');
  if (bar && burger) {
    burger.addEventListener('click', function () { var o = bar.classList.toggle('is-open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    bar.querySelectorAll('.s-bar__nav a').forEach(function (a) { a.addEventListener('click', function () { bar.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }); });
  }
  var links = [].slice.call(document.querySelectorAll('.s-bar__nav a'));
  var map = links.map(function (a) { return { a: a, el: document.querySelector(a.getAttribute('href')) }; }).filter(function (m) { return m.el; });
  var tick = false;
  function frame() {
    tick = false;
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty('--sp', h > 0 ? Math.min(y / h, 1).toFixed(4) : 0);
    var probe = y + innerHeight * 0.4, cur = null;
    map.forEach(function (m) { if (m.el.getBoundingClientRect().top + y <= probe) cur = m; });
    map.forEach(function (m) { m.a.classList.toggle('is-on', m === cur); });
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame); frame();

  /* подбор цены по длине волос */
  var pick = document.querySelector('[data-x-pick]');
  if (pick) {
    var L = [{ n: 'Короткие', cut: 1800, col: 3500, h: 36 }, { n: 'До плеч', cut: 2200, col: 4500, h: 58 }, { n: 'До лопаток', cut: 2600, col: 5500, h: 82 }, { n: 'Ниже лопаток', cut: 3000, col: 6800, h: 104 }];
    var chips = pick.querySelector('.x-pick__chips'), cut = pick.querySelector('[data-cut]'), col = pick.querySelector('[data-col]'), hair = pick.querySelector('.hair');
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    function set(i) {
      var s = L[i]; [].forEach.call(chips.children, function (c, k) { c.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      cut.textContent = 'от ' + fmt(s.cut) + ' ₽'; col.textContent = 'от ' + fmt(s.col) + ' ₽';
      hair.setAttribute('height', s.h);
    }
    L.forEach(function (s, i) { var b = document.createElement('button'); b.type = 'button'; b.textContent = s.n; b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', function () { set(i); }); chips.appendChild(b); });
    set(1);
  }

  /* волна на кнопках */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.s-btn'); if (!b) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), x = document.createElement('span');
    x.className = 'x-ripple'; x.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
    b.appendChild(x); setTimeout(function () { x.remove(); }, 650);
  });
})();

/* 3D-карусель: автопрокрутка, стрелки, точки, перетаскивание, клавиатура */
(function () {
  var cube = document.querySelector('[data-x-cube]'); if (!cube) return;
  var ring = cube.querySelector('.x-cube__ring'), faces = [].slice.call(cube.querySelectorAll('.x-cube__face'));
  var dots = [].slice.call(document.querySelectorAll('.x-cube__dot')), n = faces.length, step = 360 / n;
  var tEl = document.querySelector('[data-cube-title]'), sEl = document.querySelector('[data-cube-sub]');
  var subs = ['Балаяж', 'Стрижка и цвет', 'Стрижка', 'Стрижка и цвет', 'Окрашивание', 'Омбре', 'Яркое окрашивание', 'Стрижка'];
  var rot = 0, cur = 0, timer = null, drag = false, sx = 0, sr = 0, moved = 0, visible = false, hover = false;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  cube.setAttribute('tabindex', '0'); cube.setAttribute('role', 'region'); cube.setAttribute('aria-label', 'Карусель работ, стрелки влево и вправо листают');
  function paint() {
    cur = ((Math.round(-rot / step) % n) + n) % n;
    ring.style.setProperty('--rot', rot + 'deg');
    faces.forEach(function (f, i) { f.classList.toggle('is-front', i === cur); });
    dots.forEach(function (d, i) { d.classList.toggle('is-on', i === cur); });
    var cap = faces[cur].querySelector('figcaption'); if (tEl && cap) tEl.textContent = cap.textContent; if (sEl) sEl.textContent = subs[cur] || '';
  }
  function go(delta) { rot -= delta * step; paint(); }
  function to(i) { var d = i - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n; go(d); }
  cube.querySelector('.x-cube__nav--next').addEventListener('click', function () { go(1); restart(); });
  cube.querySelector('.x-cube__nav--prev').addEventListener('click', function () { go(-1); restart(); });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { to(i); restart(); }); });
  cube.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(1); restart(); e.preventDefault(); } if (e.key === 'ArrowLeft') { go(-1); restart(); e.preventDefault(); } });
  cube.addEventListener('pointerdown', function (e) { if (e.target.closest('.x-cube__nav')) return; drag = true; moved = 0; sx = e.clientX; sr = rot; ring.classList.add('is-drag'); stop(); try { cube.setPointerCapture(e.pointerId); } catch (x) {} });
  cube.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); rot = sr + dx * 0.32; ring.style.setProperty('--rot', rot + 'deg'); });
  function end() { if (!drag) return; drag = false; ring.classList.remove('is-drag'); rot = -Math.round(-rot / step) * step; paint(); restart(); }
  cube.addEventListener('pointerup', end); cube.addEventListener('pointercancel', end);
  cube.addEventListener('mouseenter', function () { hover = true; stop(); }); cube.addEventListener('mouseleave', function () { hover = false; restart(); });
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { stop(); if (still || hover || !visible) return; timer = setInterval(function () { go(1); }, 3600); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; restart(); }, { threshold: .3 }).observe(cube); else visible = true;
  paint();
})();
