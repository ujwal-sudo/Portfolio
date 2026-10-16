let activeEndpoint = null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const body = req.body || {};
  const messages = Array.isArray(body.messages) ? body.messages : [];

  // Graceful fallback if GEMINI_API_KEY is not yet configured in environment variables
  if (!apiKey) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';

    let fallbackReply = "Hey! I'm Ujwal's AI clone. The backend GEMINI_API_KEY environment variable has not been configured in the Vercel project settings yet. Once added, I will be powered live by Gemini Flash!\n\nIn the meantime, feel free to explore my projects (Pythia-160M, CodeSensei, LedgerLens, TalkToWeb) or reach out directly at ujwalmahajan77@gmail.com.";

    if (lastUserMsg.includes('project') || lastUserMsg.includes('pythia') || lastUserMsg.includes('codesensei')) {
      fallbackReply = "I build AI systems from first principles! Check out Pythia-160M (a 160M-parameter language model built from scratch with RoPE & GQA) and CodeSensei (a 5-agent distributed code intelligence system). You can read full case studies on the Projects page!";
    } else if (lastUserMsg.includes('contact') || lastUserMsg.includes('email') || lastUserMsg.includes('hire')) {
      fallbackReply = "You can contact me directly at ujwalmahajan77@gmail.com or connect on LinkedIn at linkedin.com/in/ujwal-mahajan-841710r. My inbox is open for engineering roles and research collaborations!";
    }

    return res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: fallbackReply
        }
      }],
      warning: 'GEMINI_API_KEY is not set in environment variables. Configure GEMINI_API_KEY in Vercel Settings > Environment Variables for live Gemini responses.'
    });
  }

  try {
    const requestedModel = body.model || 'gemini-flash-latest';
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';

    // Strictly alternate user and model turns
    const sanitizedTurns = [];
    let lastRole = null;

    for (const m of messages) {
      if (m.role === 'system') continue;
      const role = m.role === 'assistant' ? 'model' : 'user';
      const text = String(m.content || '').trim();
      if (!text) continue;

      if (role === lastRole && sanitizedTurns.length > 0) {
        sanitizedTurns[sanitizedTurns.length - 1].parts[0].text += `\n${text}`;
      } else {
        sanitizedTurns.push({ role, parts: [{ text }] });
        lastRole = role;
      }
    }

    // Ensure first turn is 'user'
    if (sanitizedTurns.length === 0 || sanitizedTurns[0].role !== 'user') {
      sanitizedTurns.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    // Embed system prompt into first turn so it is 100% compatible across all Gemini API versions (v1, v1beta)
    // without triggering "Unknown name 'systemInstruction'" or schema mismatch errors
    const contents = sanitizedTurns.map((item, idx) => {
      if (idx === 0 && systemPrompt) {
        return {
          role: item.role,
          parts: [{ text: `[System Context & Identity Instructions:\n${systemPrompt}]\n\n${item.parts[0].text}` }]
        };
      }
      return item;
    });

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 800
      }
    };

    const genResult = await executeGeminiGeneration(apiKey, payload, requestedModel);

    if (genResult.ok) {
      const reply = genResult.data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text)
        .join('') || 'Something went wrong generating the response. Try again!';

      return res.status(200).json({
        choices: [{
          message: {
            role: 'assistant',
            content: reply
          }
        }],
        modelUsed: genResult.modelUsed
      });
    }

    // If generation failed, present the exact error details clearly
    const errorDetails = genResult.data?.error?.message 
      || (typeof genResult.data?.error === 'string' ? genResult.data.error : null)
      || (typeof genResult.data === 'string' ? genResult.data : null)
      || JSON.stringify(genResult.data)
      || 'Gemini service unreachable';

    console.error('Gemini Service Resolution Error:', genResult.status, genResult.data);

    return res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: `AI Service Notice: ${errorDetails}\n\n(Tip: In the meantime, you can explore my projects like Pythia-160M and CodeSensei on the site, or email me at ujwalmahajan77@gmail.com!)`
        }
      }],
      error: errorDetails,
      status: genResult.status,
      details: genResult.data
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function executeGeminiGeneration(apiKey, payload, requestedModel) {
  // If we already cached a working endpoint during this container lifetime, try it first
  if (activeEndpoint) {
    try {
      const url = `https://generativelanguage.googleapis.com/${activeEndpoint.apiVersion}/${activeEndpoint.model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        return { ok: true, data, modelUsed: `${activeEndpoint.apiVersion}/${activeEndpoint.model}` };
      }
      activeEndpoint = null;
    } catch {
      activeEndpoint = null;
    }
  }

  const cleanReq = (requestedModel || 'gemini-flash-latest').replace(/^models\//, '');

  const candidates = [
    // Dynamic alias (always points to current available flash model)
    { apiVersion: 'v1beta', model: 'models/gemini-flash-latest' },
    { apiVersion: 'v1', model: 'models/gemini-flash-latest' },

    // Modern 2.5 / 2.0 Flash
    { apiVersion: 'v1beta', model: 'models/gemini-2.5-flash' },
    { apiVersion: 'v1', model: 'models/gemini-2.5-flash' },
    { apiVersion: 'v1beta', model: 'models/gemini-2.0-flash' },
    { apiVersion: 'v1', model: 'models/gemini-2.0-flash' },

    // Next-Gen 3.x Flash
    { apiVersion: 'v1beta', model: 'models/gemini-3.8-flash' },
    { apiVersion: 'v1beta', model: 'models/gemini-3.7-flash' },
    { apiVersion: 'v1beta', model: 'models/gemini-3.5-flash-lite' },

    // Gemini 1.5 Flash / Pro
    { apiVersion: 'v1', model: 'models/gemini-1.5-flash' },
    { apiVersion: 'v1beta', model: 'models/gemini-1.5-flash' },
    { apiVersion: 'v1', model: 'models/gemini-1.5-pro' },
    { apiVersion: 'v1beta', model: 'models/gemini-1.5-pro' },

    // User-requested model
    { apiVersion: 'v1beta', model: `models/${cleanReq}` },
    { apiVersion: 'v1', model: `models/${cleanReq}` }
  ];

  const seen = new Set();
  const uniqueCandidates = candidates.filter(c => {
    const key = `${c.apiVersion}:${c.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let lastStatus = 500;
  let lastData = null;

  for (const c of uniqueCandidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/${c.apiVersion}/${c.model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        activeEndpoint = c;
        return { ok: true, data, modelUsed: `${c.apiVersion}/${c.model}` };
      }

      lastStatus = res.status;
      lastData = data;

      // Stop trial if authentication or rate limits occur
      if (res.status === 400 && data?.error?.message?.includes('API key not valid')) {
        return { ok: false, status: 400, data };
      }
      if (res.status === 403) {
        return { ok: false, status: 403, data };
      }
      if (res.status === 429) {
        return { ok: false, status: 429, data };
      }
    } catch {
      // Continue to next candidate
    }
  }

  // If candidate trial failed, query ModelService.ListModels to auto-discover what Google supports for this key
  for (const apiVersion of ['v1beta', 'v1']) {
    try {
      const listUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`;
      const listRes = await fetch(listUrl);
      if (listRes.ok) {
        const listData = await listRes.json();
        const available = (listData.models || []).filter(m =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent')
        );

        if (available.length > 0) {
          const chosen = available.find(m => m.name.includes('flash') && m.name.includes('latest'))
            || available.find(m => m.name.includes('flash') && (m.name.includes('2.') || m.name.includes('3.')))
            || available.find(m => m.name.includes('flash'))
            || available.find(m => m.name.includes('pro'))
            || available[0];

          const modelName = chosen.name.startsWith('models/') ? chosen.name : `models/${chosen.name}`;
          const genUrl = `https://generativelanguage.googleapis.com/${apiVersion}/${modelName}:generateContent?key=${apiKey}`;
          const genRes = await fetch(genUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const genData = await genRes.json();

          if (genRes.ok) {
            activeEndpoint = { apiVersion, model: modelName };
            return { ok: true, data: genData, modelUsed: `${apiVersion}/${modelName}` };
          }
          lastStatus = genRes.status;
          lastData = genData;
        }
      }
    } catch {}
  }

  return { ok: false, status: lastStatus, data: lastData };
}
