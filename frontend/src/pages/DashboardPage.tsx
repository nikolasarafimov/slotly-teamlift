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
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  RefreshCw,
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
  getSlotEndTime,
  getTimeZone,
} from '../lib/dates'

import type { Slot } from '../types/scheduling'

type SlotStatus = 'available' | 'booked' | 'expired'
type Filter = 'all' | SlotStatus

function getStatus(
  slot: Slot,
  now: number | null,
): SlotStatus {
  if (slot.isBooked) {
    return 'booked'
  }

  if (
    now !== null &&
    new Date(slot.startsAt).getTime() <= now
  ) {
    return 'expired'
  }

  return 'available'
}

function getDefaultDateTime(): string {
  const date = new Date()

  date.setDate(date.getDate() + 1)
  date.setHours(10, 0, 0, 0)

  const offset = date.getTimezoneOffset() * 60_000

  return new Date(
    date.getTime() - offset,
  ).toISOString().slice(0, 16)
}

const statusStyles: Record<SlotStatus, string> = {
  available: 'bg-emerald-50 text-emerald-700',
  booked: 'bg-indigo-50 text-indigo-700',
  expired: 'bg-slate-100 text-slate-500',
}

function DashboardPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [now, setNow] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [startsAt, setStartsAt] = useState(
    getDefaultDateTime,
  )

  const [duration, setDuration] = useState('30')
  const [creating, setCreating] = useState(false)

  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  const [filter, setFilter] = useState<Filter>('all')

  const loadSlots = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const data = await slotsApi.getAll(signal)

        if (signal?.aborted) {
          return
        }

        setSlots(data)
        setNow(Date.now())
        setLoadError(null)
      } catch (error) {
        if (signal?.aborted) {
          return
        }

        setLoadError(getErrorMessage(error))
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    const controller = new AbortController()

    slotsApi
      .getAll(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) {
          return
        }

        setSlots(data)
        setNow(Date.now())
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setLoadError(getErrorMessage(error))
      })
      .finally(() => {
        if (controller.signal.aborted) {
          return
        }

        setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [])

  function refreshSlots() {
    setLoading(true)
    setLoadError(null)
    void loadSlots()
  }

  const stats = useMemo(() => {
    const available = slots.filter(
      (slot) =>
        !slot.isBooked &&
        now !== null &&
        new Date(slot.startsAt).getTime() > now,
    ).length

    const booked = slots.filter(
      (slot) => slot.isBooked,
    ).length

    return {
      total: slots.length,
      available,
      booked,
    }
  }, [slots, now])

  const filteredSlots = useMemo(() => {
    const ordered = [...slots].sort(
      (a, b) =>
        new Date(a.startsAt).getTime() -
        new Date(b.startsAt).getTime(),
    )

    if (filter === 'all') {
      return ordered
    }

    return ordered.filter(
      (slot) => getStatus(slot, now) === filter,
    )
  }, [slots, filter, now])

  async function handleCreate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (creating) {
      return
    }

    setCreateError(null)
    setCreateSuccess(null)

    const startDate = new Date(startsAt)
    const durationMinutes = Number(duration)

    if (
      !startsAt ||
      !Number.isFinite(startDate.getTime()) ||
      startDate.getTime() <= Date.now()
    ) {
      setCreateError(
        'Please select a valid future date and time.',
      )
      return
    }

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 15 ||
      durationMinutes > 240
    ) {
      setCreateError(
        'Duration must be between 15 and 240 minutes.',
      )
      return
    }

    setCreating(true)

    try {
      const created = await slotsApi.create({
        startsAt: startDate.toISOString(),
        durationMinutes,
      })

      setCreateSuccess(
        `Your appointment on ${formatDate(created.startsAt)} at ${formatTime(created.startsAt)} was created successfully.`,
      )

      setStartsAt(getDefaultDateTime())
      setDuration('30')
      setFilter('all')

      await loadSlots()
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409
      ) {
        setCreateError(
          'This time overlaps an existing appointment. Please choose another time.',
        )
      } else if (
        error instanceof ApiError &&
        error.status === 429
      ) {
        setCreateError(
          'Too many requests. Please wait a minute and try again.',
        )
      } else {
        setCreateError(getErrorMessage(error))
      }
    } finally {
      setCreating(false)
    }
  }

  const filterOptions: {
    value: Filter
    label: string
  }[] = [
    { value: 'all', label: 'All slots' },
    { value: 'available', label: 'Available' },
    { value: 'booked', label: 'Booked' },
    { value: 'expired', label: 'Expired' },
  ]

  return (
    <main className="min-h-screen">
      <section className="bg-[#111630] px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-indigo-100">
            <Sparkles size={14} />
            Your scheduling workspace
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Your dashboard
            <span className="text-indigo-300">.</span>
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            Manage your availability, create appointments,
            and keep your schedule organized in one place.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-10 grid gap-5 sm:grid-cols-3">
          {[
            {
              label: 'Total slots',
              value: stats.total,
              icon: CalendarDays,
              iconStyle: 'bg-indigo-50 text-indigo-600',
            },
            {
              label: 'Available',
              value: stats.available,
              icon: Clock3,
              iconStyle: 'bg-emerald-50 text-emerald-600',
            },
            {
              label: 'Booked',
              value: stats.booked,
              icon: CalendarCheck2,
              iconStyle: 'bg-violet-50 text-violet-600',
            },
          ].map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div
                  className={`mb-5 inline-flex rounded-xl p-3 ${item.iconStyle}`}
                >
                  <Icon size={23} />
                </div>

                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>

                <p className="mt-2 text-4xl font-extrabold tracking-tight">
                  {loading && slots.length === 0
                    ? '—'
                    : item.value}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-7 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  <Plus size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Create a new slot
                  </h2>

                  <p className="text-sm text-slate-500">
                    Add availability to your calendar
                  </p>
                </div>
              </div>

              <form
                onSubmit={(event) => void handleCreate(event)}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="slot-start"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Date and start time
                  </label>

                  <input
                    id="slot-start"
                    type="datetime-local"
                    required
                    value={startsAt}
                    onChange={(event) =>
                      setStartsAt(event.target.value)
                    }
                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="slot-duration"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Duration
                  </label>

                  <select
                    id="slot-duration"
                    value={duration}
                    onChange={(event) =>
                      setDuration(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1 hour 30 minutes</option>
                    <option value="120">2 hours</option>
                    <option value="240">4 hours</option>
                  </select>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">
                  Appointments are created in your local time
                  zone ({getTimeZone()}).
                </div>

                {createError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                  >
                    <AlertCircle
                      size={18}
                      className="shrink-0"
                    />
                    {createError}
                  </div>
                )}

                {createSuccess && (
                  <div
                    role="status"
                    className="flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
                  >
                    <CheckCircle2
                      size={18}
                      className="shrink-0"
                    />
                    {createSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-4 font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                      Creating appointment...
                    </>
                  ) : (
                    <>
                      Create time slot
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <div className="flex items-start gap-3">
                <LayoutDashboard
                  size={20}
                  className="mt-0.5 shrink-0 text-indigo-600"
                />

                <div>
                  <p className="font-bold text-indigo-900">
                    Smart scheduling
                  </p>

                  <p className="mt-1 text-sm leading-6 text-indigo-700">
                    Overlapping time slots are rejected by
                    the backend, helping you maintain a clear,
                    conflict-free calendar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Your appointments
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      All your scheduled time slots
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={refreshSlots}
                    disabled={loading}
                    aria-label="Refresh appointments"
                    className="rounded-xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={18}
                      className={
                        loading ? 'animate-spin' : ''
                      }
                    />
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={
                        filter === option.value
                      }
                      onClick={() =>
                        setFilter(option.value)
                      }
                      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        filter === option.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading && (
                <div
                  role="status"
                  className="flex items-center gap-2 p-6 text-sm text-indigo-600"
                >
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Loading appointments...
                </div>
              )}

              {loadError && (
                <div
                  role="alert"
                  className="m-6 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertCircle
                    size={18}
                    className="shrink-0"
                  />
                  {loadError}
                </div>
              )}

              {!loading &&
                !loadError &&
                filteredSlots.length === 0 && (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <CalendarDays size={30} />
                    </div>

                    <p className="text-lg font-bold">
                      No appointments found
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {filter === 'all'
                        ? 'Create your first appointment to get started.'
                        : 'No appointments match this filter.'}
                    </p>
                  </div>
                )}

              {!loading &&
                !loadError &&
                filteredSlots.length > 0 && (
                  <div className="divide-y divide-slate-100">
                    {filteredSlots.map((slot) => {
                      const status = getStatus(
                        slot,
                        now,
                      )

                      return (
                        <div
                          key={slot.id}
                          className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50 sm:px-8"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <CalendarDays size={20} />
                            </div>

                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {formatDate(
                                  slot.startsAt,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {formatTime(
                                  slot.startsAt,
                                )}
                                {' – '}
                                {getSlotEndTime(
                                  slot.startsAt,
                                  slot.durationMinutes,
                                )}
                                {' · '}
                                {slot.durationMinutes} min
                              </p>
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusStyles[status]}`}
                          >
                            {status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default DashboardPage