import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  const { url, context, type, platform } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }

  const prompt = `Analyze this website URL: ${url}
${context ? `Additional context: ${context}` : ''}
${type === 'video' ? 'This is a video link.' : 'This is a regular website link.'}

Please provide:
1. A one-sentence summary that describes what this website/service does
2. 3-5 relevant tags that would help categorize this link (like "productivity tool", "free resource", "design tool", "entertainment", "social media", etc.)

Respond in this exact JSON format:
{
  "summary": "one-sentence-summary",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes websites and provides concise summaries and relevant tags. Always respond with valid JSON only, no markdown formatting or extra text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });
    if (!openaiRes.ok) {
      return res.status(openaiRes.status).json({ error: 'OpenAI API error' });
    }
    const data = await openaiRes.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to call OpenAI API' });
  }
} 