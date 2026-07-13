/* ===== "Start a Project" → meeting scheduling link =====
   Set BOOKING_URL to your scheduling link (Cal.com / Calendly / etc.).
   Until it's set, the buttons don't navigate anywhere. */
var BOOKING_URL = ""; // e.g. "https://cal.com/helium/intro"
(function () {
  document.querySelectorAll('[data-book]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (BOOKING_URL) window.open(BOOKING_URL, '_blank', 'noopener');
    });
  });
})();

(function () {
  var tabs = document.querySelectorAll('.industry-tab');
  var panels = document.querySelectorAll('.motion-panel');

  function activate(key) {
    tabs.forEach(function (t) {
      var on = t.dataset.panel === key;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.forEach(function (p) {
      p.classList.toggle('is-active', p.dataset.panel === key);
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activate(tab.dataset.panel);
    });
  });
})();

/* ===== Live Score Rings — faithful recreation of score-ring.tsx ===== */
(function () {
  var SVGNS = 'http://www.w3.org/2000/svg';
  var STROKE = 8;
  var DURATION = 1400;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function buildRing(el) {
    var value = parseFloat(el.dataset.value) || 0;
    var max = parseFloat(el.dataset.max) || 100;
    var suffix = el.dataset.suffix || '';
    var color = el.dataset.color || '#f5f5f7';
    var label = el.dataset.label || '';

    // Match score-ring.tsx: desktop 125/8/100, mobile 100/6/70.
    var mobile = window.innerWidth < 768;
    var size = mobile ? 100 : 125;
    var stroke = mobile ? 6 : 8;
    var inner = mobile ? 70 : 100;
    var radius = (size - stroke) / 2;
    var circumference = 2 * Math.PI * radius;

    el.style.width = size + 'px';
    el.style.height = size + 'px';

    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);

    var track = document.createElementNS(SVGNS, 'circle');
    track.setAttribute('cx', size / 2);
    track.setAttribute('cy', size / 2);
    track.setAttribute('r', radius - stroke / 2);
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', '#0c0c0c');
    track.setAttribute('stroke-width', 1.5);

    var arc = document.createElementNS(SVGNS, 'circle');
    arc.setAttribute('cx', size / 2);
    arc.setAttribute('cy', size / 2);
    arc.setAttribute('r', radius);
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', color);
    arc.setAttribute('stroke-width', stroke);
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute('stroke-dasharray', circumference);
    arc.setAttribute('stroke-dashoffset', circumference);

    svg.appendChild(track);
    svg.appendChild(arc);

    var disc = document.createElement('div');
    disc.className = 'score-ring-disc';
    disc.style.width = inner + 'px';
    disc.style.height = inner + 'px';
    var num = document.createElement('span');
    num.className = 'score-num';
    num.textContent = '0' + suffix;
    var lbl = document.createElement('span');
    lbl.className = 'score-lbl';
    lbl.textContent = label;
    disc.appendChild(num);
    disc.appendChild(lbl);

    el.appendChild(svg);
    el.appendChild(disc);

    var raf = 0;
    var fraction = Math.max(0, Math.min(1, value / max));

    function reset() {
      cancelAnimationFrame(raf);
      arc.setAttribute('stroke-dashoffset', circumference);
      num.textContent = '0' + suffix;
    }

    function run() {
      cancelAnimationFrame(raf);
      var start = performance.now();
      (function tick(now) {
        var t = Math.min(1, (now - start) / DURATION);
        var progress = easeOutCubic(t);
        arc.setAttribute('stroke-dashoffset', circumference * (1 - fraction * progress));
        num.textContent = Math.round(value * progress) + suffix;
        if (t < 1) raf = requestAnimationFrame(tick);
      })(start);
    }

    return { run: run, reset: reset, el: el };
  }

  document.querySelectorAll('.score-demo').forEach(function (demo) {
    var rings = [].map.call(demo.querySelectorAll('.score-ring'), buildRing);

    // Fire on scroll-in, reset on exit — mirrors the source's IntersectionObserver.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) rings.forEach(function (r) { r.run(); });
        else rings.forEach(function (r) { r.reset(); });
      });
    }, { threshold: 0.4 });
    io.observe(demo);

    var scope = demo.closest('.motion-panel') || demo.parentElement;
    var replay = scope && scope.querySelector('[data-demo-replay]');
    if (replay) {
      replay.addEventListener('click', function () {
        rings.forEach(function (r) { r.reset(); });
        // next frame so the reset paints before re-running
        requestAnimationFrame(function () {
          rings.forEach(function (r) { r.run(); });
        });
      });
    }
  });
})();

