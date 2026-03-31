import { fetchSources } from '../../lib/fetchSources'

export async function POST(request) {
  try {
    const { concept, level, goal, timeframe } = await request.json()

    if (!concept) {
      return Response.json({ error: 'Concept is required' }, { status: 400 })
    }

    // ── Step 1: Generate path structure ──────────────────────
    const structureResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a curriculum designer. Create a structured learning path for someone who wants to understand "${concept}".

Student profile:
- Current level: ${level}
- Goal: ${goal}
- Available time: ${timeframe}

Return ONLY a JSON object. No markdown. No explanation. This exact structure:
{
  "estimatedTime": "X weeks",
  "overview": "One sentence describing what the student will be able to do after completing this path",
  "stages": [
    {
      "number": 1,
      "title": "Stage title",
      "duration": "X days",
      "searchQuery": "specific search query to find resources for this stage",
      "objective": "What the student will understand after this stage",
      "conceptCheck": "One question the student should be able to answer when ready for next stage"
    }
  ]
}

Create 4 stages that progress logically from foundation to mastery.
Make searchQueries specific and optimized to find beginner-friendly resources.
Keep it focused on ${level} level.`
        }]
      })
    })

    const structureData = await structureResponse.json()
    let pathStructure

    try {
      pathStructure = JSON.parse(structureData.content[0].text.trim())
    } catch {
      return Response.json(
        { error: 'Failed to generate path structure' },
        { status: 500 }
      )
    }

    // ── Step 2: Search resources for each stage ───────────────
    // Uses shared fetchSources with 'learn' mode
    // learn mode weights YouTube and Wikipedia higher than academic papers
    const stageResources = await Promise.all(
      pathStructure.stages.map(stage =>
        fetchSources(stage.searchQuery, 'learn', 4)
      )
    )

    // ── Step 3: Attach resources to each stage ────────────────
    const stagesWithResources = pathStructure.stages.map((stage, i) => ({
      ...stage,
      resources: stageResources[i],
    }))

    // ── Step 4: Generate plain language explanations ──────────
    const explanationResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Write plain language explanations for each stage of this learning path about "${concept}" for a ${level} student.

Stages:
${stagesWithResources.map(s => `Stage ${s.number}: ${s.title} — Objective: ${s.objective}`).join('\n')}

For each stage write:
- 2 to 3 sentences explaining what this stage covers in simple language
- One concrete analogy or real world example to make it stick
- One thing most people get wrong or find confusing at this stage

Return ONLY a JSON array of objects. No markdown. This exact structure:
[
  {
    "stageNumber": 1,
    "explanation": "plain text explanation",
    "analogy": "concrete analogy or example",
    "commonMistake": "what people get wrong"
  }
]`
        }]
      })
    })

    const explanationData = await explanationResponse.json()
    let explanations = []

    try {
      explanations = JSON.parse(explanationData.content[0].text.trim())
    } catch {
      // Fallback if parsing fails — use objectives as explanations
      explanations = pathStructure.stages.map(s => ({
        stageNumber:   s.number,
        explanation:   s.objective,
        analogy:       '',
        commonMistake: '',
      }))
    }

    // ── Step 5: Merge everything into final stages ────────────
    const finalStages = stagesWithResources.map(stage => {
      const exp = explanations.find(e => e.stageNumber === stage.number) || {}
      return {
        number:        stage.number,
        title:         stage.title,
        duration:      stage.duration,
        objective:     stage.objective,
        explanation:   exp.explanation || stage.objective,
        analogy:       exp.analogy     || '',
        commonMistake: exp.commonMistake || '',
        conceptCheck:  stage.conceptCheck,
        resources:     stage.resources,
      }
    })

    // ── Step 6: Build downloadable plain text document ────────
    const divider = '━'.repeat(50)

    const document = `LEARNING PATH: ${concept.toUpperCase()}
${'='.repeat(50)}
Level: ${level} | Goal: ${goal} | Time: ${pathStructure.estimatedTime}
Generated by Synthesis

${pathStructure.overview}

${divider}

${finalStages.map(stage => `
STAGE ${stage.number}: ${stage.title.toUpperCase()} (${stage.duration})
${divider}

WHAT YOU WILL LEARN
${stage.explanation}

THINK OF IT LIKE THIS
${stage.analogy}

${stage.commonMistake ? `COMMON MISTAKE TO AVOID\n${stage.commonMistake}\n` : ''}
RESOURCES FOR THIS STAGE
${stage.resources.map((r, i) => `
${i + 1}. ${r.title}
   Source: ${r.source}
   Link:   ${r.url}
   ${r.description ? `About:  ${r.description.slice(0, 120)}...` : ''}
`).join('')}
READY FOR THE NEXT STAGE?
${stage.conceptCheck}

`).join(divider + '\n')}
${divider}

Generated by Synthesis Research Intelligence
Sources: Wikipedia, YouTube, arXiv, Semantic Scholar, NewsAPI
`

    // ── Step 7: Return complete path ──────────────────────────
    return Response.json({
      concept,
      level,
      goal,
      timeframe,
      estimatedTime: pathStructure.estimatedTime,
      overview:      pathStructure.overview,
      stages:        finalStages,
      document,
    })

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}