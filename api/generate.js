// File: api/generate.js  (Vercel Serverless Function)
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Read JSON body safely whether or not Vercel parsed it
  async function getBodyJson() {
    if (req.body && typeof req.body === 'object') return req.body;
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8') || '{}';
    try { return JSON.parse(raw); } catch { return {}; }
  }

  try {
    const { prompt } = await getBodyJson();
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You help job seekers tailor resumes and write cover letters. Be concise and actionable.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      res.status(500).json({ error: `OpenAI error: ${errText}` });
      return;
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