/* ===== blurScaleIn reveal — recreates the framework's on-view stagger ===== */
(function () {
  document.querySelectorAll('[data-reveal-scene]').forEach(function (scene) {
    var items = scene.querySelectorAll('[data-reveal]');
    function show() { items.forEach(function (el) { el.classList.add('is-revealed'); }); }
    function hide() { items.forEach(function (el) { el.classList.remove('is-revealed'); }); }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) show();
        else hide();
      });
    }, { threshold: 0.15 });
    io.observe(scene);

    var scope = scene.closest('.motion-panel') || scene.parentElement;
    var replay = scope && scope.querySelector('[data-demo-replay]');
    if (replay) {
      replay.addEventListener('click', function () {
        hide();
        requestAnimationFrame(function () {
          requestAnimationFrame(show);
        });
      });
    }
  });
})();

/* ===== Opening Reveal — real _REP Lottie wordmark ===== */
(function () {
  if (typeof lottie === 'undefined') return;
  document.querySelectorAll('[data-lottie]').forEach(function (el) {
    lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: el.dataset.lottie
    });
  });
})();

/* ===== Kinetic Scroll Story — stacking cards + staggered overlays ===== */
(function () {
  document.querySelectorAll('[data-kss]').forEach(function (stage) {
    var cards = [].slice.call(stage.querySelectorAll('.kss-card'));
    var dots = [].slice.call(stage.querySelectorAll('.kss-dot'));
    var N = cards.length;
    var active = 0;
    var timer = 0;

    function apply() {
      cards.forEach(function (card, i) {
        var d = active - i;
        var ty, sc, op;
        if (d < 0) { ty = 10; sc = 1; op = 0; }            // not entered yet
        else if (d === 0) { ty = 0; sc = 1; op = 1; }       // active, centered
        else { ty = -2 * d; sc = Math.max(0.62, 1 - 0.075 * d); op = Math.max(0.3, 1 - 0.14 * d); } // receded
        card.style.transform = 'translateY(' + ty + '%) scale(' + sc + ')';
        card.style.opacity = op;
        card.classList.toggle('is-active', i === active);

        var ovs = card.querySelectorAll('.kss-ov');
        [].forEach.call(ovs, function (ov, oi) {
          if (i === active) {
            setTimeout(function () { if (active === i) ov.classList.add('is-visible'); }, 130 + oi * 80);
          } else {
            ov.classList.remove('is-visible');
          }
        });
      });
      dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === active); });
    }

    // Snappier at the start: the first couple of scenes advance quicker,
    // then it settles into a slower dwell.
    var STEP_MS = [1300, 1800, 2600];
    var step = 0;
    function go(i) { active = ((i % N) + N) % N; apply(); }
    function schedule() {
      stop();
      var delay = STEP_MS[Math.min(step, STEP_MS.length - 1)];
      timer = setTimeout(function () { step++; go(active + 1); schedule(); }, delay);
    }
    function start() { step = 0; schedule(); }
    function stop() { if (timer) { clearTimeout(timer); timer = 0; } }

    apply();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
    }, { threshold: 0.3 });
    io.observe(stage);

    var scope = stage.closest('.motion-panel');
    var replay = scope && scope.querySelector('[data-demo-replay]');
    if (replay) replay.addEventListener('click', function () { go(0); start(); });
  });
})();

/* ===== 3D Product Rotation — Always-On video accordion ===== */
(function () {
  document.querySelectorAll('[data-ao]').forEach(function (stage) {
    var videos = [].slice.call(stage.querySelectorAll('.ao-video'));
    var pills = [].slice.call(stage.querySelectorAll('.ao-pill'));

    function activeIndex() {
      for (var i = 0; i < videos.length; i++) if (videos[i].classList.contains('is-active')) return i;
      return 0;
    }
    function setActive(i) {
      videos.forEach(function (v, vi) {
        var on = vi === i;
        v.classList.toggle('is-active', on);
        if (on) { v.play().catch(function () {}); } else { v.pause(); }
      });
      pills.forEach(function (p, pi) { p.classList.toggle('is-active', pi === i); });
    }
    pills.forEach(function (p) {
      p.addEventListener('click', function () { setActive(parseInt(p.dataset.i, 10)); });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { var v = videos[activeIndex()]; if (v) v.play().catch(function () {}); }
        else videos.forEach(function (v) { v.pause(); });
      });
    }, { threshold: 0.2 });
    io.observe(stage);
  });
})();
