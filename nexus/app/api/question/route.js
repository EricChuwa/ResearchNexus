import { fetchSources } from '../../lib/fetchSources'

export async function POST(request) {
  try {
    const { question } = await request.json()

    if (!question) {
      return Response.json({ error: 'Question is required' }, { status: 400 })
    }

    // Step 1 — Break question into search components
    const breakdownResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Break this research question into 3 to 4 specific search queries.
Question: "${question}"
Return ONLY a JSON array of strings. No explanation. No markdown.
Example: ["query one", "query two", "query three"]`
        }]
      })
    })

    const breakdownData = await breakdownResponse.json()
    let components = []
    try {
      components = JSON.parse(breakdownData.content[0].text.trim())
    } catch {
      components = [question]
    }

    // Step 2 — Search all components using shared fetchSources
    const searchResults = await Promise.all(
      components.map(c => fetchSources(c, 'research', 6))
    )

    // Step 3 — Flatten and deduplicate
    const seen     = new Set()
    const allSources = searchResults.flat().filter(r => {
      if (seen.has(r.title)) return false
      seen.add(r.title)
      return true
    })

    const topSources = allSources
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    if (topSources.length === 0) {
      return Response.json({ error: 'No sources found' }, { status: 404 })
    }

    // Step 4 — Generate answer
    const sourceContext = topSources.map((s, i) =>
      `[${i + 1}] ${s.title} (${s.source}, ${s.date || 'n.d.'}): ${s.description}`
    ).join('\n\n')

    const answerResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `You are a research assistant. Answer this question using only the provided sources.

Question: "${question}"

Sources:
${sourceContext}

Requirements:
- Answer directly in the first paragraph
- Use inline citations like [1], [2]
- Write 3 to 5 substantive paragraphs
- Plain prose only — no markdown, no bullet points
- Do not hallucinate sources`
        }]
      })
    })

    const answerData = await answerResponse.json()
    if (!answerResponse.ok) {
      throw new Error(answerData.error?.message || 'Claude API failed')
    }

    return Response.json({
      question,
      components,
      answer: answerData.content[0].text,
      sources: topSources.map((s, i) => ({ ...s, number: i + 1 }))
    })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}