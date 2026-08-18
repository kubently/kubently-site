document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile nav toggle ---
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navToggle.classList.toggle('is-open', !isOpen);
      mobileNav.classList.toggle('is-open', !isOpen);
      mobileNav.setAttribute('aria-hidden', String(isOpen));
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.classList.remove('is-open');
        mobileNav.classList.remove('is-open');
        mobileNav.setAttribute('aria-hidden', 'true');
        navToggle.focus();
      }
    });

    // Close when clicking outside the header
    document.addEventListener('click', (e) => {
      if (
        mobileNav.classList.contains('is-open') &&
        !e.target.closest('.site-header')
      ) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.classList.remove('is-open');
        mobileNav.classList.remove('is-open');
        mobileNav.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // --- Typewriter Effect ---
  // Each entry: { text, type }
  // type: 'prompt' | 'info' | 'warn' | 'ok' | 'plain'
  const sessionLines = [
    { text: '🔔 ALERT PagerDuty: checkout-api 5xx rate high (prod-eu)', type: 'prompt' },
    { text: '→ kubently investigating … kubectl · metrics · logs · changes', type: 'info' },
    { text: '→ p99 latency 8.4s since 14:02 (prometheus)', type: 'warn' },
    { text: '→ log match ×212: "pool exhausted" in checkout-api', type: 'warn' },
    { text: '→ change: rollout #57 at 14:01 dropped DB_POOL_SIZE', type: 'warn' },
    { text: '✓ RCA posted to #incidents — rollback or restore env var', type: 'ok' },
  ];

  const typewriterElement = document.getElementById('typewriter');

  // Respect prefers-reduced-motion: skip animation, show final state immediately
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typewriterElement) {
    if (prefersReducedMotion) {
      // Show all lines at once, static
      let html = '';
      sessionLines.forEach(line => {
        html += `<div class="tw-line tw-line--${line.type}">${line.text}</div>`;
      });
      // Static cursor at end
      html += '<span class="tw-cursor tw-cursor--static" aria-hidden="true"></span>';
      typewriterElement.innerHTML = html;
    } else {
      // Animated typewriter — engine adapted from original
      let lineIndex = 0;
      let charIndex = 0;
      const typingSpeed = 38;       // ms per character
      const pauseBetweenLines = 700; // ms pause after line completes

      function buildCompletedLines(upTo) {
        let html = '';
        for (let i = 0; i < upTo; i++) {
          const l = sessionLines[i];
          html += `<div class="tw-line tw-line--${l.type}">${l.text}</div>`;
        }
        return html;
      }

      function type() {
        if (lineIndex >= sessionLines.length) {
          // All lines done — show blinking cursor on last line and restart after pause
          setTimeout(() => {
            typewriterElement.innerHTML = '';
            lineIndex = 0;
            charIndex = 0;
            type();
          }, 5000);
          return;
        }

        const currentLine = sessionLines[lineIndex];
        const currentText = currentLine.text.substring(0, charIndex + 1);

        typewriterElement.innerHTML =
          buildCompletedLines(lineIndex) +
          `<div class="tw-line tw-line--${currentLine.type}">${currentText}<span class="tw-cursor" aria-hidden="true"></span></div>`;

        charIndex++;

        if (charIndex < currentLine.text.length) {
          setTimeout(type, typingSpeed);
        } else {
          charIndex = 0;
          lineIndex++;
          setTimeout(type, pauseBetweenLines);
        }
      }

      type();
    }
  }


  // --- Scroll Reveal Animation ---
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Optional: Stop observing once revealed
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.15, // Trigger when 15% visible
    rootMargin: "0px"
  });

  revealElements.forEach(el => revealObserver.observe(el));

});
