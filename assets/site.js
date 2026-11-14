// Ujwal Mahajan — Portfolio Interactive Engine
(function() {
  'use strict';

  // 1. Navigation Scroll & Active Link
  const nav = document.querySelector('.site-nav');
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';

  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 12) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Highlight active link
  document.querySelectorAll('.site-nav a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const cleanHref = href.split('#')[0].replace(/\/$/, '') || '/';
    const isExact = cleanHref === pathname;
    const isParent = cleanHref !== '/' && pathname.startsWith(cleanHref);
    if (isExact || isParent) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('active');
      link.classList.add('active-nav-link');
      if (link.closest('.site-nav') && !link.querySelector('.nav-dot') && !link.classList.contains('site-brand') && !link.classList.contains('btn-primary')) {
        const dot = document.createElement('span');
        dot.className = 'nav-dot';
        dot.setAttribute('aria-hidden', 'true');
        link.style.position = 'relative';
        link.appendChild(dot);
      }
    }
  });

  // 2. Mobile Menu Toggle
  const toggleBtn = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (toggleBtn && mobileNav) {
    function toggleMobile() {
      const open = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!open));
      mobileNav.hidden = open;
      mobileNav.classList.toggle('open', !open);
      document.documentElement.style.overflow = !open ? 'hidden' : '';
    }
    toggleBtn.addEventListener('click', toggleMobile);
    document.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || toggleBtn.getAttribute('aria-expanded') !== 'true') return;
      const items = [toggleBtn, ...mobileNav.querySelectorAll('a,button')];
      const i = items.indexOf(document.activeElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
      e.preventDefault();
      items[next].focus();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && toggleBtn.getAttribute('aria-expanded') === 'true') {
        toggleMobile();
      }
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (toggleBtn.getAttribute('aria-expanded') === 'true') toggleMobile();
      });
    });
  }

  // 3. Desktop Projects Dropdown
  const projItem = document.querySelector('.nav-projects');
  if (projItem) {
    const btn = projItem.querySelector('button');
    const menu = projItem.querySelector('.nav-dropdown');
    if (btn && menu) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        menu.hidden = open;
      });
      document.addEventListener('click', (e) => {
        if (!projItem.contains(e.target)) {
          btn.setAttribute('aria-expanded', 'false');
          menu.hidden = true;
        }
      });
    }
  }

  // 4. Back to Top
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 5. Scroll Reveals
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }

  // 6. Research Page Filter
  const filterBtns = document.querySelectorAll('.research-filter-btn');
  const researchItems = document.querySelectorAll('.research-item');
  if (filterBtns.length && researchItems.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        researchItems.forEach(item => {
          const status = item.getAttribute('data-status');
          if (filter === 'all') {
            item.style.display = '';
          } else if (filter === 'active') {
            item.style.display = (status === 'inProgress' || status === 'design') ? '' : 'none';
          } else {
            item.style.display = (status === filter) ? '' : 'none';
          }
        });
      });
    });
  }

  // 7. Sticky Sidebar TOC Scroll Spy
  const tocLinks = document.querySelectorAll('.toc-link');
  if (tocLinks.length) {
    const sections = Array.from(tocLinks).map(link => {
      const id = link.getAttribute('href').replace('#', '');
      return document.getElementById(id);
    }).filter(Boolean);

    function updateSpy() {
      const scrollPos = window.scrollY + 140;
      let currentId = '';
      sections.forEach(sec => {
        if (sec.offsetTop <= scrollPos) {
          currentId = sec.id;
        }
      });
      tocLinks.forEach(link => {
        const match = link.getAttribute('href') === '#' + currentId;
        link.classList.toggle('active', match);
      });
    }
    window.addEventListener('scroll', updateSpy, { passive: true });
    updateSpy();
  }

  // 8. Resume View & Download Handlers
  const RESUME_URL = '/Ujwal_Mahajan_AI_Engineer_Resume.pdf';
  window.viewResume = function() {
    window.open(RESUME_URL, '_blank', 'noopener,noreferrer');
  };
  window.downloadResume = function() {
    const a = document.createElement('a');
    a.href = RESUME_URL;
    a.download = 'Ujwal_Mahajan_AI_Engineer_Resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 9. Contact Form Validation & Submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const nameInput = document.getElementById('cf-name');
    const emailInput = document.getElementById('cf-email');
    const messageInput = document.getElementById('cf-message');
    const nameErr = document.getElementById('cf-name-error') || document.getElementById('cf-name-err');
    const emailErr = document.getElementById('cf-email-error') || document.getElementById('cf-email-err');
    const messageErr = document.getElementById('cf-message-error') || document.getElementById('cf-message-err');
    const submitBtn = document.getElementById('cf-submit');
    const submitText = document.getElementById('cf-submit-text');
    const bannerSuccess = document.getElementById('cf-success');
    const bannerError = document.getElementById('cf-error');

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;
      if (nameErr) { nameErr.classList.add('hidden'); nameErr.textContent = ''; }
      if (emailErr) { emailErr.classList.add('hidden'); emailErr.textContent = ''; }
      if (messageErr) { messageErr.classList.add('hidden'); messageErr.textContent = ''; }
      if (bannerSuccess) { bannerSuccess.classList.add('hidden'); bannerSuccess.classList.remove('flex'); }
      if (bannerError) { bannerError.classList.add('hidden'); bannerError.classList.remove('flex'); }

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!name) {
        if (nameErr) { nameErr.textContent = 'Your name, please.'; nameErr.classList.remove('hidden'); }
        if (nameInput) nameInput.classList.add('border-crimson');
        valid = false;
      } else if (nameInput) {
        nameInput.classList.remove('border-crimson');
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (emailErr) { emailErr.textContent = "That email doesn't look right."; emailErr.classList.remove('hidden'); }
        if (emailInput) emailInput.classList.add('border-crimson');
        valid = false;
      } else if (emailInput) {
        emailInput.classList.remove('border-crimson');
      }

      if (message.length < 10) {
        if (messageErr) { messageErr.textContent = 'A few more words — at least 10 characters.'; messageErr.classList.remove('hidden'); }
        if (messageInput) messageInput.classList.add('border-crimson');
        valid = false;
      } else if (messageInput) {
        messageInput.classList.remove('border-crimson');
      }

      if (!valid) return;

      if (submitBtn) submitBtn.disabled = true;
      if (submitText) submitText.textContent = 'Sending…';

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message, website: (document.getElementById('cf-website') || {}).value || '' })
        });
        if (!res.ok) throw new Error('Request failed');
        contactForm.classList.add('hidden');
        if (bannerSuccess) {
          bannerSuccess.classList.remove('hidden');
          bannerSuccess.classList.add('flex');
        }
      } catch (err) {
        if (bannerError) {
          bannerError.classList.remove('hidden');
          bannerError.classList.add('flex');
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Send Message';
      }
    });
  }

  // 10. AI Chat Widget
  let chatHistory = [];
  let isSendingChat = false;

  window.toggleChat = function() {
    const win = document.getElementById('chat-window');
    const toggle = document.getElementById('chat-toggle');
    if (!win) return;
    const isOpen = win.classList.contains('open');
    if (isOpen) {
      win.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      win.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      const nudge = document.getElementById('chat-nudge');
      if (nudge) nudge.remove();
      const input = document.getElementById('chat-input');
      if (input) setTimeout(() => input.focus(), 100);
    }
  };

  window.sendChat = async function() {
    if (isSendingChat) return;
    const input = document.getElementById('chat-input');
    const msgs = document.getElementById('chat-messages');
    if (!input || !msgs) return;
    const text = input.value.trim();
    if (!text) return;
    document.querySelectorAll('.chat-chips').forEach(c => c.remove());

    // Add user message
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.textContent = text;
    msgs.appendChild(userDiv);
    chatHistory.push({ role: 'user', content: text });
    input.value = '';
    msgs.scrollTop = msgs.scrollHeight;

    // Loading indicator
    const loadDiv = document.createElement('div');
    loadDiv.className = 'chat-msg loading';
    loadDiv.innerHTML = '<span class="typing-dots" role="status" aria-label="Ujwal is typing"><i></i><i></i><i></i></span>';
    msgs.appendChild(loadDiv);
    msgs.scrollTop = msgs.scrollHeight;
    isSendingChat = true;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      });
      const data = await res.json();
      loadDiv.remove();

      let reply = '';
      if (data.choices && data.choices[0]?.message?.content) {
        reply = data.choices[0].message.content;
      } else if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        reply = data.candidates[0].content.parts[0].text;
      } else if (data.reply) {
        reply = data.reply;
      } else if (data.message) {
        reply = data.message;
      } else if (data.error) {
        reply = typeof data.error === 'string' ? data.error : 'Service currently unavailable. Please reach out via email!';
      } else {
        reply = 'Sorry, could not generate a response right now. Please try again or email me!';
      }
      chatHistory.push({ role: 'assistant', content: reply });
      const botDiv = document.createElement('div');
      botDiv.className = 'chat-msg bot';
      botDiv.textContent = reply;
      msgs.appendChild(botDiv);
    } catch (err) {
      loadDiv.remove();
      const errDiv = document.createElement('div');
      errDiv.className = 'chat-msg bot';
      errDiv.textContent = 'Could not connect to AI service. Feel free to reach out directly via contact!';
      msgs.appendChild(errDiv);
    } finally {
      isSendingChat = false;
      msgs.scrollTop = msgs.scrollHeight;
    }
  };

  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.sendChat();
      }
    });
  }

  // 11. Terminal Emulator
  window.openTerminal = function() {
    const overlay = document.getElementById('terminal-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    const body = document.getElementById('term-body');
    if (body && !body.innerHTML.trim()) {
      appendTerm('<span class="g">UjwalOS terminal v1.0</span>');
      appendTerm('<span class="d">Type "help" for available commands</span>');
      appendTerm('');
    }
    const input = document.getElementById('term-input');
    if (input) setTimeout(() => input.focus(), 100);
  };

  window.closeTerminal = function() {
    const overlay = document.getElementById('terminal-overlay');
    if (overlay) overlay.classList.remove('open');
  };

  function appendTerm(html) {
    const body = document.getElementById('term-body');
    if (!body) return;
    const line = document.createElement('div');
    line.className = 'term-output';
    line.innerHTML = html;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  const termCommands = {
    help: () => {
      appendTerm('');
      appendTerm('<span class="a">Available commands:</span>');
      appendTerm('  <span class="g">whoami</span>          - Who is Ujwal');
      appendTerm('  <span class="g">projects</span>        - List featured systems');
      appendTerm('  <span class="g">mission</span>         - Engineering philosophy');
      appendTerm('  <span class="g">skills</span>          - Technology stack');
      appendTerm('  <span class="g">resume</span>          - View resume');
      appendTerm('  <span class="g">contact</span>         - Contact coordinates');
      appendTerm('  <span class="g">cat lore.txt</span>    - Read the background narrative');
      appendTerm('  <span class="g">sudo hire-ujwal</span> - Highly recommended');
      appendTerm('  <span class="g">clear</span>           - Clear screen');
      appendTerm('');
    },
    whoami: () => {
      appendTerm('');
      appendTerm('<span class="a">Ujwal Mahajan</span>');
      appendTerm('AI Engineer · SGGSIE&T Nanded (2023–2027)');
      appendTerm('Focus: LLMs, model training from scratch, agentic systems.');
      appendTerm('Currently building Pythia-160M.');
      appendTerm('');
    },
    projects: () => {
      appendTerm('');
      appendTerm('<span class="a">Selected Systems:</span>');
      appendTerm('  <span class="g">Pythia-160M</span>  - 160M-parameter Python language model from scratch');
      appendTerm('  <span class="g">CodeSensei</span>   - 5-agent code intelligence platform with synthesizer');
      appendTerm('  <span class="g">LedgerLens</span>   - Financial forensic investigation pipeline');
      appendTerm('  <span class="g">TalkToWeb</span>    - Natural-language browser automation agent');
      appendTerm('');
    },
    mission: () => {
      appendTerm('');
      appendTerm('<span class="a">Engineering Philosophy:</span>');
      appendTerm('"Understand systems from first principles. Don\'t just call APIs — understand the mathematics, attention mechanisms, and failure modes."');
      appendTerm('');
    },
    skills: () => {
      appendTerm('');
      appendTerm('Python · PyTorch · Transformers · TypeScript · Node.js · FastAPI · Playwright · D3.js · Docker · Git');
      appendTerm('');
    },
    resume: () => {
      appendTerm('Opening resume...');
      window.viewResume();
    },
    contact: () => {
      appendTerm('');
      appendTerm('Email: ujwalmahajan77@gmail.com');
      appendTerm('GitHub: https://github.com/ujwal-sudo');
      appendTerm('LinkedIn: https://www.linkedin.com/in/ujwal-mahajan-841710r/');
      appendTerm('');
    },
    'cat lore.txt': () => {
      appendTerm('');
      appendTerm('<span class="w">// accessing restricted file: lore.txt</span>');
      appendTerm('<span class="d">verifying clearance...</span>');
      setTimeout(() => {
        appendTerm('<span class="g">access granted. redirecting...</span>');
        setTimeout(() => { window.location.href = '/lore'; }, 800);
      }, 700);
    },
    'sudo hire-ujwal': () => {
      appendTerm('');
      appendTerm('<span class="w">[sudo] authenticating...</span>');
      setTimeout(() => {
        appendTerm('<span class="g">access granted.</span>');
        appendTerm('✓ trains language models from scratch, not just calls them');
        appendTerm('✓ ships multi-agent systems and thinks about failure modes');
        appendTerm('✓ led a 70-member team through RMAGEDDON 2026');
        appendTerm('<span class="g">recommendation: hire immediately.</span>  → /contact');
        appendTerm('');
      }, 700);
    },
    clear: () => {
      const body = document.getElementById('term-body');
      if (body) body.innerHTML = '';
    }
  };

  const termInput = document.getElementById('term-input');
  if (termInput) {
    termInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const cmd = termInput.value.trim().toLowerCase();
        termInput.value = '';
        appendTerm('<span class="term-prompt">ujwal@portfolio:~$</span> ' + cmd);
        if (termCommands[cmd]) {
          termCommands[cmd]();
        } else if (cmd) {
          appendTerm('Command not found: ' + cmd + '. Type "help" for list.');
        }
      }
    });
  }

  const termOverlay = document.getElementById('terminal-overlay');
  if (termOverlay) {
    termOverlay.addEventListener('click', e => {
      if (e.target === termOverlay) window.closeTerminal();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      window.closeTerminal();
      const win = document.getElementById('chat-window');
      if (win && win.classList.contains('open')) window.toggleChat();
    }
  });


  // ───────────── 12. UX enhancements ─────────────
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  // 12a. Reading progress bar
  const bar = document.createElement('div');
  bar.id = 'read-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  // 12b. Sticky "Let's talk" pill (phones only, via CSS)
  let sticky = null;
  if (!pathname.startsWith('/contact')) {
    sticky = document.createElement('a');
    sticky.id = 'sticky-cta';
    sticky.href = '/contact';
    sticky.textContent = "Let's talk ↗";
    document.body.appendChild(sticky);
  }

  let ticking = false;
  function onProgressScroll() {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    if (sticky) sticky.classList.toggle('show', window.scrollY > window.innerHeight * 0.8);
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onProgressScroll); }
  }, { passive: true });
  onProgressScroll();

  // 12c. Staggered reveals (delay is cleared after the first transition so hovers stay snappy)
  document.querySelectorAll('.reveal').forEach(el => {
    const idx = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal')).indexOf(el);
    if (idx > 0) {
      el.style.transitionDelay = Math.min(idx, 5) * 70 + 'ms';
      el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
    }
  });

  // 12d. "Next project" card at the end of each case study
  const slug = (pathname.match(/^\/projects\/([^/]+)/) || [])[1];
  const PROJECTS = [
    ['pythia-160m', 'Pythia-160M', 'A ~160M-parameter language model built from scratch.'],
    ['codesensei', 'CodeSensei', 'Five agents, one synthesized code review.'],
    ['ledgerlens', 'LedgerLens', 'Financial forensics with a ReAct investigator.'],
    ['talktoweb', 'TalkToWeb', 'Natural-language browser automation.']
  ];
  const cur = PROJECTS.findIndex(p => p[0] === slug);
  const mainEl = document.querySelector('main');
  if (cur > -1 && mainEl) {
    const nx = PROJECTS[(cur + 1) % PROJECTS.length];
    const sec = document.createElement('section');
    sec.className = 'next-project';
    sec.innerHTML = '<div class="wrap"><p class="eyebrow text-crimson">Next project</p>' +
      '<a class="next-project-card" href="/projects/' + nx[0] + '"><span class="np-title">' + nx[1] + '</span>' +
      '<span class="np-desc">' + nx[2] + '</span><span class="np-arrow" aria-hidden="true">→</span></a>' +
      '<a class="np-all" href="/projects">All projects</a></div>';
    mainEl.appendChild(sec);
  }

  // 12e. Toast + click-to-copy email
  let toastTimer = null;
  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a || !navigator.clipboard) return;
    const addr = a.getAttribute('href').replace('mailto:', '').split('?')[0];
    navigator.clipboard.writeText(addr).then(() => toast('Email copied: ' + addr)).catch(() => {});
    // Desktop: copy only (many have no mail app). Touch devices still open their mail app.
    if (window.matchMedia('(pointer: fine)').matches) e.preventDefault();
  });

  // 12f. Contact form: live validation, counter, spinner
  const cfEmail = document.getElementById('cf-email');
  const cfMsg = document.getElementById('cf-message');
  const cfName = document.getElementById('cf-name');
  const cfBtn = document.getElementById('cf-submit');
  if (cfEmail && cfMsg && cfName) {
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const count = document.createElement('p');
    count.id = 'cf-count';
    cfMsg.insertAdjacentElement('afterend', count);
    const mark = (el, ok) => { el.classList.toggle('cf-valid', ok); if (ok) el.classList.remove('border-crimson'); };
    const update = () => {
      const n = cfMsg.value.trim().length;
      count.textContent = n >= 10 ? '✓ ' + n + ' characters' : n + ' / 10 minimum';
      count.classList.toggle('ok', n >= 10);
      mark(cfName, !!cfName.value.trim());
      mark(cfEmail, EMAIL_RE.test(cfEmail.value.trim()));
      mark(cfMsg, n >= 10);
    };
    [cfName, cfEmail, cfMsg].forEach(el => el.addEventListener('input', update));
    update();
    if (cfBtn) {
      new MutationObserver(() => cfBtn.classList.toggle('is-sending', cfBtn.disabled))
        .observe(cfBtn, { attributes: true, attributeFilter: ['disabled'] });
    }
  }

  // 12g. Chat: suggested questions + one-time nudge
  const chatMsgs = document.getElementById('chat-messages');
  if (chatMsgs) {
    const chips = document.createElement('div');
    chips.className = 'chat-chips';
    ['Why build an LLM from scratch?', "What's your strongest project?", 'Are you open to internships?'].forEach(q => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip';
      b.textContent = q;
      b.addEventListener('click', () => {
        document.getElementById('chat-input').value = q;
        window.sendChat();
      });
      chips.appendChild(b);
    });
    chatMsgs.appendChild(chips);

    const bubble = document.getElementById('chat-bubble');
    if (bubble && !store.sget('chat-nudged')) {
      setTimeout(() => {
        const win = document.getElementById('chat-window');
        if (!win || win.classList.contains('open') || store.sget('chat-nudged')) return;
        store.sset('chat-nudged', '1');
        const n = document.createElement('button');
        n.type = 'button';
        n.id = 'chat-nudge';
        n.textContent = "Questions about my work? Ask my AI clone.";
        n.addEventListener('click', () => { n.remove(); window.toggleChat(); });
        bubble.appendChild(n);
        setTimeout(() => n.remove(), 12000);
      }, 20000);
    }
  }

  // 12h. Terminal: "/" shortcut + visible hint on the home page
  document.addEventListener('keydown', e => {
    if ((e.key !== '/' && e.key !== '`') || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (!document.getElementById('terminal-overlay')) return;
    e.preventDefault();
    window.openTerminal();
  });
  const heroCtas = document.querySelector('.hero-ctas');
  if (heroCtas && document.getElementById('terminal-overlay')) {
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'term-hint';
    hint.innerHTML = '&gt;_ open terminal <kbd>/</kbd>';
    hint.addEventListener('click', () => window.openTerminal());
    heroCtas.insertAdjacentElement('afterend', hint);
  }

  // 12i. Dark mode toggle (persisted)
  const root = document.documentElement;
  const applyTheme = t => {
    if (t === 'dark') root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
  };
  applyTheme(store.get('theme'));
  const themeBtn = document.createElement('button');
  themeBtn.id = 'theme-toggle';
  themeBtn.type = 'button';
  const paintTheme = () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.textContent = dark ? '☀' : '☾';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    themeBtn.setAttribute('aria-pressed', String(dark));
  };
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.set('theme', next);
    paintTheme();
  });
  if (!document.getElementById('chat-bubble')) themeBtn.classList.add('no-chat');
  paintTheme();
  document.body.appendChild(themeBtn);

  // 12j. Portrait fade-in (no-JS safe: only hides an image that is still loading)
  document.querySelectorAll('.hero-portrait-img-wrap img').forEach(img => {
    const wrap = img.parentElement;
    if (img.complete) { wrap.classList.add('loaded'); return; }
    img.classList.add('img-loading');
    img.addEventListener('load', () => { img.classList.remove('img-loading'); wrap.classList.add('loaded'); }, { once: true });
  });

})();
