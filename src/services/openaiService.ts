interface AnalysisResult {
  summary: string;
  tags: string[];
}

export const analyzeLink = async (
  url: string,
  context: string,
  type: 'video' | 'link',
  platform: string,
  apiKey: string
): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  // Enhanced prompt with better instructions
  const prompt = `Analyze this ${type === 'video' ? 'video' : 'web'} link: ${url}
${context ? `User context: ${context}` : ''}
${platform && platform !== 'other' ? `Platform: ${platform}` : ''}

Please provide a comprehensive analysis with:

1. **Summary**: A clear, concise one-sentence description of what this link contains or what value it provides
2. **Tags**: 3-5 relevant, searchable tags that would help categorize and find this link later

Guidelines:
- For videos: Focus on content type, topic, and key takeaways
- For articles/websites: Highlight the main subject, purpose, and target audience  
- For tools/services: Describe functionality and use cases
- For social media: Capture the content theme and platform type
- Tags should be specific but not overly niche (e.g., "web-development", "productivity-tool", "react-tutorial")
- Avoid generic tags like "interesting" or "useful"
- Do not generate hyper-specific tags. Prefer broader, general tags (e.g., use 'recipe' instead of 'pancake-recipe').
- Consider the user's context if provided

Examples of good tags:
- "javascript-tutorial", "react-hooks", "web-development"
- "productivity-tool", "project-management", "collaboration"
- "design-inspiration", "ui-patterns", "color-palette"
- "machine-learning", "python-guide", "data-science"
- "recipe" (not "pancake-recipe")

Respond in this exact JSON format (no markdown formatting):
{
  "summary": "one-sentence-summary-here",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are LinkScope AI, an expert at analyzing web content and categorizing links. 
            
Your role is to help users organize their digital discoveries by providing:
- Clear, actionable summaries that capture the essence and value of the content
- Relevant, searchable tags that make content easy to find later
- Context-aware analysis that considers the user's specific needs

You excel at:
- Identifying the core value proposition of websites and tools
- Categorizing content by topic, format, and use case
- Understanding different types of content (tutorials, tools, articles, videos, etc.)
- Creating tags that are specific enough to be useful but general enough to group related content

Always respond with valid JSON only, no markdown formatting or extra text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Remove markdown formatting if present
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (content.includes('```')) {
      content = content.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    const result = JSON.parse(content.trim());
    return {
      summary: result.summary,
      tags: result.tags
    };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to analyze link with OpenAI');
  }
}; 