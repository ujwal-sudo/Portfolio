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
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const body = req.body || {};
    const model = body.model || 'gemini-2.0-flash';
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(message.content || '') }]
      }))
      .filter(entry => entry.parts[0].text.trim().length > 0);

    const payload = {
      systemInstruction: systemPrompt ? { parts: [{ text: String(systemPrompt) }] } : undefined,
      contents: contents.length ? contents : [{ role: 'user', parts: [{ text: 'Hello' }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 800
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Gemini API error',
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
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: 'Failed to reach Gemini API' });
  }
}
