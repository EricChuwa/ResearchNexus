// ── Scoring utilities ─────────────────────────────────────────

function recencyScore(date) {
  if (!date) return 0
  const diff = new Date().getFullYear() - new Date(date).getFullYear()
  if (diff <= 1)  return 10
  if (diff <= 3)  return 8
  if (diff <= 5)  return 5
  if (diff <= 10) return 3
  return 1
}

function relevanceScore(item, query) {
  const words   = query.toLowerCase().split(' ').filter(w => w.length > 2)
  const text    = `${item.title} ${item.description || ''}`.toLowerCase()
  const matches = words.filter(w => text.includes(w))
  return words.length ? (matches.length / words.length) * 10 : 5
}

// mode: 'research' weights academic sources higher
// mode: 'learn' weights YouTube and Wikipedia higher
function credibilityScore(source, mode = 'research') {
  const researchMap = {
    'arxiv': 10, 'semantic scholar': 9,
    'wikipedia': 6, 'youtube': 4,
  }
  const learnMap = {
    'youtube': 10, 'wikipedia': 8,
    'arxiv': 3, 'semantic scholar': 2,
  }
  const map = mode === 'learn' ? learnMap : researchMap
  const key = (source || '').toLowerCase()
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k)) return v
  }
  return 5
}

export function scoreSource(item, query, mode = 'research') {
  const recency     = recencyScore(item.date)
  const relevance   = relevanceScore(item, query)
  const credibility = credibilityScore(item.source, mode)
  return {
    ...item,
    score: Math.round(
      ((recency * 0.2) + (relevance * 0.5) + (credibility * 0.3)) * 10
    ) / 10,
  }
}

// ── Normalizer ────────────────────────────────────────────────
// Converts any API response shape into one consistent object
// All routes and UI components rely on this single shape

export function normalize(item) {
  return {
    id:          item.id          || item.pageid      || String(Math.random()),
    title:       item.title       || item.name        || 'Untitled',
    description: item.description || item.extract     || item.abstract
                 || item.summary  || item.snippet     || null,
    url:         item.url         || item.link        || '#',
    thumbnail:   item.thumbnail   || item.image       || item.urlToImage || null,
    source:      item.source      || item.provider    || 'Source',
    date:        item.date        || item.publishedAt || item.year       || null,
  }
}

// ── Main fetch function ───────────────────────────────────────
// query   — the search term
// mode    — 'research' | 'learn' (affects source scoring)
// limit   — max results to return after scoring (default 8)
//
// Returns a sorted array of normalized + scored source objects

export async function fetchSources(query, mode = 'research', limit = 8) {
  const encoded   = encodeURIComponent(query)
  const wikiQuery = query.trim().replace(/\s+/g, '_')

  // ── Fire all 5 API calls simultaneously ──────────────────
  const [wikiRes, arxivRes, semanticRes, youtubeRes, newsRes] =
    await Promise.allSettled([

      // Wikipedia
      fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiQuery)}`,
        { headers: { 'User-Agent': 'Synthesis/1.0' } }
      ).then(r => r.ok ? r.json() : null),

      // arXiv — returns XML not JSON
      fetch(
        `https://export.arxiv.org/api/query?search_query=all:${encoded}&start=0&max_results=5`
      ).then(r => r.text()),

      // Semantic Scholar
      fetch(
        `https://api.semanticscholar.org/graph/v1/paper/search?query=${encoded}&fields=title,abstract,url,year&limit=5`,
        { headers: { 'x-api-key': process.env.SEMANTIC_SCHOLAR_KEY } }
      ).then(r => r.json()),

      // YouTube
      fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encoded}&type=video&maxResults=5&key=${process.env.YOUTUBE_API_KEY}`
      ).then(r => r.json()),

      // NewsAPI
      fetch(
        `https://newsapi.org/v2/everything?q=${encoded}&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
      ).then(r => r.json()),
    ])

  const results = []

  // ── Wikipedia ────────────────────────────────────────────
  if (wikiRes.status === 'fulfilled' && wikiRes.value?.title) {
    const w = wikiRes.value
    results.push(normalize({
      title:       w.title,
      description: w.extract,
      url:         w.content_urls?.desktop?.page,
      thumbnail:   w.thumbnail?.source || null,
      source:      'wikipedia',
      date:        null,
    }))
  }

  // ── arXiv — parse XML manually ───────────────────────────
  if (arxivRes.status === 'fulfilled') {
    const entries = arxivRes.value.match(/<entry>([\s\S]*?)<\/entry>/g) || []
    entries.forEach(entry => {
      const getTag = (tag) => {
        const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
        return m ? m[1].trim() : null
      }
      results.push(normalize({
        title:       getTag('title'),
        description: getTag('summary'),
        url:         getTag('id'),
        thumbnail:   null,
        source:      'arXiv',
        date:        getTag('published')?.slice(0, 10) || null,
      }))
    })
  }

  // ── Semantic Scholar ─────────────────────────────────────
  if (semanticRes.status === 'fulfilled' && semanticRes.value?.data) {
    semanticRes.value.data.forEach(p => results.push(normalize({
      title:       p.title,
      description: p.abstract || null,
      url:         p.url,
      thumbnail:   null,
      source:      'Semantic Scholar',
      date:        p.year ? String(p.year) : null,
    })))
  }

  // ── YouTube ──────────────────────────────────────────────
  if (youtubeRes.status === 'fulfilled' && youtubeRes.value?.items) {
    youtubeRes.value.items.forEach(item => results.push(normalize({
      title:       item.snippet.title,
      description: item.snippet.description,
      url:         `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail:   item.snippet.thumbnails?.medium?.url || null,
      source:      'YouTube',
      date:        item.snippet.publishedAt?.slice(0, 10) || null,
    })))
  }

  // ── NewsAPI ──────────────────────────────────────────────
  if (newsRes.status === 'fulfilled' && newsRes.value?.articles) {
    newsRes.value.articles.forEach(a => results.push(normalize({
      title:       a.title,
      description: a.description,
      url:         a.url,
      thumbnail:   a.urlToImage || null,
      source:      a.source?.name || 'News',
      date:        a.publishedAt?.slice(0, 10) || null,
    })))
  }

  // Filter, deduplicate, score, sort, limit 
  const seen    = new Set()
  const unique  = results.filter(r => {
    if (!r.title || !r.url) return false
    if (seen.has(r.title))  return false
    seen.add(r.title)
    return true
  })

  return unique
    .map(r => scoreSource(r, query, mode))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}