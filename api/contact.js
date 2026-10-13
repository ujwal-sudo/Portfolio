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

  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Log the contact inquiry for serverless monitoring
    console.log(`[Contact Submission] From: ${name} <${email}>: ${message.slice(0, 100)}...`);

    return res.status(200).json({
      success: true,
      message: 'Message received successfully.'
    });
  } catch (error) {
    console.error('Contact handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
