const TO = 'ujwalmahajan77@gmail.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT = 5; // submissions per IP per hour
// shortcut: per-container memory, resets on cold start; move to KV if spam gets through
const hits = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message, website } = req.body || {};

  // Honeypot: real visitors never fill this hidden field
  if (website) return res.status(200).json({ success: true });

  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string'
      || !name.trim() || !EMAIL_RE.test(email.trim()) || message.trim().length < 10
      || name.length > 100 || email.length > 200 || message.length > 5000) {
    return res.status(400).json({ error: 'Invalid fields' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > 3600000) hits.set(ip, { start: now, count: 1 });
  else if (++entry.count > RATE_LIMIT) return res.status(429).json({ error: 'Too many messages' });

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Fail loudly: never tell a visitor their message was sent when it was not
    console.error('RESEND_API_KEY is not set; contact message dropped');
    return res.status(503).json({ error: 'Contact delivery not configured' });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: [TO],
        reply_to: email.trim(),
        subject: `Portfolio message from ${name.trim().slice(0, 60)}`,
        text: `From: ${name.trim()} <${email.trim()}>\n\n${message.trim()}`
      })
    });
    if (!r.ok) {
      console.error('Resend error:', r.status, await r.text());
      return res.status(502).json({ error: 'Delivery failed' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
