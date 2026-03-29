'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SOURCE_COLORS = {
  wikipedia:          { bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd', border: 'rgba(59,130,246,0.3)'  },
  arxiv:              { bg: 'rgba(139,92,246,0.15)',  text: '#c4b5fd', border: 'rgba(139,92,246,0.3)'  },
  'semantic scholar': { bg: 'rgba(168,85,247,0.15)',  text: '#d8b4fe', border: 'rgba(168,85,247,0.3)'  },
  youtube:            { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5', border: 'rgba(239,68,68,0.3)'   },
  news:               { bg: 'rgba(251,191,36,0.15)',  text: '#fcd34d', border: 'rgba(251,191,36,0.3)'  },
}

function getColor(source) {
  if (!source) return { bg: 'rgba(255,255,255,0.08)', text: '#9ca3af', border: 'rgba(255,255,255,0.15)' }
  const key = source.toLowerCase()
  for (const [k, v] of Object.entries(SOURCE_COLORS)) {
    if (key.includes(k)) return v
  }
  return { bg: 'rgba(251,191,36,0.15)', text: '#fcd34d', border: 'rgba(251,191,36,0.3)' }
}

function normalize(item) {
  return {
    id:          item.id          || item.pageid      || item.videoId   || String(Math.random()),
    title:       item.title       || item.name        || item.headline  || 'Untitled',
    description: item.description || item.extract     || item.abstract  || item.summary || item.snippet || null,
    url:         item.url         || item.link        || item.webpage   || '#',
    thumbnail:   item.thumbnail   || item.image       || item.urlToImage|| item.imgUrl  || null,
    source:      item.source      || item.provider    || 'Source',
    date:        item.date        || item.publishedAt || item.year      || null,
  }
}

const FILTERS = [
  { id: 'all',       label: 'All'       },
  { id: 'wikipedia', label: 'Wikipedia' },
  { id: 'papers',    label: 'Papers'    },
  { id: 'youtube',   label: 'YouTube'   },
  { id: 'news',      label: 'News'      },
]

function applyFilter(results, active) {
  if (active === 'all') return results
  return results.filter(r => {
    const s = (r.source || '').toLowerCase()
    if (active === 'wikipedia') return s.includes('wiki')
    if (active === 'papers')    return s.includes('arxiv') || s.includes('semantic')
    if (active === 'youtube')   return s.includes('youtube')
    if (active === 'news')      return !s.includes('wiki') && !s.includes('arxiv') && !s.includes('semantic') && !s.includes('youtube')
    return true
  })
}

export default function Home() {
  const [query,            setQuery]            = useState('')
  const [submitted,        setSubmitted]        = useState('')
  const [state,            setState]            = useState({ status: 'idle' })
  const [filter,           setFilter]           = useState('all')
  const [synthesis,        setSynthesis]        = useState(null)
  const [synthesisLoading, setSynthesisLoading] = useState(false)
  const [mounted,          setMounted]          = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const hasSearched = submitted.length > 0

  const handleSearch = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    setSubmitted(trimmed)
    setSynthesis(null)
    setFilter('all')
    setState({ status: 'loading' })
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')

      const raw = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : [
            ...(data.wikipedia || []),
            ...(data.papers    || []),
            ...(data.youtube   || []),
            ...(data.news      || []),
          ]

      const results = raw.flat().map(normalize)
      setState({ status: 'success', query: trimmed, results })
    } catch (err) {
      setState({ status: 'error', message: err.message || 'Something went wrong.' })
    }
  }

  const handleSynthesize = async () => {
    if (!state.results?.length) return
    setSynthesisLoading(true)
    setSynthesis(null)
    try {
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: submitted,
          results: state.results.slice(0, 10)
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Synthesis failed')
      setSynthesis(data.synthesis)
    } finally {
      setSynthesisLoading(false)
    }
  }

  const visible = state.status === 'success'
  ? applyFilter(state.results, filter).sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(b.date) - new Date(a.date)
    })
  : []

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#080808',
      color: '#f0f0ef',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* Ambient glows */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-10%',
        width: '50%', height: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-10%',
        width: '50%', height: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }} />

      <main style={{
        maxWidth: '1280px', margin: '0 auto',
        padding: '0 32px', position: 'relative', zIndex: 1,
      }}>

        {/* ── Hero ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop:    hasSearched ? '56px'  : '22vh',
          paddingBottom: hasSearched ? '40px'  : '0',
          transition: 'padding 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}>

          {/* Title */}
          <h1 style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 400,
            fontSize: hasSearched ? 'clamp(36px,6vw,52px)' : 'clamp(64px,12vw,100px)',
            letterSpacing: '-0.02em',
            color: '#f0f0ef',
            marginBottom: hasSearched ? '28px' : '44px',
            textAlign: 'center',
            transition: 'font-size 0.6s cubic-bezier(0.16,1,0.3,1), margin 0.6s cubic-bezier(0.16,1,0.3,1)',
          }}>
            Synthesis
          </h1>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            style={{ position: 'relative', width: '100%', maxWidth: '680px' }}
          >
            <div style={{
              display: 'flex', alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '9999px',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              <svg style={{
                position: 'absolute', left: '22px',
                width: '17px', height: '17px',
                color: 'rgba(240,240,239,0.3)', pointerEvents: 'none',
              }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                placeholder="Explore a topic..."
                style={{
                  flex: 1, background: 'transparent',
                  padding: '20px 68px 20px 52px',
                  fontSize: '16px', fontWeight: 300,
                  color: '#f0f0ef', outline: 'none', border: 'none',
                  letterSpacing: '0.01em',
                }}
              />

              <button
                type="button"
                onClick={handleSearch}
                style={{
                  position: 'absolute', right: '7px',
                  width: '40px', height: '40px', borderRadius: '9999px',
                  backgroundColor: '#f0f0ef',
                  color: '#080808',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                  opacity: state.status === 'loading' ? 0.5 : 1,
                }}
              >
                {state.status === 'loading' ? (
                  <div style={{
                    width: '15px', height: '15px', borderRadius: '50%',
                    border: '2px solid rgba(8,8,8,0.25)',
                    borderTopColor: '#080808',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                ) : (
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* Subtitle */}
          {!hasSearched && (
            <div style={{
              marginTop: '18px', display: 'flex', alignItems: 'center',
              gap: '7px', fontSize: '13px',
              color: 'rgba(240,240,239,0.28)',
            }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Aggregating knowledge from across the sphere</span>
            </div>
          )}

          {/* Results header + filters */}
          {hasSearched && state.status !== 'loading' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ width: '100%', maxWidth: '680px', marginTop: '20px' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: '14px',
              }}>
                <p style={{ fontSize: '14px', color: 'rgba(240,240,239,0.45)', fontWeight: 300 }}>
                  Results for{' '}
                  <em style={{ fontFamily: 'Georgia, serif', color: '#f0f0ef', fontStyle: 'italic' }}>
                    "{submitted}"
                  </em>
                </p>
                <span style={{ fontSize: '12px', color: 'rgba(240,240,239,0.22)' }}>
                  {visible.length} found
                </span>
              </div>

              {/* Filter pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)} style={{
                    padding: '5px 16px', borderRadius: '9999px',
                    fontSize: '12px', letterSpacing: '0.02em',
                    fontWeight: filter === f.id ? 500 : 300,
                    border: `1px solid ${filter === f.id ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
                    backgroundColor: filter === f.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: filter === f.id ? '#f0f0ef' : 'rgba(240,240,239,0.38)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Synthesis Panel */}
          {hasSearched && state.status === 'success' && (
            <div style={{ width: '100%', maxWidth: '680px', marginTop: '16px' }}>

              {/* Synthesize Button */}
              {!synthesis && (
                <button
                  onClick={handleSynthesize}
                  disabled={synthesisLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '9999px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'transparent',
                    color: synthesisLoading ? 'rgba(240,240,239,0.3)' : '#f0f0ef',
                    fontSize: '13px', fontWeight: 300,
                    cursor: synthesisLoading ? 'default' : 'pointer',
                    transition: 'all 0.2s', letterSpacing: '0.02em',
                  }}
                  onMouseEnter={e => {
                    if (!synthesisLoading) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  }}
                >
                  {synthesisLoading ? (
                    <>
                      <div style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        border: '1.5px solid rgba(240,240,239,0.2)',
                        borderTopColor: '#f0f0ef',
                        animation: 'spin 0.7s linear infinite',
                        flexShrink: 0,
                      }} />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Synthesize with AI</span>
                    </>
                  )}
                </button>
              )}

              {/* Synthesis Result */}
              {synthesis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    padding: '20px 24px', borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    position: 'relative',
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: '14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="13" height="13" fill="none" stroke="rgba(16,185,129,0.8)" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span style={{
                        fontSize: '11px', fontWeight: 500,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'rgba(16,185,129,0.8)',
                      }}>
                        AI Research Brief
                      </span>
                    </div>
                    <button
                      onClick={() => setSynthesis(null)}
                      style={{
                        background: 'none', border: 'none',
                        color: 'rgba(240,240,239,0.25)',
                        cursor: 'pointer', fontSize: '16px',
                        lineHeight: 1, padding: '2px',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'rgba(240,240,239,0.6)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,240,239,0.25)'}
                    >
                      ×
                    </button>
                  </div>

                  {/* Brief text */}
                  <p style={{
                    fontSize: '14px', lineHeight: 1.75,
                    color: 'rgba(240,240,239,0.7)', fontWeight: 300,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {synthesis}
                  </p>

                  {/* Regenerate */}
                  <button
                    onClick={handleSynthesize}
                    style={{
                      marginTop: '14px', fontSize: '11px',
                      color: 'rgba(240,240,239,0.25)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', padding: 0,
                      transition: 'color 0.2s', letterSpacing: '0.05em',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(240,240,239,0.5)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,240,239,0.25)'}
                  >
                    Regenerate →
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* ── Results area ── */}
        <AnimatePresence mode="wait">

          {/* Skeletons */}
          {state.status === 'loading' && (
            <motion.div key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px', paddingBottom: '80px',
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  borderRadius: '16px', overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{
                    height: '175px',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
                  }} />
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ height: '16px', width: '40%', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ height: '20px', width: '80%', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ height: '13px', width: '95%', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.03)' }} />
                    <div style={{ height: '13px', width: '70%', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.03)' }} />
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Error */}
          {state.status === 'error' && (
            <motion.div key="error"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(240,240,239,0.4)' }}
            >
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                backgroundColor: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <svg width="22" height="22" fill="none" stroke="rgba(239,68,68,0.7)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p style={{ fontSize: '18px', fontFamily: 'Georgia, serif', marginBottom: '8px' }}>
                Failed to synthesize knowledge
              </p>
              <p style={{ fontSize: '13px' }}>{state.message}</p>
            </motion.div>
          )}

          {/* Success */}
          {state.status === 'success' && (
            <motion.div key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px', paddingBottom: '80px',
              }}
            >
              {visible.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1', textAlign: 'center',
                  padding: '80px 0', color: 'rgba(240,240,239,0.3)',
                }}>
                  <p style={{ fontSize: '18px', fontFamily: 'Georgia, serif' }}>No results found.</p>
                  <p style={{ fontSize: '13px', marginTop: '8px' }}>
                    Your query resides in uncharted territory.
                  </p>
                </div>
              ) : visible.map((result, i) => (
                <ResultCard key={`${result.source}-${result.id}-${i}`} result={result} index={i} />
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}

function ResultCard({ result, index }) {
  const color  = getColor(result.source)
  const hasImg = !!result.thumbnail

  return (
    <motion.a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.21, 0.47, 0.32, 0.98] }}
      style={{
        display: 'block', textDecoration: 'none', color: 'inherit',
        borderRadius: '16px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
        e.currentTarget.style.transform   = 'translateY(-3px)'
        e.currentTarget.style.boxShadow   = '0 14px 40px rgba(0,0,0,0.45)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.transform   = 'translateY(0)'
        e.currentTarget.style.boxShadow   = 'none'
      }}
    >
      {/* Thumbnail */}
      {hasImg && (
        <div style={{ position: 'relative', height: '175px', overflow: 'hidden' }}>
          <img
            src={result.thumbnail}
            alt={result.title}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.5s ease', display: 'block',
            }}
            onError={e => {
              e.target.style.display = 'none'
              e.target.parentNode.style.display = 'none'
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.3) 55%, transparent 100%)',
          }} />
        </div>
      )}

      {/* Content */}
      <div style={{
        padding: '16px 18px 18px',
        marginTop: hasImg ? '-32px' : '0',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '10px',
        }}>
          <span style={{
            fontSize: '10px', fontWeight: 500,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '3px 10px', borderRadius: '9999px',
            border: `1px solid ${color.border}`,
            backgroundColor: color.bg, color: color.text,
          }}>
            {result.source}
          </span>
          {result.date && (
            <span style={{ fontSize: '11px', color: 'rgba(240,240,239,0.22)' }}>
              {result.date}
            </span>
          )}
        </div>

        <h3 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: '18px', fontWeight: 400, lineHeight: 1.35,
          color: '#f0f0ef',
          marginBottom: result.description ? '8px' : '0',
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {result.title}
        </h3>

        {result.description && (
          <p style={{
            fontSize: '13px', lineHeight: 1.65,
            color: 'rgba(240,240,239,0.42)', fontWeight: 300,
            display: '-webkit-box',
            WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {result.description}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(240,240,239,0.18)' }}>→</span>
        </div>
      </div>
    </motion.a>
  )
}