import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'toy-diary-entries'

const moods = [
  { value: 'bright', label: '😊 밝음' },
  { value: 'calm', label: '😌 차분' },
  { value: 'reflective', label: '🧠 성찰적' },
  { value: 'stormy', label: '🌧️ 우중충' }
]

const emptyEntry = {
  id: null,
  date: new Date().toISOString().slice(0, 10),
  title: '',
  content: '',
  mood: moods[1].value
}

function formatTime (timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function Stats ({ entries }) {
  const moodCount = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1
    return acc
  }, {})

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur">
        <p className="text-sm text-white/70">총 기록</p>
        <p className="text-3xl font-semibold text-white">{entries.length}</p>
      </div>
      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur">
        <p className="text-sm text-white/70">마지막 저장</p>
        <p className="text-lg text-white">{entries[0] ? formatTime(entries[0].updatedAt) : '—'}</p>
      </div>
      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur">
        <p className="text-sm text-white/70">기분 분포</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-white">
          {moods.map(mood => (
            <span key={mood.value} className="rounded-full bg-white/10 px-3 py-1">
              {mood.label.split(' ')[0]} {moodCount[mood.value] || 0}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function EntryCard ({ entry, onEdit, onDelete }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">{entry.date}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{entry.title || '제목 없음'}</h3>
          <p className="mt-2 text-white/70">{entry.content || '아직 내용이 없어요.'}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">
          {moods.find(m => m.value === entry.mood)?.label || '📝 메모'}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-white/65">
        <p>업데이트 • {formatTime(entry.updatedAt)}</p>
        <div className="flex gap-3 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/20"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="rounded-full bg-rose-500/80 px-3 py-1 text-white hover:bg-rose-500"
          >
            삭제
          </button>
        </div>
      </div>
    </article>
  )
}

function Filters ({ search, date, onSearchChange, onDateChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]">
      <label className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-white backdrop-blur focus-within:border-white/40">
        <span className="text-white/60">🔍</span>
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="제목이나 내용을 검색해보세요"
          className="w-full bg-transparent text-white placeholder:text-white/60 focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-white backdrop-blur focus-within:border-white/40">
        <span className="text-white/60">📅</span>
        <input
          type="date"
          value={date}
          onChange={e => onDateChange(e.target.value)}
          className="w-full bg-transparent text-white placeholder:text-white/50 focus:outline-none"
        />
        {date && (
          <button
            type="button"
            onClick={() => onDateChange('')}
            className="text-sm text-white/60 hover:text-white"
          >
            지우기
          </button>
        )}
      </label>
    </div>
  )
}

function App () {
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState(emptyEntry)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        setEntries(parsed.sort((a, b) => b.updatedAt - a.updatedAt))
      }
    } catch (error) {
      console.error('Failed to load saved entries', error)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase()
    return entries.filter(entry => {
      const matchesTerm = term
        ? entry.title.toLowerCase().includes(term) || entry.content.toLowerCase().includes(term)
        : true
      const matchesDate = filterDate ? entry.date === filterDate : true
      return matchesTerm && matchesDate
    })
  }, [entries, search, filterDate])

  const resetForm = () => {
    setForm({ ...emptyEntry, date: new Date().toISOString().slice(0, 10) })
    setEditingId(null)
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (!form.title.trim() && !form.content.trim()) return

    const payload = {
      ...form,
      id: editingId ?? (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
      updatedAt: Date.now()
    }

    setEntries(prev => {
      const next = editingId
        ? prev.map(entry => (entry.id === editingId ? payload : entry))
        : [payload, ...prev]
      return next.sort((a, b) => b.updatedAt - a.updatedAt)
    })

    resetForm()
  }

  const handleEdit = entry => {
    setEditingId(entry.id)
    setForm({ ...entry })
  }

  const handleDelete = id => {
    setEntries(prev => prev.filter(entry => entry.id !== id))
    if (editingId === id) {
      resetForm()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-800 to-sky-900 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(129,140,248,0.28),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.25),transparent_30%)]" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-14 pt-14 sm:px-8">
        <header className="flex flex-col gap-7">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white/85 backdrop-blur">
            <span className="text-lg">✨</span> 하루를 더 밝고 의도적으로 정리해보세요
          </p>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">토이 다이어리</h1>
              <p className="mt-3 max-w-2xl text-lg text-white/80">
                미니멀한 저널에서 하루의 순간과 기분을 기록하세요. 가벼운 메모부터 깊은 생각까지 한눈에 정리됩니다.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur">
              로컬 모드 • 자동 저장
            </div>
          </div>
          <Stats entries={entries} />
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {editingId ? '기록 편집' : '새 기록'}
                </h2>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25"
                >
                  편집 취소
                </button>
              )}
            </div>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-3 text-sm text-white/75">
                  <span className="text-white text-base">날짜</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-white outline-none transition focus:border-white/40"
                  />
                </label>
                <label className="space-y-3 text-sm text-white/75">
                  <span className="text-white text-base">기분</span>
                  <select
                    value={form.mood}
                    onChange={e => setForm(prev => ({ ...prev, mood: e.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-white outline-none transition focus:border-white/40"
                  >
                    {moods.map(mood => (
                      <option key={mood.value} value={mood.value} className="bg-slate-900 text-white">
                        {mood.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-3 text-sm text-white/75 ">
                <span className="text-white text-base inline-block mt-5">제목</span>
                <input
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="예) 햇살 좋은 아침 산책"
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-white placeholder:text-white/60 outline-none transition focus:border-white/40"
                />
              </label>

              <label className="space-y-3 text-sm text-white/75">
                <span className="text-white text-base inline-block mt-5">내용</span>
                <textarea
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="오늘 기억하고 싶은 감정과 순간을 적어보세요."
                  className="min-h-[170px] w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-white placeholder:text-white/60 outline-none transition focus:border-white/40"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-white/70">
                  기록은 로컬에만 저장되어 로그인 없이도 안심하고 사용할 수 있어요.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-white/25 px-4 py-2.5 text-sm font-medium text-white/85 transition hover:border-white/45 hover:text-white"
                  >
                    초기화
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-300 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-400/30 transition hover:shadow-sky-400/50"
                  >
                    {editingId ? '기록 업데이트' : '기록 저장'}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="space-y-4 lg:flex lg:flex-col">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">라이브러리</p>
                <h2 className="text-2xl font-semibold text-white">최근 기록</h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/75">
                {filteredEntries.length}개 표시 중
              </span>
            </div>

            <Filters
              search={search}
              date={filterDate}
              onSearchChange={setSearch}
              onDateChange={setFilterDate}
            />

            <div className="space-y-4  h-[500px] overflow-y-auto lg:pr-2">
              {filteredEntries.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/10 p-6 text-center text-white/75 backdrop-blur">
                  <p className="text-lg font-semibold text-white">아직 기록이 없어요</p>
                  <p className="mt-1">첫 번째 메모를 작성해보세요.</p>
                </div>
              )}
              {filteredEntries.map(entry => (
                <EntryCard key={entry.id} entry={entry} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
