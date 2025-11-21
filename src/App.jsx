import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'toy-diary-entries'

const moods = [
  { value: 'bright', label: '😊 Bright' },
  { value: 'calm', label: '😌 Calm' },
  { value: 'reflective', label: '🧠 Reflective' },
  { value: 'stormy', label: '🌧️ Stormy' }
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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
        <p className="text-sm text-white/60">Total entries</p>
        <p className="text-3xl font-semibold text-white">{entries.length}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
        <p className="text-sm text-white/60">Last saved</p>
        <p className="text-lg text-white">{entries[0] ? formatTime(entries[0].updatedAt) : '—'}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
        <p className="text-sm text-white/60">Mood mix</p>
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
          <h3 className="mt-2 text-xl font-semibold text-white">{entry.title || 'Untitled note'}</h3>
          <p className="mt-2 text-white/70">{entry.content || 'No content added yet.'}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">
          {moods.find(m => m.value === entry.mood)?.label || '📝 Note'}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-white/60">
        <p>Updated • {formatTime(entry.updatedAt)}</p>
        <div className="flex gap-3 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/20"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="rounded-full bg-rose-500/80 px-3 py-1 text-white hover:bg-rose-500"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

function Filters ({ search, date, onSearchChange, onDateChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]">
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white backdrop-blur focus-within:border-white/30">
        <span className="text-white/60">🔍</span>
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search title or content"
          className="w-full bg-transparent text-white placeholder:text-white/50 focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white backdrop-blur focus-within:border-white/30">
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
            Clear
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.15),transparent_28%)]" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-12 pt-14 sm:px-8">
        <header className="flex flex-col gap-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-white/80 backdrop-blur">
            <span className="text-lg">✨</span> Curate your day with intention
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Toy Diary</h1>
              <p className="mt-3 max-w-2xl text-lg text-white/70">
                Capture the pulse of your day with a minimalist, modern journal. Log thoughts, moods, and highlights in one luminous space.
              </p>
            </div>
            <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur">
              Local mode • autosaves instantly
            </div>
          </div>
          <Stats entries={entries} />
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">Journal</p>
                <h2 className="text-2xl font-semibold text-white">
                  {editingId ? 'Edit entry' : 'New entry'}
                </h2>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
                >
                  Cancel edit
                </button>
              )}
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-white/70">
                  <span className="text-white">Date</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-white/30"
                  />
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span className="text-white">Mood</span>
                  <select
                    value={form.mood}
                    onChange={e => setForm(prev => ({ ...prev, mood: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-white/30"
                  >
                    {moods.map(mood => (
                      <option key={mood.value} value={mood.value} className="bg-slate-900 text-white">
                        {mood.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-2 text-sm text-white/70">
                <span className="text-white">Title</span>
                <input
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Slow morning with a bright walk"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder:text-white/50 outline-none transition focus:border-white/30"
                />
              </label>

              <label className="space-y-2 text-sm text-white/70">
                <span className="text-white">Notes</span>
                <textarea
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Capture highlights, feelings, and what you want to remember."
                  className="min-h-[160px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 outline-none transition focus:border-white/30"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-white/60">
                  Entries save locally. No sign-in required.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
                  >
                    {editingId ? 'Update entry' : 'Save entry'}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">Library</p>
                <h2 className="text-2xl font-semibold text-white">Recent entries</h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">
                {filteredEntries.length} shown
              </span>
            </div>

            <Filters
              search={search}
              date={filterDate}
              onSearchChange={setSearch}
              onDateChange={setFilterDate}
            />

            <div className="space-y-4">
              {filteredEntries.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-white/70 backdrop-blur">
                  <p className="text-lg font-semibold text-white">No entries yet</p>
                  <p className="mt-1">Write your first note to see it here.</p>
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
