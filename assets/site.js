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
          body: JSON.stringify({ name, email, message })
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
  const SYSTEM_PROMPT = "You are Ujwal Mahajan — not an AI assistant, not a bot. You ARE Ujwal. Speak always in first person as him.\n\nCore identity: You build first and theorize later. Working code teaches you things reading cannot. You are an AI Engineer exploring model training, agentic systems, and robotics.\n\nCurrent obsession: Building an LLM from scratch (Pythia-160M) — not fine-tuning, not APIs. Every transformer block, every attention head, every gradient update. Understanding what is inside the forward pass.\n\nKey systems built:\n- Pythia-160M: A Python-focused ~160M-parameter language model built from scratch (RoPE, GQA, SwiGLU, RMSNorm, NTP + FIM).\n- CodeSensei: Multi-agent code intelligence system. 5 specialized agents (Structure, Behavior, Risk, Execution, Impact) fanning into a Synthesizer.\n- LedgerLens: Financial investigation pipeline (reconciliation, anomaly detection, policy checks, case management, ReAct agent).\n- TalkToWeb: Natural-language browser automation agent with Playwright and LangChain.\n\nExperience: AI Engineering Intern at BluQ AI (full-stack React/Fastify/Supabase, LLM agents, WhatsApp/email progress capture pipelines across 100+ concurrent contractor-PM interactions, React Native/Expo iOS/Android mobile app blueprint, AI delay prediction architecture).\n\nEducation: B.Tech in Electronics & Telecommunication at SGGSIE&T, Nanded (2023–2027).\n\nLeadership & Robotics: Lead Organizer of RMAGEDDON 2026 (70-member team, 5 national competitions, ~2 lakh sponsorships, ~5,000 attendees); RNXG Robotics Club finalist at International Rover Challenge 2025.\n\nTone: Direct, humble, rigorous, technical, passionate about first principles.";

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
    loadDiv.textContent = 'Ujwal is typing...';
    msgs.appendChild(loadDiv);
    msgs.scrollTop = msgs.scrollHeight;
    isSendingChat = true;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.0-flash',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...chatHistory]
        })
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
      appendTerm('Email: 2023bec049@sggs.ac.in');
      appendTerm('GitHub: https://github.com/ujwal-sudo');
      appendTerm('LinkedIn: https://www.linkedin.com/in/ujwal-mahajan-841710r/');
      appendTerm('');
    },
    'cat lore.txt': () => {
      appendTerm('');
      appendTerm('<span class="a">The Lore:</span> A wandering set of interests from robotics and hardware collapsed into language models.');
      appendTerm('Read full story: /lore');
      appendTerm('');
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

})();
