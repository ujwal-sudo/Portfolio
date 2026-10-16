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

    let fallbackReply = "Hey! I'm Ujwal's AI clone. The backend GEMINI_API_KEY environment variable has not been configured in the Vercel project settings yet. Once added, I will be powered live by Gemini 2.0 Flash!\n\nIn the meantime, feel free to explore my projects (Pythia-160M, CodeSensei, LedgerLens, TalkToWeb) or reach out directly at 2023bec049@sggs.ac.in.";

    if (lastUserMsg.includes('project') || lastUserMsg.includes('pythia') || lastUserMsg.includes('codesensei')) {
      fallbackReply = "I build AI systems from first principles! Check out Pythia-160M (a 160M-parameter language model built from scratch with RoPE & GQA) and CodeSensei (a 5-agent distributed code intelligence system). You can read full case studies on the Projects page!";
    } else if (lastUserMsg.includes('contact') || lastUserMsg.includes('email') || lastUserMsg.includes('hire')) {
      fallbackReply = "You can contact me directly at 2023bec049@sggs.ac.in or connect on LinkedIn at linkedin.com/in/ujwal-mahajan-841710r. My inbox is open for engineering roles and research collaborations!";
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
    const requestedModel = body.model || 'gemini-2.0-flash';
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';

    // Google Generative Language API strictly requires alternating user and model turns
    const sanitizedContents = [];
    let lastRole = null;

    for (const m of messages) {
      if (m.role === 'system') continue;
      const role = m.role === 'assistant' ? 'model' : 'user';
      const text = String(m.content || '').trim();
      if (!text) continue;

      if (role === lastRole && sanitizedContents.length > 0) {
        sanitizedContents[sanitizedContents.length - 1].parts[0].text += `\n${text}`;
      } else {
        sanitizedContents.push({ role, parts: [{ text }] });
        lastRole = role;
      }
    }

    // Ensure first turn is 'user'
    if (sanitizedContents.length === 0 || sanitizedContents[0].role !== 'user') {
      sanitizedContents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    const payload = {
      systemInstruction: systemPrompt ? { parts: [{ text: String(systemPrompt) }] } : undefined,
      contents: sanitizedContents,
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

    // Handle authentication or rate limit errors explicitly
    if (genResult.isAuthError) {
      console.error('Gemini Auth Error:', genResult.data);
      return res.status(genResult.status || 401).json({
        error: 'Invalid GEMINI_API_KEY or Generative Language API is not enabled on this Google Cloud project. Please verify your API key in Google AI Studio (aistudio.google.com).',
        details: genResult.data
      });
    }

    if (genResult.isRateLimit) {
      return res.status(429).json({
        error: 'Gemini API rate limit reached. Please wait a moment before trying again.',
        details: genResult.data
      });
    }

    // If models could not be resolved, provide an informative fallback response so website visitors still get answers
    console.error('Gemini Resolution Error:', genResult.data);
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';
    let fallbackReply = "Hello! I am Ujwal's AI assistant. My Gemini backend is currently reconnecting to Google's model services. In the meantime, feel free to check out my featured systems (Pythia-160M, CodeSensei, LedgerLens, TalkToWeb) or contact me at 2023bec049@sggs.ac.in!";

    if (lastUserMsg.includes('project') || lastUserMsg.includes('pythia') || lastUserMsg.includes('codesensei')) {
      fallbackReply = "I build AI systems from first principles! Check out Pythia-160M (a 160M-parameter language model built from scratch with RoPE & GQA) and CodeSensei (a 5-agent distributed code intelligence system). You can read full case studies on the Projects page!";
    } else if (lastUserMsg.includes('contact') || lastUserMsg.includes('email') || lastUserMsg.includes('hire')) {
      fallbackReply = "You can contact me directly at 2023bec049@sggs.ac.in or connect on LinkedIn at linkedin.com/in/ujwal-mahajan-841710r.";
    }

    return res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: fallbackReply
        }
      }],
      warning: genResult.data?.error?.message || 'Gemini model could not be resolved.',
      details: genResult.data
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function executeGeminiGeneration(apiKey, payload, requestedModel) {
  // If we already resolved a working endpoint during this container lifetime, try it first
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
      if (res.status === 404 || data?.error?.message?.includes('not found')) {
        activeEndpoint = null;
      } else {
        return { ok: false, status: res.status, data };
      }
    } catch {
      activeEndpoint = null;
    }
  }

  const cleanReqModel = (requestedModel || 'gemini-2.0-flash').replace(/^models\//, '');

  // Prioritize stable v1 endpoint, followed by v1beta, covering modern Flash and Pro models
  const candidates = [
    { apiVersion: 'v1', model: `models/${cleanReqModel}` },
    { apiVersion: 'v1', model: 'models/gemini-2.0-flash' },
    { apiVersion: 'v1', model: 'models/gemini-1.5-flash' },
    { apiVersion: 'v1', model: 'models/gemini-1.5-pro' },
    { apiVersion: 'v1beta', model: `models/${cleanReqModel}` },
    { apiVersion: 'v1beta', model: 'models/gemini-2.0-flash' },
    { apiVersion: 'v1beta', model: 'models/gemini-1.5-flash-latest' },
    { apiVersion: 'v1beta', model: 'models/gemini-1.5-flash' },
    { apiVersion: 'v1beta', model: 'models/gemini-2.5-flash' },
    { apiVersion: 'v1beta', model: 'models/gemini-2.0-flash-exp' }
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
        return { ok: false, status: 400, data, isAuthError: true };
      }
      if (res.status === 403) {
        return { ok: false, status: 403, data, isAuthError: true };
      }
      if (res.status === 429) {
        return { ok: false, status: 429, data, isRateLimit: true };
      }
    } catch {
      // Continue to next candidate
    }
  }

  // If candidate trial failed (404 on candidate models), dynamically inspect ModelService.ListModels
  for (const apiVersion of ['v1', 'v1beta']) {
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
          const chosen = available.find(m => m.name.includes('flash') && m.name.includes('2.'))
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
