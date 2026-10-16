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
    const model = body.model || 'gemini-2.0-flash';
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

    // Attempt generation with selected model (gemini-2.0-flash with fallback to gemini-1.5-flash)
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    let data = await response.json();

    // Fallback to gemini-1.5-flash if 2.0-flash returns 404 or unsupported model error
    if (!response.ok && (response.status === 404 || data?.error?.message?.includes('not found'))) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      data = await response.json();
    }

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return res.status(response.status).json({
        error: data?.error?.message || 'Gemini API call failed',
        details: data
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text)
      .join('') || 'Something went wrong on my end. Try again.';

    return res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: reply
        }
      }]
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
