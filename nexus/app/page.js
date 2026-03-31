'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Source badge colors keyed by source name ──────────────────
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

// ── Stage labels shown during loading animations ──────────────
const RESEARCH_STAGES = [
  'Understanding your question...',
  'Breaking into research components...',
  'Searching across all sources...',
  'Evaluating and scoring sources...',
  'Formulating your answer...',
]

const PAPER_STAGES = [
  'Analysing your question...',
  'Selecting best sources...',
  'Writing your paper...',
]

const LEARN_STAGES = [
  'Analysing the concept...',
  'Mapping the learning journey...',
  'Finding the best resources per stage...',
  'Writing your learning path...',
]

// ── Main Page Component ───────────────────────────────────────
export default function Home() {

  // App level
  const [mode,    setMode]    = useState('research')
  const [mounted, setMounted] = useState(false)

  // Research mode
  const [question,    setQuestion]    = useState('')
  const [submitted,   setSubmitted]   = useState('')
  const [loading,     setLoading]     = useState(false)
  const [stage,       setStage]       = useState(0)
  const [result,      setResult]      = useState(null)
  const [error,       setError]       = useState(null)
  const [showSources, setShowSources] = useState(false)

  // Paper
  const [paperModal,   setPaperModal]   = useState(false)
  const [paperLoading, setPaperLoading] = useState(false)
  const [paperStage,   setPaperStage]   = useState(0)
  const [paperResult,  setPaperResult]  = useState(null)
  const [paperType,    setPaperType]    = useState('essay')
  const [paperWords,   setPaperWords]   = useState(1000)
  const [showPaperSrc, setShowPaperSrc] = useState(false)

  // Learn mode
  const [concept,       setConcept]       = useState('')
  const [learnLevel,    setLearnLevel]    = useState('beginner')
  const [learnTime,     setLearnTime]     = useState('1 month')
  const [learnLoading,  setLearnLoading]  = useState(false)
  const [learnStage,    setLearnStage]    = useState(0)
  const [learnResult,   setLearnResult]   = useState(null)
  const [learnError,    setLearnError]    = useState(null)
  const [expandedStage, setExpandedStage] = useState(0)

  // Prevents hydration mismatch — renders null on server, full UI on client
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const isActive = !!result || loading || !!learnResult || learnLoading

  // ── Clears all state when switching modes ─────────────────
  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    setQuestion(''); setSubmitted(''); setLoading(false)
    setResult(null); setError(null); setShowSources(false)
    setPaperResult(null); setPaperLoading(false); setPaperModal(false); setStage(0)
    setConcept(''); setLearnLoading(false); setLearnResult(null)
    setLearnError(null); setExpandedStage(0); setLearnStage(0)
  }

  // ── Sends question to /api/question ──────────────────────
  const handleAsk = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    const trimmed = question.trim()
    if (!trimmed) return
    setSubmitted(trimmed); setLoading(true); setResult(null)
    setError(null); setShowSources(false); setPaperResult(null); setStage(0)

    const timers = [
      setTimeout(() => setStage(1), 1200),
      setTimeout(() => setStage(2), 2400),
      setTimeout(() => setStage(3), 3800),
      setTimeout(() => setStage(4), 5200),
    ]

    try {
      const res  = await fetch('/api/question', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      })
      const data = await res.json()
      timers.forEach(clearTimeout)
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setResult(data)
    } catch (err) {
      timers.forEach(clearTimeout)
      setError(err.message)
    } finally {
      setLoading(false); setStage(0)
    }
  }

  // ── Sends paper request to /api/paper ────────────────────
  const handlePaper = async () => {
    setPaperModal(false); setPaperLoading(true)
    setPaperResult(null); setPaperStage(0); setShowPaperSrc(false)

    const timers = [
      setTimeout(() => setPaperStage(1), 2000),
      setTimeout(() => setPaperStage(2), 4000),
    ]

    try {
      const res  = await fetch('/api/paper', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: submitted, paperType, wordCount: paperWords })
      })
      const data = await res.json()
      timers.forEach(clearTimeout)
      if (!res.ok) throw new Error(data.error || 'Paper generation failed')
      setPaperResult(data)
    } catch (err) {
      timers.forEach(clearTimeout)
    } finally {
      setPaperLoading(false); setPaperStage(0)
    }
  }

  // ── Sends concept to /api/learn ───────────────────────────
  const handleLearn = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    const trimmed = concept.trim()
    if (!trimmed) return
    setLearnLoading(true); setLearnResult(null)
    setLearnError(null); setLearnStage(0); setExpandedStage(0)

    const timers = [
      setTimeout(() => setLearnStage(1), 2000),
      setTimeout(() => setLearnStage(2), 4500),
      setTimeout(() => setLearnStage(3), 7000),
    ]

    try {
      const res  = await fetch('/api/learn', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: trimmed, level: learnLevel, goal: 'general understanding', timeframe: learnTime }),
      })
      const data = await res.json()
      timers.forEach(clearTimeout)
      if (!res.ok) throw new Error(data.error || 'Failed to generate path')
      setLearnResult(data)
    } catch (err) {
      timers.forEach(clearTimeout)
      setLearnError(err.message)
    } finally {
      setLearnLoading(false); setLearnStage(0)
    }
  }

  // ── Downloads learning path as .txt file ─────────────────
  const downloadPath = () => {
    if (!learnResult?.document) return
    const blob = new Blob([learnResult.document], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${learnResult.concept}-learning-path.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  // ── Shared search bar wrapper style ──────────────────────
  const searchWrap = {
    display: 'flex', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '9999px', overflow: 'hidden', transition: 'border-color 0.2s',
  }

  const inputStyle = {
    flex: 1, background: 'transparent', padding: '20px 68px 20px 52px',
    fontSize: '16px', fontWeight: 300, color: '#f0f0ef',
    outline: 'none', border: 'none', letterSpacing: '0.01em',
  }

  const submitBtn = (isLoading) => ({
    position: 'absolute', right: '7px', width: '40px', height: '40px',
    borderRadius: '9999px', backgroundColor: '#f0f0ef', color: '#080808',
    border: 'none', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s', flexShrink: 0, opacity: isLoading ? 0.5 : 1,
  })

  const spinner = (
    <div style={{ width: '15px', height: '15px', borderRadius: '50%',
      border: '2px solid rgba(8,8,8,0.25)', borderTopColor: '#080808',
      animation: 'spin 0.7s linear infinite' }} />
  )

  const arrow = (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  )

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080808',
      color: '#f0f0ef', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '50%', height: '50%',
        pointerEvents: 'none', zIndex: 0, filter: 'blur(80px)',
        background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '50%', height: '50%',
        pointerEvents: 'none', zIndex: 0, filter: 'blur(80px)',
        background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)' }} />

      <main style={{ maxWidth: '860px', margin: '0 auto',
        padding: '0 32px', position: 'relative', zIndex: 1 }}>

        {/* ── Hero ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: isActive ? '48px' : '20vh', paddingBottom: isActive ? '32px' : '0',
          transition: 'padding 0.6s cubic-bezier(0.16,1,0.3,1)' }}>

          {/* Title */}
          <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400,
            fontSize: isActive ? 'clamp(28px,4vw,40px)' : 'clamp(64px,12vw,100px)',
            letterSpacing: '-0.02em', color: '#f0f0ef',
            marginBottom: isActive ? '20px' : '36px', textAlign: 'center',
            transition: 'font-size 0.6s cubic-bezier(0.16,1,0.3,1), margin 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
            Synthesis
          </h1>

          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: '2px', marginBottom: '28px',
            backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '9999px',
            padding: '3px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {['research', 'learn'].map(tab => (
              <button key={tab} onClick={() => handleModeSwitch(tab)} style={{
                padding: '8px 24px', borderRadius: '9999px', fontSize: '13px',
                fontWeight: mode === tab ? 500 : 300, border: 'none', cursor: 'pointer',
                letterSpacing: '0.03em', textTransform: 'capitalize',
                backgroundColor: mode === tab ? '#f0f0ef' : 'transparent',
                color: mode === tab ? '#080808' : 'rgba(240,240,239,0.4)',
                transition: 'all 0.2s',
              }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Research input */}
          {mode === 'research' && (
            <form onSubmit={handleAsk} style={{ position: 'relative', width: '100%', maxWidth: '680px' }}>
              <div style={searchWrap}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                <svg style={{ position: 'absolute', left: '22px', width: '17px', height: '17px',
                  color: 'rgba(240,240,239,0.3)', pointerEvents: 'none' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={question} onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAsk() }}}
                  placeholder="What do you wish to look into?" style={inputStyle} />
                <button type="button" onClick={handleAsk} style={submitBtn(loading)}>
                  {loading ? spinner : arrow}
                </button>
              </div>
            </form>
          )}

          {/* Learn input */}
          {mode === 'learn' && (
            <div style={{ width: '100%', maxWidth: '680px' }}>
              <form onSubmit={handleLearn} style={{ position: 'relative', marginBottom: '12px' }}>
                <div style={searchWrap}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                  <svg style={{ position: 'absolute', left: '22px', width: '17px', height: '17px',
                    color: 'rgba(240,240,239,0.3)', pointerEvents: 'none' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <input type="text" value={concept} onChange={e => setConcept(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLearn() }}}
                    placeholder="What do you want to understand?" style={inputStyle} />
                  <button type="button" onClick={handleLearn} style={submitBtn(learnLoading)}>
                    {learnLoading ? spinner : arrow}
                  </button>
                </div>
              </form>

              {/* Level + time pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['beginner', 'intermediate', 'advanced'].map(l => (
                  <button key={l} onClick={() => setLearnLevel(l)} style={{
                    padding: '5px 14px', borderRadius: '9999px', fontSize: '11px',
                    textTransform: 'capitalize', letterSpacing: '0.03em', cursor: 'pointer',
                    border: `1px solid ${learnLevel === l ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
                    backgroundColor: learnLevel === l ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: learnLevel === l ? '#f0f0ef' : 'rgba(240,240,239,0.35)',
                    transition: 'all 0.2s',
                  }}>{l}</button>
                ))}
                <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                {['1 week', '1 month', '3 months'].map(t => (
                  <button key={t} onClick={() => setLearnTime(t)} style={{
                    padding: '5px 14px', borderRadius: '9999px', fontSize: '11px',
                    letterSpacing: '0.03em', cursor: 'pointer',
                    border: `1px solid ${learnTime === t ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
                    backgroundColor: learnTime === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: learnTime === t ? '#f0f0ef' : 'rgba(240,240,239,0.35)',
                    transition: 'all 0.2s',
                  }}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {/* Subtitle — only on empty state */}
          {!isActive && (
            <div style={{ marginTop: '18px', fontSize: '13px', color: 'rgba(240,240,239,0.28)' }}>
              {mode === 'research'
                ? 'Aggregating knowledge from across the sphere'
                : 'Build a personalised learning path for any concept'}
            </div>
          )}
        </div>

        {/* ── Research output ── */}
        {mode === 'research' && loading && (
          <StagePanel stages={RESEARCH_STAGES} current={stage} title="Researching your question" />
        )}
        {mode === 'research' && error && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(240,240,239,0.4)' }}>
            <p style={{ fontSize: '18px', fontFamily: 'Georgia, serif', marginBottom: '8px' }}>
              Failed to find an answer
            </p>
            <p style={{ fontSize: '13px' }}>{error}</p>
          </div>
        )}
        {mode === 'research' && result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: '80px' }}>

            {/* Question echo */}
            <p style={{ fontSize: '13px', color: 'rgba(240,240,239,0.35)', marginBottom: '20px', fontWeight: 300 }}>
              You asked:{' '}
              <em style={{ fontFamily: 'Georgia, serif', color: 'rgba(240,240,239,0.7)', fontStyle: 'italic' }}>
                "{submitted}"
              </em>
            </p>

            {/* Research component tags */}
            {result.components?.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(240,240,239,0.25)',
                  letterSpacing: '0.1em', textTransform: 'uppercase', paddingTop: '2px' }}>
                  Researched:
                </span>
                {result.components.map((c, i) => (
                  <span key={i} style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '9999px',
                    border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(240,240,239,0.35)' }}>
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Answer panel */}
            <div style={{ padding: '24px 28px', borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: '16px' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'rgba(16,185,129,0.8)' }}>
                  Research Answer
                </span>
                <button onClick={() => navigator.clipboard.writeText(result.answer)}
                  style={{ fontSize: '11px', color: 'rgba(240,240,239,0.3)', background: 'none',
                    border: 'none', cursor: 'pointer' }}>
                  Copy
                </button>
              </div>

              <p style={{ fontSize: '15px', lineHeight: 1.85, color: 'rgba(240,240,239,0.8)',
                fontWeight: 300, fontFamily: "Georgia, 'Times New Roman', serif", whiteSpace: 'pre-wrap' }}>
                {result.answer}
              </p>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px',
                paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                {[
                  { label: `${showSources ? 'Hide' : 'View'} ${result.sources.length} Sources`, onClick: () => setShowSources(s => !s), active: showSources },
                  ...(!paperResult ? [{ label: 'Write Paper', onClick: () => setPaperModal(true), active: false }] : []),
                ].map(btn => (
                  <button key={btn.label} onClick={btn.onClick} style={{
                    padding: '8px 16px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${btn.active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
                    backgroundColor: btn.active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: 'rgba(240,240,239,0.6)', transition: 'all 0.2s',
                  }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sources grid */}
            <AnimatePresence>
              {showSources && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }} style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.25)', marginBottom: '12px' }}>
                    Sources — ranked by relevance
                  </p>
                  <div style={{ display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                    {result.sources.map(s => <SourceCard key={s.number} source={s} />)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Paper loading */}
            {paperLoading && (
              <StagePanel stages={PAPER_STAGES} current={paperStage} title="Writing your paper" />
            )}

            {/* Paper result */}
            {paperResult && (
              <div style={{ padding: '24px 28px', borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: '24px' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '20px', paddingBottom: '16px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'rgba(16,185,129,0.8)' }}>
                    {paperType === 'essay' ? 'Academic Essay' : 'Research Paper'}
                  </span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => navigator.clipboard.writeText(paperResult.paper)}
                      style={{ fontSize: '11px', color: 'rgba(240,240,239,0.3)', background: 'none',
                        border: 'none', cursor: 'pointer' }}>Copy</button>
                    <button onClick={() => {
                      const blob = new Blob([paperResult.paper], { type: 'text/plain' })
                      const url  = URL.createObjectURL(blob)
                      const a    = document.createElement('a')
                      a.href = url; a.download = `${submitted}-${paperType}.txt`; a.click()
                      URL.revokeObjectURL(url)
                    }} style={{ fontSize: '11px', color: 'rgba(240,240,239,0.3)', background: 'none',
                      border: 'none', cursor: 'pointer' }}>Download</button>
                    <button onClick={() => setPaperResult(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(240,240,239,0.25)',
                        cursor: 'pointer', fontSize: '16px' }}>×</button>
                  </div>
                </div>

                <div style={{ fontSize: '14px', lineHeight: 1.9, color: 'rgba(240,240,239,0.75)',
                  fontWeight: 300, whiteSpace: 'pre-wrap', maxHeight: '500px', overflowY: 'auto',
                  fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {paperResult.paper}
                </div>

                <button onClick={() => setShowPaperSrc(s => !s)}
                  style={{ marginTop: '16px', fontSize: '11px', color: 'rgba(240,240,239,0.28)',
                    background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPaperSrc ? 'Hide' : 'View'} {paperResult.sources?.length} sources used
                </button>

                {showPaperSrc && (
                  <div style={{ marginTop: '12px' }}>
                    {paperResult.sources?.map(s => (
                      <a key={s.number} href={s.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', gap: '10px', padding: '10px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          textDecoration: 'none', color: 'inherit' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(240,240,239,0.3)', minWidth: '20px' }}>
                          [{s.number}]
                        </span>
                        <div>
                          <p style={{ fontSize: '12px', color: '#f0f0ef', marginBottom: '3px' }}>{s.title}</p>
                          <span style={{ fontSize: '10px', color: 'rgba(240,240,239,0.25)',
                            textTransform: 'uppercase' }}>{s.source}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                <p style={{ marginTop: '16px', fontSize: '10px', color: 'rgba(240,240,239,0.15)' }}>
                  Generated by Synthesis AI — not for direct submission.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Learn output ── */}
        {mode === 'learn' && learnLoading && (
          <StagePanel stages={LEARN_STAGES} current={learnStage} title="Building your learning path" />
        )}
        {mode === 'learn' && learnError && !learnLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(240,240,239,0.4)' }}>
            <p style={{ fontSize: '18px', fontFamily: 'Georgia, serif' }}>Failed to generate path</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>{learnError}</p>
          </div>
        )}
        {mode === 'learn' && learnResult && !learnLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ paddingBottom: '80px' }}>

            {/* Path header card */}
            <div style={{ padding: '24px 28px', borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontFamily: "Georgia, serif", fontSize: '22px',
                    fontWeight: 400, color: '#f0f0ef', marginBottom: '6px' }}>
                    {learnResult.concept}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'rgba(240,240,239,0.45)', fontWeight: 300 }}>
                    {learnResult.level} · {learnResult.estimatedTime}
                  </p>
                </div>
                <button onClick={downloadPath} style={{ display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '9999px', backgroundColor: '#f0f0ef',
                  color: '#080808', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
                  Download Path
                </button>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(240,240,239,0.6)',
                fontWeight: 300, paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {learnResult.overview}
              </p>
            </div>

            {/* Stage selector bar */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
              {learnResult.stages.map((s, i) => (
                <button key={i} onClick={() => setExpandedStage(i)} style={{
                  flex: 1, padding: '10px 8px', borderRadius: '10px', fontSize: '11px',
                  border: `1px solid ${expandedStage === i ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  backgroundColor: expandedStage === i ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                  color: expandedStage === i ? '#f0f0ef' : 'rgba(240,240,239,0.35)',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                }}>
                  <div style={{ fontWeight: 500, marginBottom: '3px' }}>{s.number}</div>
                  <div style={{ fontSize: '10px', lineHeight: 1.3 }}>{s.title}</div>
                </button>
              ))}
            </div>

            {/* Expanded stage */}
            {learnResult.stages[expandedStage] && (() => {
              const s = learnResult.stages[expandedStage]
              return (
                <motion.div key={expandedStage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ padding: '24px 28px', borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: '16px' }}>

                  {/* Stage header + prev/next */}
                  <div style={{ display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: 'rgba(240,240,239,0.3)', marginBottom: '6px' }}>
                        Stage {s.number} of {learnResult.stages.length} · {s.duration}
                      </p>
                      <h3 style={{ fontFamily: "Georgia, serif", fontSize: '20px',
                        fontWeight: 400, color: '#f0f0ef' }}>{s.title}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {expandedStage > 0 && (
                        <button onClick={() => setExpandedStage(i => i - 1)} style={{
                          width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                          border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent',
                          color: 'rgba(240,240,239,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>←</button>
                      )}
                      {expandedStage < learnResult.stages.length - 1 && (
                        <button onClick={() => setExpandedStage(i => i + 1)} style={{
                          width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                          border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent',
                          color: 'rgba(240,240,239,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>→</button>
                      )}
                    </div>
                  </div>

                  {/* Explanation */}
                  <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'rgba(240,240,239,0.75)',
                    fontWeight: 300, marginBottom: '12px' }}>{s.explanation}</p>

                  {/* Analogy */}
                  {s.analogy && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '10px',
                      backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <p style={{ fontSize: '12px', color: 'rgba(16,185,129,0.7)',
                        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Think of it like this
                      </p>
                      <p style={{ fontSize: '13px', color: 'rgba(240,240,239,0.65)',
                        lineHeight: 1.7, fontWeight: 300 }}>{s.analogy}</p>
                    </div>
                  )}

                  {/* Common mistake */}
                  {s.commonMistake && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                      backgroundColor: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
                      <p style={{ fontSize: '12px', color: 'rgba(251,191,36,0.7)',
                        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Common mistake
                      </p>
                      <p style={{ fontSize: '13px', color: 'rgba(240,240,239,0.65)',
                        lineHeight: 1.7, fontWeight: 300 }}>{s.commonMistake}</p>
                    </div>
                  )}

                  {/* Resources */}
                  {s.resources?.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: 'rgba(240,240,239,0.25)', marginBottom: '12px' }}>Start here</p>
                      <div style={{ display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                        {s.resources.map((r, i) => <SourceCard key={i} source={{ ...r, number: i + 1 }} compact />)}
                      </div>
                    </div>
                  )}

                  {/* Concept check */}
                  {s.conceptCheck && (
                    <div style={{ padding: '16px 20px', borderRadius: '12px',
                      backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: 'rgba(240,240,239,0.3)', marginBottom: '8px' }}>Ready for next stage?</p>
                      <p style={{ fontSize: '14px', color: 'rgba(240,240,239,0.7)', lineHeight: 1.6,
                        fontWeight: 300, fontFamily: "Georgia, serif", fontStyle: 'italic' }}>
                        "{s.conceptCheck}"
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })()}
          </motion.div>
        )}

      </main>

      {/* ── Paper modal ── */}
      {paperModal && (
        <div onClick={() => setPaperModal(false)} style={{ position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', padding: '32px', width: '100%',
              maxWidth: '420px', margin: '0 16px' }}>

            <h2 style={{ fontFamily: "Georgia, serif", fontSize: '22px',
              fontWeight: 400, color: '#f0f0ef', marginBottom: '6px' }}>Write a Paper</h2>
            <p style={{ fontSize: '13px', color: 'rgba(240,240,239,0.35)',
              marginBottom: '28px', fontWeight: 300 }}>
              based on "{submitted.length > 45 ? submitted.slice(0, 45) + '...' : submitted}"
            </p>

            <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(240,240,239,0.3)', marginBottom: '10px' }}>Paper Type</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {['essay', 'research paper'].map(type => (
                <button key={type} onClick={() => setPaperType(type)} style={{
                  flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px',
                  textTransform: 'capitalize', cursor: 'pointer',
                  border: `1px solid ${paperType === type ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  backgroundColor: paperType === type ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: paperType === type ? '#f0f0ef' : 'rgba(240,240,239,0.35)',
                  transition: 'all 0.2s' }}>{type}</button>
              ))}
            </div>

            <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(240,240,239,0.3)', marginBottom: '10px' }}>Word Count</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
              {[500, 1000, 2000].map(count => (
                <button key={count} onClick={() => setPaperWords(count)} style={{
                  flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer',
                  border: `1px solid ${paperWords === count ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  backgroundColor: paperWords === count ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: paperWords === count ? '#f0f0ef' : 'rgba(240,240,239,0.35)',
                  transition: 'all 0.2s' }}>{count.toLocaleString()}w</button>
              ))}
            </div>

            <button onClick={handlePaper} style={{ width: '100%', padding: '14px',
              borderRadius: '12px', backgroundColor: '#f0f0ef', color: '#080808',
              border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
              Generate Paper →
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// ── Stage Panel ───────────────────────────────────────────────
// Reusable loading animation shown during all API calls
function StagePanel({ stages, current, title }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: '24px 28px', borderRadius: '16px', marginBottom: '32px',
        border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
      <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.3)', marginBottom: '18px' }}>{title}</p>
      {stages.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '12px', opacity: i > current ? 0.2 : 1, transition: 'opacity 0.4s' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: i < current ? '1px solid rgba(16,185,129,0.5)'
              : i === current ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
            backgroundColor: i < current ? 'rgba(16,185,129,0.15)' : 'transparent' }}>
            {i < current ? (
              <svg width="10" height="10" fill="none" stroke="rgba(16,185,129,0.9)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : i === current ? (
              <div style={{ width: '8px', height: '8px', borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.6)', borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <div style={{ width: '5px', height: '5px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 300, transition: 'color 0.4s',
            color: i <= current ? '#f0f0ef' : 'rgba(240,240,239,0.25)' }}>{s}</span>
        </div>
      ))}
    </motion.div>
  )
}

// ── Source Card ───────────────────────────────────────────────
// Used in research sources grid and learn resources grid
// compact prop reduces size for learning path stage resources
function SourceCard({ source, compact }) {
  const color  = getColor(source.source)
  const hasImg = !!source.thumbnail && !compact

  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', color: 'inherit',
        borderRadius: '14px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        transition: 'border-color 0.2s, transform 0.2s' }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}>

      {hasImg && (
        <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
          <img src={source.thumbnail} alt={source.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.display = 'none' }} />
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 60%)' }} />
        </div>
      )}

      <div style={{ padding: compact ? '12px 14px' : '14px 16px 16px',
        marginTop: hasImg ? '-24px' : '0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '2px 8px', borderRadius: '9999px',
            border: `1px solid ${color.border}`, backgroundColor: color.bg, color: color.text }}>
            {source.source}
          </span>
          {source.score && (
            <span style={{ fontSize: '10px',
              color: source.score >= 7 ? 'rgba(16,185,129,0.6)' : 'rgba(251,191,36,0.5)' }}>
              {source.score}
            </span>
          )}
        </div>

        <p style={{ fontSize: compact ? '12px' : '13px', fontWeight: 400, color: '#f0f0ef',
          lineHeight: 1.4, marginBottom: '6px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {source.title}
        </p>

        {source.description && !compact && (
          <p style={{ fontSize: '11px', color: 'rgba(240,240,239,0.4)', lineHeight: 1.6, fontWeight: 300,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {source.description}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          {source.date && <span style={{ fontSize: '10px', color: 'rgba(240,240,239,0.2)' }}>{source.date}</span>}
          <span style={{ fontSize: '11px', color: 'rgba(240,240,239,0.15)', marginLeft: 'auto' }}>→</span>
        </div>
      </div>
    </a>
  )
}