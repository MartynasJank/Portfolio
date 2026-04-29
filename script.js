(function () {
  'use strict';

  var isTouchDevice = window.matchMedia('(hover: none)').matches;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. CUSTOM CURSOR ──────────────────────────────────────
  if (!isTouchDevice) {
    var ring = document.getElementById('cursor-ring');
    var dot  = document.getElementById('cursor-dot');

    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var ringX  = mouseX;
    var ringY  = mouseY;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top  = mouseY + 'px';
    });

    function lerp(a, b, t) { return a + (b - a) * t; }

    (function animateCursor() {
      ringX = lerp(ringX, mouseX, 0.12);
      ringY = lerp(ringY, mouseY, 0.12);
      ring.style.left = ringX + 'px';
      ring.style.top  = ringY + 'px';
      requestAnimationFrame(animateCursor);
    })();

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('a, button, .project-card, #terminal-input, .nav-logo, .btn')) {
        document.body.classList.add('cursor-hover');
      } else {
        document.body.classList.remove('cursor-hover');
      }
    });
  }

  // ── 2. TYPEWRITER ─────────────────────────────────────────
  var typeTarget = document.getElementById('typewriter-target');
  var typeCursor = document.getElementById('type-cursor');
  var TAGLINE = "I build things that work.";

  if (reducedMotion) {
    typeTarget.textContent = TAGLINE;
  } else {
    var charIdx = 0;
    setTimeout(function () {
      var typeInterval = setInterval(function () {
        typeTarget.textContent += TAGLINE[charIdx++];
        if (charIdx >= TAGLINE.length) {
          clearInterval(typeInterval);
          // Hide blinking cursor after typing completes
          setTimeout(function () {
            if (typeCursor) typeCursor.style.display = 'none';
          }, 1500);
        }
      }, 50);
    }, 950);
  }

  // ── 3. GLITCH + LETTER SCRAMBLE ───────────────────────────
  var heroName = document.querySelector('.hero-name');

  if (!reducedMotion && heroName) {
    // Letter scramble on hover
    var originalText  = 'Martynas';
    var scrambleChars = '!<>-_\\/[]{}=+*^?#@$%';
    var scrambleRaf   = null;
    var isScrambling  = false;

    heroName.addEventListener('mouseenter', function () {
      if (isScrambling) return;
      isScrambling = true;
      var start    = null;
      var duration = 520;

      (function frame(ts) {
        if (!start) start = ts;
        var progress   = Math.min((ts - start) / duration, 1);
        var locked     = Math.floor(progress * originalText.length);
        var result     = '';

        for (var i = 0; i < originalText.length; i++) {
          if (originalText[i] === ' ') {
            result += ' ';
          } else if (i < locked) {
            result += originalText[i];
          } else {
            result += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }
        }

        heroName.textContent = result;

        if (progress < 1) {
          scrambleRaf = requestAnimationFrame(frame);
        } else {
          heroName.textContent = originalText;
          isScrambling = false;
        }
      })(performance.now());
    });

    heroName.addEventListener('mouseleave', function () {
      if (scrambleRaf) {
        cancelAnimationFrame(scrambleRaf);
        scrambleRaf = null;
      }
      isScrambling = false;
      heroName.textContent = originalText;
    });
  }

  // ── 4. TERMINAL WIDGET ────────────────────────────────────
  var termBody  = document.getElementById('terminal-body');
  var termInput = document.getElementById('terminal-input');
  var termBooted = false;
  var cmdHistory = [];
  var histIdx    = -1;

  var COMMANDS = {
    'whoami': [
      'martynas jankauskas',
      'full-stack developer',
      'vilnius, lithuania',
    ],
    'ls projects/': [
      'movie-picker/       [laravel · mysql]',
      'tiktok-shuffle/     [vanilla js · vite]',
    ],
    'ls': [
      'movie-picker/       [laravel · mysql]',
      'tiktok-shuffle/     [vanilla js · vite]',
    ],
    'cat skills.txt': [
      'PHP · Laravel · Node.js · Python',
      'MySQL · MongoDB · Redis',
      'Docker · Linux · CI/CD · Nginx',
      'REST · GraphQL · SaaS · APIs',
      '──────────────────────────────',
      '(6 yrs · coffee-driven architecture)',
    ],
    'help': [
      'available commands:',
      '  whoami',
      '  ls projects/',
      '  cat skills.txt',
      '  clear',
    ],
  };

  function termPrint(text, cls) {
    var line = document.createElement('div');
    line.className = 'terminal-line' + (cls ? ' ' + cls : '');
    line.textContent = text;
    termBody.appendChild(line);
    termBody.scrollTop = termBody.scrollHeight;
  }

  function runCommand(raw) {
    var cmd = raw.trim().toLowerCase();
    termPrint('$ ' + raw, 'terminal-prompt-echo');

    if (cmd === 'clear') {
      termBody.innerHTML = '';
      return;
    }

    var output = COMMANDS[cmd];
    if (output) {
      output.forEach(function (line, i) {
        setTimeout(function () { termPrint(line, 'terminal-output'); }, i * 65);
      });
    } else if (cmd !== '') {
      termPrint('command not found: ' + cmd, 'terminal-error');
      termPrint('type "help" for available commands', 'terminal-hint');
    }
  }

  termInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      histIdx = Math.min(histIdx + 1, cmdHistory.length - 1);
      termInput.value = cmdHistory[histIdx] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      histIdx = Math.max(histIdx - 1, -1);
      termInput.value = histIdx === -1 ? '' : cmdHistory[histIdx];
    } else if (e.key === 'Enter') {
      var val = termInput.value;
      termInput.value = '';
      if (val.trim()) { cmdHistory.unshift(val.trim()); histIdx = -1; }
      runCommand(val);
    }
  });

  function bootTerminal() {
    if (termBooted) return;
    termBooted = true;

    var steps = [
      { delay: 350,  fn: function () { termPrint('$ whoami', 'terminal-prompt-echo'); } },
      { delay: 750,  fn: function () {
          COMMANDS['whoami'].forEach(function (l, i) {
            setTimeout(function () { termPrint(l, 'terminal-output'); }, i * 65);
          });
      }},
      { delay: 1800, fn: function () { termPrint('$ ls projects/', 'terminal-prompt-echo'); } },
      { delay: 2200, fn: function () {
          COMMANDS['ls projects/'].forEach(function (l, i) {
            setTimeout(function () { termPrint(l, 'terminal-output'); }, i * 65);
          });
      }},
      { delay: 3100, fn: function () {
          termInput.disabled = false;
          if (!isTouchDevice) termInput.focus();
      }},
    ];

    steps.forEach(function (step) {
      setTimeout(step.fn, step.delay);
    });
  }

  // ── 5. SCROLL REVEAL + TERMINAL BOOT ──────────────────────
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.id === 'terminal') bootTerminal();
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  // ── 6. NAV SCROLL STATE ───────────────────────────────────
  var nav      = document.getElementById('nav');
  var sentinel = document.getElementById('hero-sentinel');

  var navObserver = new IntersectionObserver(function (entries) {
    nav.classList.toggle('scrolled', !entries[0].isIntersecting);
  }, { threshold: 0 });

  navObserver.observe(sentinel);

  // ── 7. PROJECT CARD CLICK + BEEP ──────────────────────────
  function beep() {
    try {
      var ctx  = new (window.AudioContext || window.webkitAudioContext)();
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 820;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // AudioContext unavailable — fail silently
    }
  }

  document.querySelectorAll('.project-card[data-url]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      // Don't double-open if clicking the explicit <a> link inside
      if (e.target.closest('.card-link')) return;
      beep();
      window.open(card.dataset.url, '_blank', 'noopener,noreferrer');
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        beep();
        window.open(card.dataset.url, '_blank', 'noopener,noreferrer');
      }
    });
  });

  // ── 8. KONAMI CODE / MATRIX RAIN ──────────────────────────
  var KONAMI = [
    'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
    'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
    'b','a'
  ];
  var konamiIdx = 0;

  document.addEventListener('keydown', function (e) {
    if (e.key === KONAMI[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === KONAMI.length) {
        konamiIdx = 0;
        triggerMatrixRain();
      }
    } else {
      konamiIdx = 0;
    }
  });

  function triggerMatrixRain() {
    var canvas = document.getElementById('easter-canvas');
    var ctx    = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    var charW  = 14;
    var cols   = Math.floor(canvas.width / charW);
    var drops  = [];
    for (var i = 0; i < cols; i++) drops[i] = Math.random() * -50;

    var charset = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF!@#$%^&*';

    function draw() {
      ctx.fillStyle = 'rgba(15, 14, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '13px Courier New, monospace';

      for (var i = 0; i < drops.length; i++) {
        var bright = Math.random() > 0.95;
        ctx.fillStyle = bright ? '#ffffff' : '#ff8906';
        var char = charset[Math.floor(Math.random() * charset.length)];
        ctx.fillText(char, i * charW, drops[i] * charW);

        if (drops[i] * charW > canvas.height && Math.random() > 0.97) {
          drops[i] = 0;
        }
        drops[i] += 0.5;
      }
    }

    var rainInterval = setInterval(draw, 40);

    setTimeout(function () {
      clearInterval(rainInterval);
      canvas.style.display = 'none';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 4500);
  }

})();
