import { type FormEvent, useEffect, useMemo, useState } from 'react'

type Flashcard = {
  id: string
  question: string
  answer: string
}

const storageKey = 'flashcard-quiz-cards'

const starterCards: Flashcard[] = [
  {
    id: 'starter-html',
    question: 'What is HTML?',
    answer: 'HTML is the standard markup language for web pages.',
  },
  {
    id: 'starter-css',
    question: 'What is CSS?',
    answer: 'CSS is used to style HTML elements.',
  },
  {
    id: 'starter-js',
    question: 'What is JavaScript?',
    answer: 'JavaScript adds interactivity to web pages.',
  },
]

const sanitizeText = (value: string) => value.trim()

const createId = () =>
  `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const loadStoredCards = (): Flashcard[] => {
  if (typeof window === 'undefined') return starterCards
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return starterCards
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return starterCards
    const cleaned = parsed
      .map((item) => ({
        id: typeof item?.id === 'string' ? item.id : createId(),
        question: typeof item?.question === 'string' ? item.question : '',
        answer: typeof item?.answer === 'string' ? item.answer : '',
      }))
      .filter((item) => item.question && item.answer)
    return cleaned.length ? cleaned : starterCards
  } catch {
    return starterCards
  }
}

function App() {
  const [cards, setCards] = useState<Flashcard[]>(() => loadStoredCards())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [questionInput, setQuestionInput] = useState('')
  const [answerInput, setAnswerInput] = useState('')
  const [formErrors, setFormErrors] = useState({ question: '', answer: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState('')
  const [editingAnswer, setEditingAnswer] = useState('')

  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return cards
    return cards.filter((card) => card.question.toLowerCase().includes(query))
  }, [cards, searchQuery])

  const activeCard = filteredCards[currentIndex]
  const activeId = activeCard?.id ?? null

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(cards))
    } catch {
      // Ignore storage errors to keep the app usable.
    }
  }, [cards])

  useEffect(() => {
    setCurrentIndex(0)
    setShowAnswer(false)
  }, [searchQuery])

  useEffect(() => {
    if (currentIndex >= filteredCards.length) {
      setCurrentIndex(Math.max(0, filteredCards.length - 1))
    }
  }, [currentIndex, filteredCards.length])

  useEffect(() => {
    setShowAnswer(false)
  }, [currentIndex])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!editingId) return
      if (event.key === 'Escape') {
        setEditingId(null)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [editingId])

  const handleAddCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextQuestion = sanitizeText(questionInput)
    const nextAnswer = sanitizeText(answerInput)
    const nextErrors = {
      question: nextQuestion ? '' : 'Question is required.',
      answer: nextAnswer ? '' : 'Answer is required.',
    }
    setFormErrors(nextErrors)

    if (!nextQuestion || !nextAnswer) return

    const newCard: Flashcard = {
      id: createId(),
      question: nextQuestion,
      answer: nextAnswer,
    }

    setCards((prev) => [...prev, newCard])
    setQuestionInput('')
    setAnswerInput('')
    setSearchQuery('')
    setCurrentIndex(filteredCards.length)
  }

  const handleDeleteCard = (cardId: string) => {
    const confirmed = window.confirm('Delete this flashcard?')
    if (!confirmed) return

    setCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const handleSelectCard = (index: number) => {
    setCurrentIndex(index)
  }

  const handleStartEdit = (card: Flashcard) => {
    setEditingId(card.id)
    setEditingQuestion(card.question)
    setEditingAnswer(card.answer)
  }

  const handleSaveEdit = () => {
    const nextQuestion = sanitizeText(editingQuestion)
    const nextAnswer = sanitizeText(editingAnswer)
    if (!nextQuestion || !nextAnswer) return

    setCards((prev) =>
      prev.map((card) =>
        card.id === editingId
          ? { ...card, question: nextQuestion, answer: nextAnswer }
          : card,
      ),
    )
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const isFirstCard = currentIndex === 0
  const isLastCard = currentIndex === filteredCards.length - 1

  return (
    <div className="app-shell min-h-screen px-4 pb-12 pt-10 sm:px-6 lg:px-10">
      <header className="mx-auto mb-10 max-w-6xl">
        <div className="hero-panel">
          <div className="flex flex-col gap-4">
            <span className="badge">Flashcard Quiz</span>
            <h1 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              Flashcard Quiz App
            </h1>
            <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
              Study smarter with interactive flashcards. Create, review, and refine
              your knowledge in a clean, focused workspace.
            </p>
            <div className="hero-metrics">
              <div className="metric-card">
                <span>Cards</span>
                <strong>{cards.length}</strong>
              </div>
              <div className="metric-card">
                <span>In view</span>
                <strong>{filteredCards.length}</strong>
              </div>
              <div className="metric-card">
                <span>Storage</span>
                <strong>Local</strong>
              </div>
            </div>
          </div>
          <div className="spotlight-card">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Focus Mode
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              Flip, review, and lock in answers with minimal distractions.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip">Keyboard ready</span>
              <span className="chip">Instant save</span>
              <span className="chip">Clean layout</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="panel-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Current Card
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {filteredCards.length
                  ? `Card ${currentIndex + 1} of ${filteredCards.length}`
                  : 'No cards yet'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span aria-live="polite">
                {filteredCards.length
                  ? `${filteredCards.length} cards in view`
                  : 'Add your first card below'}
              </span>
            </div>
          </div>

          <div className="mt-8">
            {activeCard ? (
              <div className="flip-card" aria-live="polite">
                <div
                  className={`flip-card-inner ${showAnswer ? 'is-flipped' : ''}`}
                >
                  <div className="flip-card-face">
                    <span className="card-label">Question</span>
                    <p className="card-text">{activeCard.question}</p>
                  </div>
                  <div className="flip-card-face flip-card-back">
                    <span className="card-label">Answer</span>
                    <p className="card-text">{activeCard.answer}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <p className="text-lg font-semibold text-slate-700">
                  {cards.length
                    ? 'No flashcards match your search.'
                    : 'No flashcards yet.'}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {cards.length
                    ? 'Try clearing the search or add a new card.'
                    : 'Use the form to add your first question and answer.'}
                </p>
                {cards.length ? (
                  <button
                    type="button"
                    className="btn-ghost mt-4"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </button>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowAnswer((prev) => !prev)}
                disabled={!activeCard}
                aria-pressed={showAnswer}
              >
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => activeCard && handleStartEdit(activeCard)}
                disabled={!activeCard}
              >
                Edit Card
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => activeCard && handleDeleteCard(activeCard.id)}
                disabled={!activeCard}
              >
                Delete Card
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                disabled={!activeCard || isFirstCard}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() =>
                  setCurrentIndex((prev) =>
                    Math.min(prev + 1, filteredCards.length - 1),
                  )
                }
                disabled={!activeCard || isLastCard}
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <aside className="panel-card">
          <div>
            <h2 className="font-display text-2xl text-slate-900">
              Flashcard Library
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Jump to any card, edit details, or remove outdated answers.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Search by question
            </label>
            <input
              type="search"
              placeholder="Search flashcards"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[var(--accent)]"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="card-list">
            {filteredCards.length ? (
              filteredCards.map((card, index) => (
                <div
                  key={card.id}
                  className={`card-list-item ${
                    activeId === card.id ? 'is-active' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="flex flex-1 flex-col gap-1 text-left"
                    onClick={() => handleSelectCard(index)}
                  >
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Card {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {card.question}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="chip-button"
                      onClick={() => handleStartEdit(card)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="chip-button chip-button-danger"
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                {cards.length
                  ? 'No flashcards match your search.'
                  : 'Your flashcards will show up here.'}
              </div>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleAddCard}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Question
              </label>
              <textarea
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[var(--accent)]"
                placeholder="Type the flashcard question"
                value={questionInput}
                onChange={(event) => setQuestionInput(event.target.value)}
              />
              {formErrors.question ? (
                <p className="mt-1 text-xs font-semibold text-red-500">
                  {formErrors.question}
                </p>
              ) : null}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Answer
              </label>
              <textarea
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[var(--accent)]"
                placeholder="Type the flashcard answer"
                value={answerInput}
                onChange={(event) => setAnswerInput(event.target.value)}
              />
              {formErrors.answer ? (
                <p className="mt-1 text-xs font-semibold text-red-500">
                  {formErrors.answer}
                </p>
              ) : null}
            </div>

            <button type="submit" className="btn-primary w-full">
              Add Flashcard
            </button>
          </form>
        </aside>
      </main>

      {editingId ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3 className="font-display text-2xl text-slate-900">
              Edit flashcard
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Update the question or answer and save when ready.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Question
                </label>
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[var(--accent)]"
                  value={editingQuestion}
                  onChange={(event) => setEditingQuestion(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Answer
                </label>
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[var(--accent)]"
                  value={editingAnswer}
                  onChange={(event) => setEditingAnswer(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="btn-ghost"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveEdit}
                disabled={!sanitizeText(editingQuestion) || !sanitizeText(editingAnswer)}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
