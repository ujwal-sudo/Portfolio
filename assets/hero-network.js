/**
 * Ujwal Mahajan — Portfolio Hero
 * Neural Network Boot Loader + Interactive Split-Screen Hero
 *
 * Architecture:
 *  1. GRAPH_DATA  — shared node/edge definitions used by both loader & hero
 *  2. NetworkRenderer — draws the SVG graph (loader or hero mode)
 *  3. LoaderOrchestrator — runs the 8-stage boot sequence
 *  4. HeroInteraction — hover/click/callout/cursor-HUD logic
 *  5. Navigation — projects dropdown, mobile menu
 *  6. init() — entry point
 */

;(function () {
  'use strict';

  /* ── SVG helper (defined first so all functions can use it) ── */
  function makeSVGEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined) el.setAttribute(k, v);
    });
    return el;
  }

  /* ═══════════════════════════════════════════════════════════
     1. GRAPH DATA
     All nodes and edges used by both the loader and the hero.
  ═══════════════════════════════════════════════════════════ */

  // viewport-relative coords: x ∈ [0..1], y ∈ [0..1]
  const NODES = [
    // ── PRIMARY NODES (matching storyboard reference) ──
    { id: 'llm', label: 'LLMS', category: 'AI RESEARCH', x: 0.52, y: 0.22, r: 24, type: 'primary',
      desc: 'Language model internals: attention, tokenization, training dynamics. Built Pythia-160M from scratch.',
      icon: 'llm', action: null },

    { id: 'python', label: '', category: 'CORE STACK', x: 0.36, y: 0.24, r: 20, type: 'primary',
      desc: 'Python & PyTorch: Custom model architectures, tokenizers, distributed training loops.',
      icon: 'python', action: null },

    { id: 'fullstack', label: 'FULL STACK', category: 'ENGINEERING', x: 0.21, y: 0.40, r: 21, type: 'primary',
      desc: 'React, TypeScript, Fastify, Supabase, Node.js. Production AI internship at BluQ AI.',
      icon: 'monitor', action: null },

    { id: 'embedded', label: 'EMBEDDED SYSTEMS', category: 'ELECTRONICS', x: 0.16, y: 0.60, r: 19, type: 'primary',
      desc: 'B.Tech Electronics & Telecommunication Engineering. Hardware-software interfaces, signal processing.',
      icon: 'chip', action: null },

    { id: 'robotics', label: 'ROBOTICS', category: 'HARDWARE & SYSTEMS', x: 0.29, y: 0.73, r: 22, type: 'primary',
      desc: 'RNXG Robotics Club — IRC 2025 finalist. RMAGEDDON 2026 lead organiser, 70-member team.',
      icon: 'robot', action: null },

    { id: 'pythia', label: '', category: 'PROJECT', x: 0.49, y: 0.50, r: 24, type: 'primary', anchor: true,
      desc: 'Pythia-160M: A ~160M-parameter Python LLM built from scratch. RoPE, GQA, SwiGLU, RMSNorm, NTP + FIM.',
      icon: 'brain', action: '/projects/pythia-160m' },

    { id: 'database', label: '', category: 'MEMORY & RETRIEVAL', x: 0.74, y: 0.22, r: 20, type: 'primary',
      desc: 'Vector databases, dense retrieval, semantic search, embeddings, similarity indexes.',
      icon: 'database', action: null },

    { id: 'agentic', label: 'AGENTIC SYSTEMS', category: 'ARCHITECTURE', x: 0.77, y: 0.36, r: 22, type: 'primary',
      desc: 'Multi-agent orchestration with specialized agents, deterministic JSON contracts, synthesizer layers.',
      icon: 'agents', action: null },

    { id: 'tools', label: 'TOOLS & INFRA', category: 'INFRASTRUCTURE', x: 0.82, y: 0.56, r: 20, type: 'primary',
      desc: 'PyTorch, LangChain, LangGraph, Playwright, Docker, vector databases, RAG pipelines.',
      icon: 'monitor', action: null },

    { id: 'subcore', label: '', category: 'TRAINING PIPELINE', x: 0.61, y: 0.72, r: 19, type: 'primary',
      desc: 'Custom data curation, deduplication, vocabulary filtering, model benchmarking.',
      icon: 'gear', action: null },

    { id: 'research_hub', label: '', category: 'SYNTHESIS', x: 0.70, y: 0.62, r: 18, type: 'primary',
      desc: 'CodeSensei & LedgerLens multi-agent architecture and automated reasoning.',
      icon: 'branch', action: '/projects/codesensei' },

    { id: 'research', label: 'RESEARCH', category: 'STUDIES', x: 0.94, y: 0.45, r: 14, type: 'primary', crimsonNode: true,
      desc: 'Research investigations: Small language models, FIM mixtures, tokenization dynamics.',
      icon: '', action: '/research' },

    // ── SECONDARY NODES ──
    { id: 'transformers', label: 'TRANSFORMERS', x: 0.42, y: 0.12, r: 9, type: 'secondary', desc: 'Attention mechanisms, positional encoding, multi-head architectures.', action: null },
    { id: 'tokenization', label: 'TOKENIZATION', x: 0.62, y: 0.12, r: 8, type: 'secondary', desc: 'BPE, SentencePiece, custom tokenizers.', action: null },
    { id: 'rag', label: 'RAG', x: 0.88, y: 0.42, r: 9, type: 'secondary', desc: 'Retrieval-augmented generation and vector databases.', action: null },
    { id: 'langchain', label: 'LANGCHAIN', x: 0.88, y: 0.18, r: 8, type: 'secondary', desc: 'LangChain, LangGraph for agent orchestration.', action: null },
    { id: 'finetuning', label: 'FINE-TUNING', x: 0.34, y: 0.32, r: 8, type: 'secondary', desc: 'LoRA, RLHF, instruction tuning strategies.', action: null },
    { id: 'pytorch', label: 'PYTORCH', x: 0.40, y: 0.60, r: 9, type: 'secondary', desc: 'Deep learning framework, custom training loops, autograd.', action: null },
    { id: 'react', label: 'REACT', x: 0.10, y: 0.36, r: 8, type: 'secondary', desc: 'React, TypeScript, modern frontend architecture.', action: null },
    { id: 'fastapi', label: 'FASTAPI', x: 0.12, y: 0.52, r: 8, type: 'secondary', desc: 'FastAPI, RESTful APIs, async backends.', action: null },
    { id: 'ledgerlens', label: 'LEDGERLENS', x: 0.60, y: 0.83, r: 10, type: 'secondary', desc: 'Financial investigation pipeline with ReAct agent.', action: '/projects/ledgerlens' },
    { id: 'talktoweb', label: 'TALKTOWEB', x: 0.42, y: 0.88, r: 9, type: 'secondary', desc: 'Natural-language browser automation with Playwright.', action: '/projects/talktoweb' },
    { id: 'vectordb', label: 'VECTOR DB', x: 0.68, y: 0.42, r: 7, type: 'secondary', desc: 'Embeddings, similarity search, Pinecone, Chroma.', action: null },
    { id: 'eval', label: 'EVALUATION', x: 0.68, y: 0.66, r: 7, type: 'secondary', desc: 'Perplexity, benchmark design, model comparison.', action: null },

    // ── TERTIARY NODES & CRIMSON ACCENTS ──
    { id: 't1', x: 0.46, y: 0.32, r: 4, type: 'tertiary' },
    { id: 't2', x: 0.58, y: 0.32, r: 3.5, type: 'tertiary' },
    { id: 't3', x: 0.70, y: 0.36, r: 4, type: 'tertiary' },
    { id: 't4', x: 0.26, y: 0.56, r: 3.5, type: 'tertiary' },
    { id: 't5', x: 0.48, y: 0.70, r: 4, type: 'tertiary' },
    { id: 't6', x: 0.20, y: 0.80, r: 3, type: 'tertiary' },
    { id: 't7', x: 0.76, y: 0.70, r: 3.5, type: 'tertiary' },
    { id: 't8', x: 0.34, y: 0.82, r: 3, type: 'tertiary' },
    { id: 't9', x: 0.88, y: 0.76, r: 3, type: 'tertiary' },
    { id: 'c_dot1', x: 0.25, y: 0.35, r: 3.5, type: 'tertiary', crimsonDot: true },
    { id: 'c_dot2', x: 0.45, y: 0.62, r: 3.5, type: 'tertiary', crimsonDot: true },
    { id: 'c_dot3', x: 0.83, y: 0.48, r: 3.5, type: 'tertiary', crimsonDot: true },
    { id: 'c_dot4', x: 0.54, y: 0.76, r: 3.5, type: 'tertiary', crimsonDot: true },
  ];

  const EDGES = [
    // Core Pythia radiating links (weight: 2 = crimson highlighted)
    { from: 'pythia', to: 'llm', weight: 2 },
    { from: 'pythia', to: 'python', weight: 2 },
    { from: 'pythia', to: 'pytorch', weight: 2 },
    { from: 'pythia', to: 'agentic', weight: 2 },
    { from: 'pythia', to: 'research_hub', weight: 2 },
    { from: 'pythia', to: 'subcore', weight: 2 },
    { from: 'pythia', to: 'c_dot2', weight: 2 },
    { from: 'pythia', to: 't1', weight: 2 },
    { from: 'pythia', to: 't2', weight: 2 },

    // LLM cluster
    { from: 'llm', to: 'transformers' },
    { from: 'llm', to: 'tokenization' },
    { from: 'llm', to: 'database' },
    { from: 'llm', to: 'agentic' },
    { from: 'llm', to: 'python' },

    // Python cluster
    { from: 'python', to: 'finetuning' },
    { from: 'python', to: 'transformers' },
    { from: 'python', to: 't1' },
    { from: 'python', to: 'fullstack' },

    // Full stack cluster
    { from: 'fullstack', to: 'react' },
    { from: 'fullstack', to: 'fastapi' },
    { from: 'fullstack', to: 'c_dot1' },
    { from: 'fullstack', to: 't4' },
    { from: 'react', to: 'fastapi' },

    // Embedded & Robotics cluster
    { from: 'embedded', to: 'fastapi' },
    { from: 'embedded', to: 'robotics' },
    { from: 'embedded', to: 't4' },
    { from: 'embedded', to: 't6' },
    { from: 'robotics', to: 'pytorch' },
    { from: 'robotics', to: 'talktoweb' },
    { from: 'robotics', to: 't6' },
    { from: 'robotics', to: 't8' },

    // Agentic & Database cluster
    { from: 'database', to: 'tokenization' },
    { from: 'database', to: 'langchain' },
    { from: 'database', to: 'agentic' },
    { from: 'database', to: 'vectordb' },
    { from: 'agentic', to: 'langchain' },
    { from: 'agentic', to: 'rag' },
    { from: 'agentic', to: 'vectordb' },
    { from: 'agentic', to: 't3' },
    { from: 'agentic', to: 'tools' },

    // Tools & Research Hub
    { from: 'tools', to: 'rag' },
    { from: 'tools', to: 'c_dot3' },
    { from: 'tools', to: 'research_hub' },
    { from: 'tools', to: 't7' },
    { from: 'tools', to: 't9' },
    { from: 'tools', to: 'subcore' },

    // Subcore & Bottom
    { from: 'subcore', to: 'eval' },
    { from: 'subcore', to: 'ledgerlens' },
    { from: 'subcore', to: 'c_dot4' },
    { from: 'subcore', to: 'talktoweb' },
    { from: 'subcore', to: 'pytorch' },
    { from: 'subcore', to: 't5' },
    { from: 'talktoweb', to: 't8' },
    { from: 'talktoweb', to: 't5' },
    { from: 'ledgerlens', to: 't7' },

    // Research Hub & Arched link to Research
    { from: 'research_hub', to: 'eval' },
    { from: 'research_hub', to: 'vectordb' },
    { from: 'research_hub', to: 'c_dot3' },
    { from: 'c_dot3', to: 'research', weight: 2 },
    { from: 'tools', to: 'research', weight: 2 },

    // Additional cross connections
    { from: 'transformers', to: 't2' },
    { from: 't2', to: 'vectordb' },
    { from: 'pytorch', to: 't5' },
  ];

  // Build adjacency list
  const ADJACENCY = {};
  NODES.forEach(n => { ADJACENCY[n.id] = []; });
  EDGES.forEach(e => {
    if (!ADJACENCY[e.from]) return;
    if (!ADJACENCY[e.to]) return;
    ADJACENCY[e.from].push(e.to);
    ADJACENCY[e.to].push(e.from);
  });

  /* ═══════════════════════════════════════════════════════════
     2. ICON PATHS (inline SVG, used inside primary nodes)
  ═══════════════════════════════════════════════════════════ */
  const ICONS = {
    llm: `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></g>`,
    python: `<path d="M11.9 2c-3.1 0-5.1 1.4-5.1 3.2v1.9h5.1v.8H3.8C2 7.9.6 10 .6 13.1c0 3.1 1.4 5.1 3.2 5.1h1.9v-2.6c0-1.9 1.5-3.4 3.4-3.4h5.1c1.4 0 2.5-1.1 2.5-2.5V4.5c0-1.4-1.1-2.5-2.5-2.5h-2.3zm-1.7 1.7a.8.8 0 1 1 0 1.7.8.8 0 0 1 0-1.7zm1.9 18.3c3.1 0 5.1-1.4 5.1-3.2v-1.9h-5.1v-.8h8.1c1.8 0 3.2-2.1 3.2-5.2 0-3.1-1.4-5.1-3.2-5.1h-1.9v2.6c0 1.9-1.5 3.4-3.4 3.4H9.8c-1.4 0-2.5 1.1-2.5 2.5v5.2c0 1.4 1.1 2.5 2.5 2.5h2.3zm1.7-1.7a.8.8 0 1 1 0-1.7.8.8 0 0 1 0 1.7z" fill="currentColor"/>`,
    agents: `<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="7" y1="7" x2="10" y2="10"/><line x1="17" y1="7" x2="14" y2="10"/><line x1="7" y1="17" x2="10" y2="14"/><line x1="17" y1="17" x2="14" y2="14"/></g>`,
    brain: `<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 4a3.5 3.5 0 0 0-3.5 3.5c0 .6.15 1.15.4 1.65A3.5 3.5 0 0 0 4 12.5a3.5 3.5 0 0 0 2.4 3.35 3.5 3.5 0 0 0 4.6 3.65"/><path d="M14.5 4a3.5 3.5 0 0 1 3.5 3.5c0 .6-.15 1.15-.4 1.65A3.5 3.5 0 0 1 20 12.5a3.5 3.5 0 0 1-2.4 3.35 3.5 3.5 0 0 1-4.6 3.65"/><path d="M12 4v16"/><path d="M8 8h8M6.5 12h11M8 16h8"/></g>`,
    monitor: `<g fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="12" rx="1.5"/><line x1="2" y1="20" x2="22" y2="20" stroke-linecap="round"/><line x1="8" y1="16" x2="6" y2="20"/><line x1="16" y1="16" x2="18" y2="20"/></g>`,
    chip: `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9" y="9" width="6" height="6" fill="currentColor" fill-opacity="0.15"/><path d="M9 2v4M12 2v4M15 2v4M9 18v4M12 18v4M15 18v4M2 9h4M2 12h4M2 15h4M18 9h4M18 12h4M18 15h4"/></g>`,
    robot: `<g fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="8" width="14" height="12" rx="2"/><circle cx="9" cy="13" r="1.5" fill="currentColor"/><circle cx="15" cy="13" r="1.5" fill="currentColor"/><line x1="9" y1="17" x2="15" y2="17" stroke-linecap="round"/><path d="M12 2v4M8 4h8" stroke-linecap="round"/></g>`,
    database: `<g fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></g>`,
    branch: `<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.5 6h4a4 4 0 0 1 4 4v2M8.5 18h4a4 4 0 0 0 4-4"/></g>`,
    gear: `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></g>`,
  };

  /* ═══════════════════════════════════════════════════════════
     3. NETWORK RENDERER
     Draws nodes and edges into a given SVG element.
  ═══════════════════════════════════════════════════════════ */
  function NetworkRenderer(svgEl, opts) {
    opts = opts || {};
    const W = opts.width || 700;
    const H = opts.height || 520;
    const isLoader = !!opts.loaderMode;
    const nodeScale = (isLoader && opts.scale) ? opts.scale : 1.0;

    svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // Layers (order matters for z-index in SVG)
    const edgeLayer = makeSVGEl('g', { class: 'edge-layer' });
    const nodeLayer = makeSVGEl('g', { class: 'node-layer' });
    svgEl.appendChild(edgeLayer);
    svgEl.appendChild(nodeLayer);

    // Maps from id → rendered elements
    const edgeEls = {};   // "from-to" → <line>
    const nodeEls = {};   // id → <g>

    function px(xNorm) { return xNorm * W; }
    function py(yNorm) { return yNorm * H; }

    function drawEdge(e, animated) {
      const key = e.from + '-' + e.to;
      const fromNode = NODES.find(n => n.id === e.from);
      const toNode   = NODES.find(n => n.id === e.to);
      if (!fromNode || !toNode) return;

      const x1 = px(fromNode.x), y1 = py(fromNode.y);
      const x2 = px(toNode.x),   y2 = py(toNode.y);

      const line = makeSVGEl('line', {
        x1, y1, x2, y2,
        class: 'edge-line ' + (e.weight === 2 ? 'edge-crimson' : 'edge-normal'),
        'data-from': e.from,
        'data-to': e.to,
      });

      if (animated && !isLoader) {
        // No draw animation on hero; just appear
      } else if (animated && isLoader) {
        const len = Math.hypot(x2 - x1, y2 - y1);
        line.style.setProperty('--dash-len', len);
        line.style.strokeDasharray = len;
        line.style.strokeDashoffset = len;
        line.style.animation = `draw-edge ${Math.min(0.5, 0.15 + len / 800)}s ease forwards`;
      }

      edgeLayer.appendChild(line);
      edgeEls[key] = line;
      edgeEls[e.to + '-' + e.from] = line; // reverse lookup
      return line;
    }

    function drawNode(n, animated) {
      const g = makeSVGEl('g', {
        'data-id': n.id,
        'data-type': n.type,
        class: 'net-node-' + n.type,
        tabindex: (n.type === 'primary' || n.type === 'secondary') ? '0' : '-1',
        role: (n.type === 'primary' || n.type === 'secondary') ? 'button' : null,
        'aria-label': n.label ? `${n.label}${n.desc ? ': ' + n.desc : ''}` : null,
      });
      g.setAttribute('transform', `translate(${px(n.x)}, ${py(n.y)})`);

      const r = n.r * nodeScale;

      // Invisible larger hit target for small nodes
      if (n.type === 'secondary' || n.type === 'tertiary') {
        const hit = makeSVGEl('circle', { cx: 0, cy: 0, r: Math.max(r + 8, 14), fill: 'transparent', stroke: 'none' });
        g.appendChild(hit);
      }

      // Concentric halo rings for the central anchor node
      if (n.anchor) {
        const halo3 = makeSVGEl('circle', { cx: 0, cy: 0, r: r * 2.8, class: 'node-halo-3' });
        const halo2 = makeSVGEl('circle', { cx: 0, cy: 0, r: r * 2.05, class: 'node-halo-2' });
        const halo1 = makeSVGEl('circle', { cx: 0, cy: 0, r: r * 1.5, class: 'node-halo-1' });
        g.appendChild(halo3);
        g.appendChild(halo2);
        g.appendChild(halo1);
      }

      // Circle
      let circleClass = 'node-circle-' + n.type;
      if (n.anchor) circleClass = 'node-circle-anchor';
      else if (n.crimsonNode) circleClass = 'node-circle-crimson-node';
      else if (n.crimsonDot) circleClass = 'node-circle-crimson-dot';
      const circle = makeSVGEl('circle', { cx: 0, cy: 0, r, class: circleClass });
      g.appendChild(circle);

      // Icon (only primary nodes)
      if (n.type === 'primary' && n.icon && ICONS[n.icon]) {
        const iconSize = r * 1.05;
        const fo = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        fo.setAttribute('class', 'node-icon');
        fo.setAttribute('transform', `translate(${-iconSize/2}, ${-iconSize/2}) scale(${iconSize/24})`);
        fo.setAttribute('color', n.anchor ? '#FFFFFF' : '#226192');
        fo.innerHTML = ICONS[n.icon];
        g.appendChild(fo);
      }

      // Label (only primary & some secondary)
      if (n.label && (n.type === 'primary' || (n.type === 'secondary' && n.label.length < 12))) {
        // Label position: if node is near top edge, place label above or below
        const labelY = (n.id === 'llm' || n.id === 'agentic') ? -(r + 8 * nodeScale) : (r + 12 * nodeScale);
        const label = makeSVGEl('text', {
          x: 0, y: labelY,
          'text-anchor': 'middle',
          class: 'node-label',
        });
        // Wrap long labels at ~12 chars
        const words = (n.label || '').split(' ');
        if (words.length > 1 && n.type === 'primary') {
          words.forEach((w, i) => {
            const tspan = makeSVGEl('tspan', { x: 0, dy: i === 0 ? 0 : '1.1em' });
            tspan.textContent = w;
            label.appendChild(tspan);
          });
        } else {
          label.textContent = n.label;
        }
        g.appendChild(label);
      }

      if (animated) {
        g.style.opacity = '0';
        g.style.transform = `translate(${px(n.x)}px, ${py(n.y)}px) scale(0.3)`;
      }

      nodeLayer.appendChild(g);
      nodeEls[n.id] = g;
      return g;
    }

    function revealNode(id, delay) {
      const g = nodeEls[id];
      if (!g) return;
      setTimeout(() => {
        g.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        g.style.opacity = '1';
        g.style.transform = `translate(${px(NODES.find(n=>n.id===id).x)}px, ${py(NODES.find(n=>n.id===id).y)}px) scale(1)`;
      }, delay);
    }

    // Draw all edges immediately (for hero mode, animated for loader)
    function drawAllEdges(animated) {
      EDGES.forEach((e, i) => drawEdge(e, animated, i));
    }

    function drawAllNodes(animated) {
      NODES.forEach((n, i) => drawNode(n, animated));
    }

    return {
      drawAllEdges,
      drawAllNodes,
      drawEdge,
      drawNode,
      revealNode,
      edgeEls,
      nodeEls,
      px, py,
      W, H,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     4. LOADER ORCHESTRATOR
     Controls the 8-stage boot animation.
  ═══════════════════════════════════════════════════════════ */
  const LOG_LINES = [
    { num: '001', text: 'LOADING UJWAL.EXE' },
    { num: '002', text: 'INITIALIZING CANVAS' },
    { num: '003', text: 'SETTING UP NEURAL GRID' },
    { num: '004', text: 'PREPARING NODE TOPOLOGY' },
    { num: '005', text: 'ESTABLISHING CONNECTIONS' },
    { num: '006', text: 'LOADING SKILL MODULES' },
    { num: '007', text: 'RESOLVING PROJECT REFERENCES' },
    { num: '008', text: 'CALIBRATING NETWORK' },
    { num: '009', text: 'VALIDATING SYSTEM' },
    { num: '010', text: 'READY' },
  ];

  // Stage → [progressStart, progressEnd, durationMs]
  const STAGES = [
    [0,   8,   400],  // 0: init/canvas
    [8,   22,  600],  // 1: generate nodes (primary)
    [22,  38,  600],  // 2: generate secondary nodes
    [38,  52,  700],  // 3: connect edges
    [52,  65,  500],  // 4: form structure (more edges)
    [65,  80,  600],  // 5: icons appear
    [80,  93,  500],  // 6: labels
    [93,  100, 400],  // 7: finalize + ready
  ];

  function runLoader(loaderEl, onComplete) {
    const fillEl = loaderEl.querySelector('.loader-progress-fill');
    const pctEl  = loaderEl.querySelector('.loader-progress-pct');
    const logContainer = loaderEl.querySelector('.loader-log-lines');
    const svgEl  = loaderEl.querySelector('#loader-svg');
    const readyMsg = loaderEl.querySelector('.loader-ready-msg');

    // Render log lines if present
    if (logContainer) {
      LOG_LINES.forEach((l, i) => {
        const div = document.createElement('div');
        div.className = 'log-line';
        div.id = 'log-line-' + i;
        div.innerHTML = `<span class="log-num">${l.num}</span><span class="log-marker">○</span><span class="log-text">${l.text}</span>`;
        logContainer.appendChild(div);
      });
    }

    // Build loader renderer with expanded 25-30% scale
    const isMobile = window.innerWidth <= 700;
    const loaderW = isMobile ? Math.max(340, svgEl.clientWidth || 360) : Math.max(920, Math.min(1160, svgEl.clientWidth || 1080));
    const loaderH = isMobile ? Math.max(420, svgEl.clientHeight || 460) : Math.max(580, Math.min(680, svgEl.clientHeight || 640));
    const net = NetworkRenderer(svgEl, {
      width: loaderW,
      height: loaderH,
      loaderMode: true,
      scale: isMobile ? 1.05 : 1.25
    });

    // Pre-draw all nodes (invisible) and edges (invisible)
    net.drawAllNodes(true);
    net.drawAllEdges(false);
    // hide all edges initially
    Object.values(net.edgeEls).forEach(el => {
      el.style.opacity = '0';
      el.style.transition = 'none';
    });
    Object.values(net.nodeEls).forEach(el => {
      el.style.opacity = '0';
    });

    let currentProgress = 0;
    let aborted = false;
    const timers = [];

    function safeTimeout(fn, delay) {
      const t = setTimeout(() => { if (!aborted) fn(); }, delay);
      timers.push(t);
      return t;
    }

    function setProgress(pct) {
      const clamped = Math.min(100, Math.max(0, Math.round(pct)));
      currentProgress = clamped;
      fillEl.style.width = clamped + '%';
      pctEl.textContent = String(clamped).padStart(2, '0') + '%';
    }

    function animateProgress(from, to, duration) {
      const start = performance.now();
      function step() {
        if (aborted) return;
        const elapsed = Math.max(0, performance.now() - start);
        const t = Math.min(1, Math.max(0, elapsed / Math.max(1, duration)));
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const clampedEased = Math.min(1, Math.max(0, eased));
        setProgress(from + (to - from) * clampedEased);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function activateLine(i) {
      // Mark previous line done
      if (i > 0) {
        const prev = document.getElementById('log-line-' + (i - 1));
        if (prev) {
          prev.classList.remove('log-active');
          prev.classList.add('log-done');
          prev.querySelector('.log-marker').textContent = '✓';
        }
      }
      const line = document.getElementById('log-line-' + i);
      if (line) {
        line.classList.add('log-visible', 'log-active');
        line.querySelector('.log-marker').textContent = '▶';
      }
    }

    // Reveal first 3 log lines immediately
    [0,1,2].forEach((i, idx) => {
      safeTimeout(() => activateLine(i), idx * 130 + 50);
    });

    let cursor = 0;

    const stageTitleEl = loaderEl.querySelector('.loader-stage-title');
    function setStage(title) {
      if (stageTitleEl) stageTitleEl.textContent = title;
    }

    // ── Stage 0: Initialize canvas (0→8%)
    safeTimeout(() => {
      setStage('01. INITIALIZING');
      animateProgress(0, 8, 400);
    }, 0);

    // ── Stage 1: Generate primary nodes (8→22%)
    safeTimeout(() => {
      setStage('02. GENERATING NODES');
      activateLine(3);
      animateProgress(8, 22, 600);
      const primaryNodes = NODES.filter(n => n.type === 'primary');
      primaryNodes.forEach((n, i) => {
        safeTimeout(() => {
          const el = net.nodeEls[n.id];
          if (!el) return;
          el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
          el.style.opacity = '1';
          el.style.transform = `translate(${net.px(n.x)}px, ${net.py(n.y)}px) scale(1)`;
          // Hide labels/icons during node generation
          const labels = el.querySelectorAll('.node-label');
          const icons  = el.querySelectorAll('.node-icon');
          labels.forEach(l => { l.style.opacity = '0'; });
          icons.forEach(ic => { ic.style.opacity = '0'; });
        }, i * 80);
      });
    }, 500);

    // ── Stage 2: Generate secondary + tertiary nodes (22→38%)
    safeTimeout(() => {
      setStage('03. CONNECTING NODES');
      activateLine(4);
      animateProgress(22, 38, 600);
      const secNodes = NODES.filter(n => n.type !== 'primary');
      secNodes.forEach((n, i) => {
        safeTimeout(() => {
          const el = net.nodeEls[n.id];
          if (!el) return;
          el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
          el.style.opacity = '1';
          el.style.transform = `translate(${net.px(n.x)}px, ${net.py(n.y)}px) scale(1)`;
        }, i * 40);
      });
    }, 1200);

    // ── Stage 3: Connect edges in waves (38→52%)
    safeTimeout(() => {
      activateLine(5);
      animateProgress(38, 52, 700);
      // Wave 1: primary-primary and primary-secondary (weight=2 first)
      const sortedEdges = [...EDGES].sort((a, b) => (b.weight||1) - (a.weight||1));
      sortedEdges.forEach((e, i) => {
        safeTimeout(() => {
          const key = e.from + '-' + e.to;
          const el = net.edgeEls[key];
          if (!el) return;
          const len = parseFloat(el.getTotalLength ? el.getTotalLength() : 100) || 100;
          el.style.strokeDasharray = len;
          el.style.strokeDashoffset = len;
          el.style.opacity = '1';
          el.style.transition = `stroke-dashoffset ${Math.max(0.25, Math.min(0.5, len/500))}s ease`;
          requestAnimationFrame(() => { el.style.strokeDashoffset = '0'; });
        }, i * 22);
      });
    }, 1900);

    // ── Stage 4: More structure cues (52→65%)
    safeTimeout(() => {
      setStage('04. FORMING STRUCTURE');
      activateLine(6);
      animateProgress(52, 65, 500);
    }, 2700);

    // ── Stage 5: Icons appear (65→80%)
    safeTimeout(() => {
      setStage('05. LOADING ICONS');
      activateLine(7); // "LOADING SKILL MODULES"
      animateProgress(65, 80, 600);
      const primaryNodes = NODES.filter(n => n.type === 'primary');
      primaryNodes.forEach((n, i) => {
        safeTimeout(() => {
          const el = net.nodeEls[n.id];
          if (!el) return;
          const icons = el.querySelectorAll('.node-icon');
          icons.forEach(ic => {
            ic.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            ic.style.opacity = '1';
          });
        }, i * 70);
      });
    }, 3300);

    // ── Stage 6: Labels (80→93%)
    safeTimeout(() => {
      setStage('06. ADDING LABELS');
      activateLine(8); // "RESOLVING PROJECT REFERENCES"
      animateProgress(80, 93, 500);
      NODES.filter(n => n.label).forEach((n, i) => {
        safeTimeout(() => {
          const el = net.nodeEls[n.id];
          if (!el) return;
          const labels = el.querySelectorAll('.node-label');
          labels.forEach(l => {
            l.style.transition = 'opacity 0.3s ease';
            l.style.opacity = '1';
          });
        }, i * 45);
      });
    }, 4000);

    // ── Stage 7: Finalize (93→100%) + ready
    safeTimeout(() => {
      setStage('07. FINALIZING');
      activateLine(9); // "VALIDATING SYSTEM"
      animateProgress(93, 100, 400);
    }, 4600);

    safeTimeout(() => {
      setStage('08. LAUNCHING');
      // Mark last line done
      const last = document.getElementById('log-line-9');
      if (last) {
        last.classList.remove('log-active');
        last.classList.add('log-done');
        last.querySelector('.log-marker').textContent = '✓';
        last.querySelector('.log-text').textContent = '✓  READY';
        last.querySelector('.log-text').style.color = '#D21319';
      }
      setProgress(100);
      readyMsg.classList.add('visible');
    }, 5100);

    // ── Transition to hero
    safeTimeout(() => {
      if (!aborted) complete();
    }, 5700);

    function complete() {
      aborted = true;
      timers.forEach(clearTimeout);
      loaderEl.classList.add('loader-hidden');
      onComplete();
    }

    // Skip function
    function skip() {
      aborted = true;
      timers.forEach(clearTimeout);
      // Instantly reveal everything
      Object.values(net.nodeEls).forEach(el => {
        el.style.transition = 'none';
        el.style.opacity = '1';
        const n = NODES.find(nd => nd.id === el.getAttribute('data-id'));
        if (n) el.style.transform = `translate(${net.px(n.x)}px, ${net.py(n.y)}px) scale(1)`;
        el.querySelectorAll('.node-label, .node-icon').forEach(c => { c.style.opacity = '1'; });
      });
      Object.values(net.edgeEls).forEach(el => {
        el.style.transition = 'none';
        el.style.opacity = '1';
        el.style.strokeDashoffset = '0';
      });
      setProgress(100);
      LOG_LINES.forEach((_, i) => {
        const l = document.getElementById('log-line-' + i);
        if (l) { l.classList.add('log-visible', 'log-done'); l.querySelector('.log-marker').textContent = '✓'; }
      });
      readyMsg.classList.add('visible');
      setTimeout(complete, 200);
    }

    return { skip };
  }

  /* ═══════════════════════════════════════════════════════════
     5. HERO INTERACTION
     Handles hover, click-pin, callouts, cursor HUD.
  ═══════════════════════════════════════════════════════════ */
  function initHeroInteraction(svgEl, panelEl, net) {
    const calloutEl = panelEl.querySelector('.net-callout');
    const hudX = panelEl.querySelector('.hud-x');
    const hudY = panelEl.querySelector('.hud-y');

    let pinnedId = null;
    let hoveredId = null;
    let isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    // ── Cursor HUD
    let rafId = null;
    let lastX = 0, lastY = 0;
    panelEl.addEventListener('mousemove', e => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (hudX) hudX.textContent = Math.round(lastX) + ' PX';
          if (hudY) hudY.textContent = Math.round(lastY) + ' PX';
          rafId = null;
        });
      }
    }, { passive: true });

    // ── Highlight helpers
    function applyHighlight(activeId) {
      if (!activeId) {
        // Reset all
        Object.keys(net.nodeEls).forEach(id => {
          net.nodeEls[id].classList.remove('node-active', 'node-neighbor', 'node-dim');
        });
        Object.values(net.edgeEls).forEach(el => {
          el.classList.remove('edge-active', 'edge-dim');
          const fromId = el.getAttribute('data-from');
          const toId   = el.getAttribute('data-to');
          // restore original class
          const e = EDGES.find(ed => (ed.from === fromId && ed.to === toId) || (ed.to === fromId && ed.from === toId));
          if (e) {
            el.classList.add(e.weight === 2 ? 'edge-crimson' : 'edge-normal');
          }
        });
        return;
      }

      const neighbors = new Set(ADJACENCY[activeId] || []);

      Object.keys(net.nodeEls).forEach(id => {
        const el = net.nodeEls[id];
        el.classList.remove('node-active', 'node-neighbor', 'node-dim');
        if (id === activeId) {
          el.classList.add('node-active');
        } else if (neighbors.has(id)) {
          el.classList.add('node-neighbor');
        } else {
          el.classList.add('node-dim');
        }
      });

      Object.values(net.edgeEls).forEach(el => {
        const fromId = el.getAttribute('data-from');
        const toId   = el.getAttribute('data-to');
        el.classList.remove('edge-active', 'edge-dim', 'edge-crimson', 'edge-normal');
        const isActive = (fromId === activeId || toId === activeId);
        el.classList.add(isActive ? 'edge-active' : 'edge-dim');
      });
    }

    // ── Callout positioning
    function showCallout(nodeId) {
      const node = NODES.find(n => n.id === nodeId);
      if (!node || node.type === 'tertiary') return;

      const catEl   = calloutEl.querySelector('.callout-category');
      const titleEl = calloutEl.querySelector('.callout-title');
      const descEl  = calloutEl.querySelector('.callout-desc');
      const actionEl = calloutEl.querySelector('.callout-action');

      if (catEl)   catEl.textContent  = node.category || '';
      if (titleEl) titleEl.textContent = node.label    || node.id;
      if (descEl)  descEl.textContent  = node.desc     || '';
      if (actionEl) {
        if (node.action) {
          actionEl.href = node.action;
          actionEl.style.display = '';
          actionEl.textContent = 'VIEW PROJECT ↗';
        } else {
          actionEl.style.display = 'none';
        }
      }

      // Position: to the right of the node by default; flip if near edge
      const panelRect = panelEl.getBoundingClientRect();
      const xPx = net.px(node.x) / net.W * panelRect.width;
      const yPx = net.py(node.y) / net.H * panelRect.height;

      const calloutW = 200;
      const calloutH = 150;
      const margin   = 16;
      const nodeR    = node.r + 8;

      let left = xPx + nodeR + margin;
      let top  = yPx - calloutH / 2;

      // Flip left if overflows right
      if (left + calloutW > panelRect.width - margin) {
        left = xPx - nodeR - margin - calloutW;
      }
      // Clamp vertically
      top = Math.max(margin, Math.min(panelRect.height - calloutH - margin, top));
      // Clamp left
      left = Math.max(margin, left);

      calloutEl.style.left = left + 'px';
      calloutEl.style.top  = top  + 'px';
      calloutEl.classList.add('visible');
    }

    function hideCallout() {
      calloutEl.classList.remove('visible');
    }

    // ── Dismiss
    function dismiss() {
      pinnedId = null;
      hoveredId = null;
      applyHighlight(null);
      hideCallout();
    }

    // Dismiss button on callout
    const dismissBtn = calloutEl.querySelector('.callout-dismiss');
    if (dismissBtn) dismissBtn.addEventListener('click', dismiss);

    // Click on SVG background
    svgEl.addEventListener('click', e => {
      if (e.target === svgEl || e.target.classList.contains('edge-layer') || e.target.tagName === 'svg') {
        dismiss();
      }
    });

    // Keyboard dismiss
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') dismiss();
    });

    // Prevent callout disappearing when mousing onto it
    calloutEl.addEventListener('mouseenter', () => {
      if (pinnedId) return; // pinned — no op
      if (hoveredId) applyHighlight(hoveredId);
    });

    // ── Node event binding
    function bindNode(nodeId, groupEl) {
      const node = NODES.find(n => n.id === nodeId);
      if (!node || node.type === 'tertiary') return;

      // Hover (desktop)
      groupEl.addEventListener('mouseenter', () => {
        if (pinnedId) return;
        hoveredId = nodeId;
        applyHighlight(nodeId);
        showCallout(nodeId);
      });
      groupEl.addEventListener('mouseleave', () => {
        if (pinnedId) return;
        hoveredId = null;
        applyHighlight(null);
        hideCallout();
      });

      // Click / tap
      groupEl.addEventListener('click', e => {
        e.stopPropagation();
        if (pinnedId === nodeId) {
          // unpin
          pinnedId = null;
          applyHighlight(null);
          hideCallout();
        } else {
          pinnedId = nodeId;
          applyHighlight(nodeId);
          showCallout(nodeId);
        }
      });

      // Keyboard
      groupEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          groupEl.click();
        }
      });
    }

    // Bind all non-tertiary nodes
    Object.keys(net.nodeEls).forEach(id => {
      const node = NODES.find(n => n.id === id);
      if (node && node.type !== 'tertiary') {
        bindNode(id, net.nodeEls[id]);
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     6. NAVIGATION (Projects dropdown + Mobile menu)
  ═══════════════════════════════════════════════════════════ */
  function initNav() {
    // Projects dropdown
    const projBtn = document.querySelector('.nav-projects-btn');
    const projDrop = document.querySelector('.nav-projects-dropdown');
    if (projBtn && projDrop) {
      projBtn.addEventListener('click', e => {
        e.stopPropagation();
        const open = projDrop.classList.contains('open');
        projDrop.classList.toggle('open', !open);
        projBtn.setAttribute('aria-expanded', String(!open));
      });
      document.addEventListener('click', e => {
        if (!projBtn.contains(e.target) && !projDrop.contains(e.target)) {
          projDrop.classList.remove('open');
          projBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Mobile menu
    const mobileToggle = document.querySelector('.hero-nav-mobile-toggle');
    const mobileMenu   = document.querySelector('.hero-mobile-menu');
    if (mobileToggle && mobileMenu) {
      mobileMenu.hidden = true;
      mobileToggle.addEventListener('click', () => {
        const open = !mobileMenu.hidden;
        mobileMenu.hidden = open;
        mobileMenu.classList.toggle('open', !open);
        mobileToggle.setAttribute('aria-expanded', String(!open));
        document.body.style.overflow = !open ? 'hidden' : '';
      });
      mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          mobileMenu.hidden = true;
          mobileMenu.classList.remove('open');
          mobileToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════
     7. SESSION GATE — play once per browser session
  ═══════════════════════════════════════════════════════════ */
  function shouldPlayLoader() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    try {
      if (sessionStorage.getItem('hn-intro-played')) return false;
    } catch(e) { return false; }
    return true;
  }
  function markPlayed() {
    try { sessionStorage.setItem('hn-intro-played', '1'); } catch(e) {}
  }

  /* ═══════════════════════════════════════════════════════════
     8. INIT
  ═══════════════════════════════════════════════════════════ */
  function init() {
    const loaderEl = document.getElementById('hero-loader');
    const heroEl   = document.getElementById('hero-split');
    const heroSvg  = document.getElementById('hero-network-svg');
    const heroPanelLeft = document.getElementById('hero-panel-left');

    // Build hero network first (so it's ready when loader finishes)
    let heroNet = null;
    if (heroSvg && heroPanelLeft) {
      const rect = heroPanelLeft.getBoundingClientRect();
      const W = Math.max(rect.width  || 600, 400);
      const H = Math.max(rect.height || 520, 400);
      heroNet = NetworkRenderer(heroSvg, { width: W, height: H, loaderMode: false });
      heroNet.drawAllEdges(false);
      heroNet.drawAllNodes(false);
      // Ensure icons and labels visible immediately
      Object.values(heroNet.nodeEls).forEach(el => {
        el.style.opacity = '1';
        const n = NODES.find(nd => nd.id === el.getAttribute('data-id'));
        if (n) el.style.transform = `translate(${heroNet.px(n.x)}px, ${heroNet.py(n.y)}px) scale(1)`;
        el.querySelectorAll('.node-label, .node-icon').forEach(c => { c.style.opacity = '1'; });
      });
      Object.values(heroNet.edgeEls).forEach(el => {
        el.style.opacity = '1';
        el.style.strokeDashoffset = '0';
      });
      initHeroInteraction(heroSvg, heroPanelLeft, heroNet);
    }

    function showHero() {
      if (heroEl) {
        heroEl.classList.add('hero-visible');
      }
      markPlayed();
    }

    // Decide whether to run loader
    if (loaderEl && shouldPlayLoader()) {
      const skipBtn = loaderEl.querySelector('.loader-skip');
      const ctrl = runLoader(loaderEl, showHero);
      if (skipBtn) skipBtn.addEventListener('click', ctrl.skip);
    } else {
      if (loaderEl) loaderEl.style.display = 'none';
      if (heroEl) heroEl.classList.add('hero-visible');
    }

    initNav();
  }


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
