import { Snippet } from "next/font/google"

export async function GET(request) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('q')

  if (!query) {
    return Response.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Wikipedia needs underscores, others need normal encoding
    const wikiQuery = query.trim().replace(/\s+/g, '_')
    const apiQuery = query.trim()

    // Wikipedia API
    const wikiResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiQuery)}`
    )

    if (!wikiResponse.ok) {
      return Response.json(
        { error: `Wikipedia returned status ${wikiResponse.status}` },
        { status: 404 }
      )
    }

    const wikiData = await wikiResponse.json()

    const normalized = {
      id: wikiData.pageid,
      title: wikiData.title,
      description: wikiData.extract,
      url: wikiData.content_urls?.desktop?.page,
      thumbnail: wikiData.thumbnail?.source || null,
      source: 'wikipedia',
      date: null,
    }

    // arXiv API
    const arxivResponse = await fetch(
      `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(apiQuery)}&start=0&max_results=5`,
        {
        headers: {
        'User-Agent': 'Synthesis/1.0 (Research App; mailto:your@email.com)'
            }
        }
    )

    const arxivText = await arxivResponse.text()

    const entryMatches = arxivText.match(/<entry>([\s\S]*?)<\/entry>/g) || []

    const arxivResults = entryMatches.map((entry, index) => {
      const getTag = (tag) => {
        const match = entry.match(
          new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)
        )
        return match ? match[1].trim() : null
      }

      return {
        id: getTag('id') || String(index),
        title: getTag('title'),
        description: getTag('summary'),
        url: getTag('id'),
        thumbnail: null,
        source: 'arXiv',
        date: getTag('published')?.slice(0, 10) || null,
      }
    })

    // Semantic Scholar API
    const semanticResponse = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(apiQuery)}&fields=title,abstract,url,year,authors&limit=5`,
      {
        headers: {
            'x-api-key': process.env.SEMANTIC_SCHOLAR_KEY
        }
      }
    )

    const semanticData = await semanticResponse.json()

    //test semanticData
    console.log('Semantic status:', semanticResponse.status)
    console.log('Semantic data:', JSON.stringify(semanticData).slice(0, 300))

    const semanticResults = (semanticData.data || []).map((paper) => ({
      id: paper.paperId,
      title: paper.title,
      description: paper.abstract || 'No abstract available',
      url: paper.url,
      thumbnail: null,
      source: 'Semantic Scholar',
      date: paper.year ? paper.year.toString() : null,
    }))

    // Youtube API Endpoint
    const youtubeResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(apiQuery)}&type=video&maxResults=5&key=${process.env.YOUTUBE_API_KEY}`
    )

    const youtubeData = await youtubeResponse.json()

    const youtubeResults = (youtubeData.items || []).map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || null,
        url : `https://www.youtube.com/watch?v=${item.id.videoId}`,
        source: 'YouTube',
        date: item.snippet.publishedAt ? item.snippet.publishedAt.slice(0, 10) : null,
    }))

    // NewsAPI Endpoint

    const newsResposne = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(apiQuery)}&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
    )

    const newsData = await newsResposne.json()

    console.log('News status:', newsResposne.status)
    console.log('News data:', JSON.stringify(newsData).slice(0, 300))

    const newsResults = (newsData.articles || []).map((article, index) => ({ 
        id: article.url || String(index),
        title: article.title,
        description: article.description,
        url: article.url,
        thumbnail: article.urlToImage || null,
        source: article.source?.name || 'NewsAPI',
        date: article.publishedAt ? article.publishedAt.slice(0, 10) : null,
    }))

    const allResults = [        
        ([normalized] || []),
        ([...arxivResults, ...semanticResults] || []),
        (youtubeResults || []),
        (newsResults || [])
    ]

    return Response.json({
      query: query,
        results: allResults,
    })

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}