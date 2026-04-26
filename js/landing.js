/* ============================================================
   TASKNEXUS LANDING — PORTAL ANIMATION ENGINE (v2)

   Key design:
   - SVG mask text scales 1x → 220x on scroll (cinematic ease)
   - Hero content opacity/blur/scale driven DIRECTLY by JS progress
     (no CSS class snap — smooth the entire way)
   - Curtain fades out from progress 65% → 100%
   - Hero reveals from progress 65% → 100%
   - Auto-advance triggers at 30%, completes over 3.5s
   - At completion: curtain removed, hero switches to normal flow
   ============================================================ */

(function () {
  'use strict';

  /* ---- DOM refs ---- */
  const curtain      = document.getElementById('curtain');
  const maskGroup    = document.getElementById('mask-group');
  const heroContent  = document.getElementById('hero-content');
  const glassCard    = document.getElementById('glass-card');
  const introUI      = document.getElementById('intro-ui');
  const progressFill = document.getElementById('progress-fill');
  const progressBar  = document.getElementById('progress-bar');

  /* ---- State ---- */
  let progress      = 0;   // 0 → 1
  let autoAdvancing = false;
  let autoStart     = null;
  let rafId         = null;
  let completed     = false;
  let svgW, svgH, originX, originY;

  /* ---- Easing functions ---- */

  // cubic-bezier(0.77, 0, 0.175, 1) — heavy cinematic, for the mask scale
  function easeCinematic(t) {
    // Numerical approximation via de Casteljau subdivisions
    // Control points: P0=(0,0) P1=(0.77,0) P2=(0.175,1) P3=(1,1)
    let lo = 0, hi = 1, mid;
    for (let i = 0; i < 12; i++) {
      mid = (lo + hi) / 2;
      const x = bezierX(mid, 0.77, 0.175);
      if (x < t) lo = mid; else hi = mid;
    }
    return bezierY(mid, 0, 1);
  }
  function bezierX(t, p1x, p2x) {
    return 3*t*(1-t)*(1-t)*p1x + 3*t*t*(1-t)*p2x + t*t*t;
  }
  function bezierY(t, p1y, p2y) {
    return 3*t*(1-t)*(1-t)*p1y + 3*t*t*(1-t)*p2y + t*t*t;
  }

  // ease-in-out cubic — for auto-advance
  function easeInOutCubic(t) {
    return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  }

  // Smooth clamp: maps a value in [lo,hi] to [0,1]
  function norm(val, lo, hi) {
    return Math.max(0, Math.min(1, (val - lo) / (hi - lo)));
  }

  /* ---- Compute SVG origin (centre of mask text) ---- */
  function computeOrigin() {
    svgW    = window.innerWidth;
    svgH    = window.innerHeight;
    originX = svgW / 2;
    originY = svgH * 0.52;
  }

  /* ====================================================
     CORE: update every layer based on progress (0→1)
     ==================================================== */
  function updatePortal(p) {
    progress = Math.max(0, Math.min(1, p));
    if (completed) return;

    /* ── 1. MASK SCALE: 1x → 220x (cinematic ease) ── */
    const eased = easeCinematic(progress);
    const scale = 1 + eased * 219;
    maskGroup.setAttribute(
      'transform',
      `translate(${originX} ${originY}) scale(${scale}) translate(${-originX} ${-originY})`
    );

    /* ── 2. PROGRESS BAR ── */
    progressFill.style.width = (progress * 100).toFixed(2) + '%';
    progressBar.setAttribute('aria-valuenow', Math.round(progress * 100));

    /* ── 3. INTRO UI — fades + lifts during first 20% ── */
    const introT = norm(progress, 0, 0.20);
    introUI.style.opacity   = (1 - introT).toFixed(3);
    introUI.style.transform = `translateY(${introT * -60}px)`;

    /* ── 4. CURTAIN FADE — 65% → 100% ── */
    const curtainT = norm(progress, 0.65, 1.0);
    curtain.style.opacity = (1 - curtainT).toFixed(3);

    /* ── 5. HERO CONTENT REVEAL — 65% → 100% ── */
    const heroT = norm(progress, 0.65, 1.0);
    // Blur: 40px → 0px
    const blur  = (40 * (1 - heroT)).toFixed(2);
    // Scale: 0.97 → 1.0
    const sc    = (0.97 + 0.03 * heroT).toFixed(4);
    // Opacity: 0 → 1  (slightly delayed — starts at heroT=0.1)
    const opacity = norm(heroT, 0.1, 1.0).toFixed(3);

    heroContent.style.opacity   = opacity;
    heroContent.style.filter    = `blur(${blur}px)`;
    heroContent.style.transform = `scale(${sc})`;

    // Enable pointer-events once hero is mostly visible (heroT >= 0.85)
    heroContent.style.pointerEvents = heroT >= 0.85 ? 'all' : 'none';

    /* ── 6. GLASS CARD misty reveal — starts when hero is 60% revealed ── */
    if (heroT >= 0.60 && !glassCard.classList.contains('revealed')) {
      glassCard.classList.add('revealed');
    }

    /* ── 7. COMPLETION — hand off to normal layout ── */
    if (progress >= 1.0) {
      finalize();
    }
  }

  /* ---- Called once, when progress hits 1.0 ---- */
  function finalize() {
    if (completed) return;
    completed = true;

    // Remove curtain from DOM entirely (no more z-index stacking)
    curtain.remove();

    // Hide progress bar
    progressBar.style.opacity = '0';
    setTimeout(() => progressBar.remove(), 600);

    // Switch hero to normal document flow so user can scroll the page
    // Small delay so the last frame of the JS animation is painted first
    requestAnimationFrame(() => {
      heroContent.classList.add('completed');
      // Clear inline styles that JS was driving — CSS class now takes over
      // (this also restores overflow-y:auto from the stylesheet)
      heroContent.style.cssText = '';
      document.body.style.overflow = '';
    });
  }

  /* ====================================================
     AUTO-ADVANCE: triggered at 30%, runs over 3.5s
     ==================================================== */
  function triggerAutoAdvance() {
    if (autoAdvancing) return;
    autoAdvancing = true;
    const startP = progress;
    autoStart    = performance.now();

    function tick(now) {
      const elapsed  = now - autoStart;
      const duration = 3500; // ms
      const t        = Math.min(elapsed / duration, 1);
      const eased    = easeInOutCubic(t);
      const newP     = startP + eased * (1 - startP);
      updatePortal(newP);
      if (t < 1 && !completed) {
        rafId = requestAnimationFrame(tick);
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  /* ====================================================
     INPUT HANDLERS
     ==================================================== */
  const WHEEL_SENS = 0.0009;
  let lastTouch    = null;

  window.addEventListener('wheel', (e) => {
    if (autoAdvancing || completed) return;
    progress = Math.min(1, Math.max(0, progress + e.deltaY * WHEEL_SENS));
    updatePortal(progress);
    if (progress >= 0.30) triggerAutoAdvance();
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    if (completed) return;
    lastTouch = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (autoAdvancing || completed || lastTouch === null) return;
    const delta = lastTouch - e.touches[0].clientY;
    lastTouch   = e.touches[0].clientY;
    progress    = Math.min(1, Math.max(0, progress + delta * 0.003));
    updatePortal(progress);
    if (progress >= 0.30) triggerAutoAdvance();
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (autoAdvancing || completed) return;
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      progress = Math.min(1, progress + 0.06);
      updatePortal(progress);
      if (progress >= 0.30) triggerAutoAdvance();
    }
  });

  window.addEventListener('resize', () => {
    computeOrigin();
    updatePortal(progress);
  });

  /* ====================================================
     INIT
     ==================================================== */
  function init() {
    // Prevent body scroll during portal animation
    document.body.style.overflow = 'hidden';
    // Also lock the hero-content div so wheel/touch scroll can't peek at features below
    heroContent.style.overflowY = 'hidden';
    heroContent.style.overflowX = 'hidden';
    computeOrigin();
    updatePortal(0);

    // Intro UI fades in gently on load
    introUI.style.opacity = '0';
    introUI.style.transform = 'translateY(20px)';
    requestAnimationFrame(() => {
      introUI.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
      requestAnimationFrame(() => {
        introUI.style.opacity   = '1';
        introUI.style.transform = 'translateY(0)';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ---- Contact form — Formspree AJAX ---- */
(function(){
  const form = document.getElementById('contact-form');
  if(!form) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const sent = document.getElementById('contact-sent');
    btn.textContent = 'Sending…';
    btn.style.opacity = '.7';
    btn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method:'POST',
        body: new FormData(form),
        headers:{ 'Accept':'application/json' }
      });
      if(res.ok){
        form.reset();
        sent.style.display = 'block';
        btn.style.display  = 'none';
      } else {
        btn.textContent = 'Try again';
        btn.style.opacity = '1';
        btn.disabled = false;
        alert('Send failed. Please email us directly.');
      }
    } catch(err){
      btn.textContent = 'Try again';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  });
})();
