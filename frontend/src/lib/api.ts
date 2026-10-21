import type {
  BookSlotPayload,
  BookingResponse,
  CreateSlotPayload,
  Slot,
} from '../types/scheduling'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/+$/, '')

export class ApiError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)

    this.name = 'ApiError'
    this.status = status
  }
}

function extractErrorMessage(
  data: unknown,
  fallback: string,
): string {
  if (typeof data !== 'object' || data === null) {
    return fallback
  }

  const message = (data as { message?: unknown }).message

  if (typeof message === 'string') {
    return message
  }

  if (Array.isArray(message)) {
    return message
      .filter((item): item is string =>
        typeof item === 'string',
      )
      .join(', ') || fallback
  }

  return fallback
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)

  headers.set('Content-Type', 'application/json')

  let response: Response

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers,
      },
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      throw error
    }

    throw new ApiError(
      'Unable to connect to the server. Please try again.',
      0,
    )
  }

  let data: unknown

  try {
    data = await response.json()
  } catch {
    throw new ApiError(
      'The server returned an invalid response.',
      response.status,
    )
  }

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(
        data,
        `Request failed (${response.status}).`,
      ),
      response.status,
    )
  }

  return data as T
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

export const slotsApi = {
  getAvailable(signal?: AbortSignal) {
    return request<Slot[]>('/slots', {
      signal,
    })
  },

  getAll(signal?: AbortSignal) {
    return request<Slot[]>('/slots/all', {
      signal,
    })
  },
  
  create(payload: CreateSlotPayload) {
    return request<Slot>('/slots', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  book(id: string, payload: BookSlotPayload) {
    return request<BookingResponse>(
      `/slots/${encodeURIComponent(id)}/book`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
  },
}