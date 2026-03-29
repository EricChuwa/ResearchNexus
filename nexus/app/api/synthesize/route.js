export async function POST(request) {
  try {
    const { query, results } = await request.json()

    if (!query || !results?.length) {
      return Response.json(
        { error: 'Query and results are required' },
        { status: 400 }
      )
    }

    const prompt = `You are a research assistant. Based on these search results about "${query}":

        ${results.map(r => `- ${r.title}: ${r.description || 'No description'}`).join('\n')}

        Write a concise research brief covering:
        1. What is currently known about this topic
        2. Key themes across sources
        3. Gaps or areas needing more research
        4. A list of other relevant papers, articles, or videos to explore (just titles, URLs, and a link. Structure it as [resources: Link (URL)]

        Keep it under 200 words. Be direct and informative.
        Write in plain paragraphs and bullet points. Do not use markdown, bullet points, headers, bold text, or any special formatting symbols. Just clean flowing prose.`

            const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                messages: [
                { role: 'user', content: prompt }
                ]
            })
            })

            const data = await response.json()

            if (!response.ok) {
            throw new Error(data.error?.message || 'Claude API failed')
            }

            const text = data.content[0].text

            return Response.json({ synthesis: text })

        } catch (error) {
            return Response.json(
            { error: error.message },
            { status: 500 }
            )
        }
}