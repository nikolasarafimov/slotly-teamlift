import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import {
  ApiError,
  getErrorMessage,
  slotsApi,
} from '../lib/api'

import {
  formatDate,
  formatTime,
  getLocalDateKey,
  getSlotEndTime,
  getTimeZone,
} from '../lib/dates'

import type {
  BookingResponse,
  Slot,
} from '../types/scheduling'

function BookingPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<BookingResponse | null>(null)

  
  const loadSlots = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await slotsApi.getAvailable(signal)

      if (!signal?.aborted) {
        setSlots(data)
        setLoadError(null)
      }
    } catch (error) {
      if (signal?.aborted) return

      setLoadError(getErrorMessage(error))
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  function refreshSlots() {
    setLoading(true)
    setLoadError(null)
    void loadSlots()
  }

  
  useEffect(() => {
    const controller = new AbortController()

    slotsApi
      .getAvailable(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return

        setSlots(data)
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

        setLoadError(getErrorMessage(error))
      })
      .finally(() => {
        if (controller.signal.aborted) return

        setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [])


  const dates = useMemo(() => {
    const dateMap = new Map<
      string,
      { key: string; example: string; count: number }
    >()

    for (const slot of slots) {
      const key = getLocalDateKey(slot.startsAt)
      const existing = dateMap.get(key)

      if (existing) {
        existing.count += 1
      } else {
        dateMap.set(key, {
          key,
          example: slot.startsAt,
          count: 1,
        })
      }
    }

    return [...dateMap.values()].sort((a, b) =>
      a.key.localeCompare(b.key),
    )
  }, [slots])

  const activeDate =
    selectedDate && dates.some((date) => date.key === selectedDate)
      ? selectedDate
      : dates[0]?.key ?? null

  const dailySlots = useMemo(
    () =>
      slots
        .filter(
          (slot) =>
            getLocalDateKey(slot.startsAt) === activeDate,
        )
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() -
            new Date(b.startsAt).getTime(),
        ),
    [slots, activeDate],
  )

  const selectedSlot = dailySlots.find(
    (slot) => slot.id === selectedSlotId,
  )

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedSlot || submitting) return

    setSubmitting(true)
    setBookingError(null)

    try {
      const result = await slotsApi.book(selectedSlot.id, {
        name: name.trim(),
        email: email.trim(),
      })

      setConfirmation(result)
      setSlots((current) =>
        current.filter((slot) => slot.id !== selectedSlot.id),
      )
      setSelectedSlotId(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setBookingError(
          'Someone has just booked this time slot. Please choose another.',
        )
        void loadSlots()
      } else {
        setBookingError(getErrorMessage(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  function resetBooking() {
    setConfirmation(null)
    setBookingError(null)
    setSelectedSlotId(null)
    setName('')
    setEmail('')
    refreshSlots()
  }

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-[#111630] px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-indigo-100">
            <Sparkles size={15} />
            Effortless scheduling
          </div>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Great conversations
            <span className="block text-indigo-300">
              start with a time.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Find an available time, reserve your spot, and
            get an instant confirmation. No endless emails,
            no complicated scheduling.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 size={17} className="text-indigo-300" />
              Real-time availability
            </span>

            <span className="flex items-center gap-2 text-sm text-slate-300">
              <ShieldCheck size={17} className="text-indigo-300" />
              Secure booking logic
            </span>

            <span className="flex items-center gap-2 text-sm text-slate-300">
              <Clock3 size={17} className="text-indigo-300" />
              Your local time zone
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Book a meeting
            </p>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Choose your perfect time
            </h2>

            <p className="mt-3 text-slate-500">
              All appointments are displayed in your local time zone.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshSlots}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh availability
          </button>
        </div>

        {loading && (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm font-medium text-indigo-700"
          >
            <LoaderCircle size={20} className="animate-spin" />
            Loading available appointments...
          </div>
        )}

        {loadError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-bold">Unable to load appointments</p>
              <p className="mt-1 text-sm">{loadError}</p>
            </div>
          </div>
        )}

        {!loading && !loadError && slots.length === 0 && !confirmation && (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
              <CalendarX2 size={36} />
            </div>

            <h3 className="text-2xl font-bold">
              No available appointments
            </h3>

            <p className="mx-auto mt-3 max-w-md leading-7 text-slate-500">
              There are no open time slots right now.
              Check back later or ask the host to add availability.
            </p>
          </div>
        )}

        {confirmation ? (
          <div
            role="status"
            className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-12"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={44} />
            </div>

            <h3 className="text-3xl font-extrabold">
              Booking confirmed!
            </h3>

            <p className="mt-3 leading-7 text-slate-500">
              Your appointment has been successfully
              saved. Here are your booking details.
            </p>

            <div className="mt-8 space-y-3 rounded-2xl bg-slate-50 p-6 text-left">
              <p className="font-bold text-slate-900">
                {formatDate(confirmation.slot.startsAt)}
              </p>

              <p className="text-sm text-slate-600">
                {formatTime(confirmation.slot.startsAt)}
                {' – '}
                {getSlotEndTime(
                  confirmation.slot.startsAt,
                  confirmation.slot.durationMinutes,
                )}
              </p>

              <p className="text-sm text-slate-600">
                Name: {confirmation.booking.name}
              </p>

              <p className="text-sm text-slate-600">
                Email: {confirmation.booking.email}
              </p>

              <p className="break-all text-xs text-slate-400">
                Booking ID: {confirmation.booking.id}
              </p>
            </div>

            <p className="mt-5 text-xs text-slate-400">
              Confirmation is shown on this page.
              Email notifications are not enabled.
            </p>

            <button
              type="button"
              onClick={resetBooking}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white transition hover:bg-indigo-700"
            >
              Book another appointment
              <ArrowRight size={18} />
            </button>
          </div>
        ) : slots.length > 0 && (
          <div className="grid items-start gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                    <CalendarDays size={22} />
                  </div>

                  <div>
                    <h3 className="font-bold">Select a date</h3>
                    <p className="text-sm text-slate-500">
                      {slots.length} available appointment(s)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-3">
                  {dates.map((date) => {
                    const active = activeDate === date.key
                    const dateValue = new Date(date.example)

                    return (
                      <button
                        key={date.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setSelectedDate(date.key)
                          setSelectedSlotId(null)
                          setBookingError(null)
                        }}
                        className={`min-w-21 shrink-0 rounded-2xl border px-3 py-4 text-center transition ${
                          active
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        <span className="block text-xs font-medium opacity-70">
                          {new Intl.DateTimeFormat('en-US', {
                            weekday: 'short',
                          }).format(dateValue)}
                        </span>

                        <span className="mt-2 block text-2xl font-extrabold">
                          {dateValue.getDate()}
                        </span>

                        <span className="mt-1 block text-xs opacity-75">
                          {date.count} slot(s)
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                    <Clock3 size={22} />
                  </div>

                  <div>
                    <h3 className="font-bold">Available times</h3>
                    <p className="text-sm text-slate-500">
                      {dailySlots.length > 0
                        ? formatDate(dailySlots[0].startsAt)
                        : 'Select a date'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {dailySlots.map((slot) => {
                    const active = selectedSlot?.id === slot.id

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setSelectedSlotId(slot.id)
                          setBookingError(null)
                        }}
                        className={`rounded-xl border px-3 py-4 text-center transition ${
                          active
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100'
                            : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        <span className="block text-sm font-bold">
                          {formatTime(slot.startsAt)}
                        </span>
                        <span className="mt-1 block text-xs opacity-70">
                          {slot.durationMinutes} min
                        </span>
                      </button>
                    )
                  })}
                </div>

                <p className="mt-6 flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck size={15} />
                  Time zone: {getTimeZone()}
                </p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="text-xl font-bold">
                  Complete your booking
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Just a few details and you're all set.
                </p>

                <div className="my-7 rounded-2xl bg-slate-50 p-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Your selection
                  </p>

                  {selectedSlot ? (
                    <>
                      <p className="font-semibold text-slate-900">
                        {formatDate(selectedSlot.startsAt)}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatTime(selectedSlot.startsAt)}
                        {' – '}
                        {getSlotEndTime(
                          selectedSlot.startsAt,
                          selectedSlot.durationMinutes,
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Select a time slot to continue.
                    </p>
                  )}
                </div>

                <form
                  onSubmit={(event) => void handleBooking(event)}
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="booking-name"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Full name
                    </label>

                    <input
                      id="booking-name"
                      type="text"
                      autoComplete="name"
                      minLength={2}
                      maxLength={100}
                      required
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="booking-email"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Email address
                    </label>

                    <input
                      id="booking-email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      required
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  {bookingError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                    >
                      <AlertCircle size={18} className="shrink-0" />
                      {bookingError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedSlot || submitting || loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-4 font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle size={18} className="animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        Confirm booking
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                  Your booking will be saved securely
                  in the scheduling database.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default BookingPage