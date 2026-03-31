import { fetchSources } from '../../lib/fetchSources'

// Scoring already handled inside fetchSources
// Just need these for paper-specific logic
function recencyScore(date) {
  if (!date) return 0
  const diff = new Date().getFullYear() - new Date(date).getFullYear()
  if (diff <= 1) return 10
  if (diff <= 3) return 8
  if (diff <= 5) return 5
  if (diff <= 10) return 3
  return 1
}

export async function POST(request) {
  try {
    const { query, paperType, wordCount } = await request.json()

    if (!query) {
      return Response.json({ error: 'Query is required' }, { status: 400 })
    }

    // Fetch and score sources using shared utility
    const sources = await fetchSources(query, 'research', 6)

    if (sources.length === 0) {
      return Response.json(
        { error: 'No suitable sources found' },
        { status: 404 }
      )
    }

    const paperTypeInstructions = {
      'essay':          'a well-argued academic essay with clear thesis, supporting arguments, and conclusion',
      'research paper': 'a structured research paper with introduction, literature review, findings, discussion, and conclusion',
    }

    const sourceList = sources.map((s, i) =>
      `[${i + 1}] ${s.title} (${s.source}, ${s.date || 'n.d.'}): ${s.description}`
    ).join('\n\n')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Write ${paperTypeInstructions[paperType] || 'an academic paper'} on: "${query}"

Target: ~${wordCount} words.

Use ONLY these sources — do not hallucinate:
${sourceList}

Requirements:
- Cite inline as [1], [2]
- Undergraduate academic level
- Plain prose only — no markdown, no bullet points
- End with a References section
- Focus specifically on: "${query}"`
        }]
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Claude API failed')

    return Response.json({
      paper:   data.content[0].text,
      sources: sources.map((s, i) => ({ ...s, number: i + 1 }))
    })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}