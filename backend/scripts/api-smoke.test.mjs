import assert from 'node:assert/strict'
import { test } from 'node:test'

const API_URL =
  process.env.TEST_API_URL ??
  'http://localhost:3100/api'

const HOST_ACCESS_KEY = process.env.HOST_ACCESS_KEY

if (!HOST_ACCESS_KEY) {
  throw new Error(
    'HOST_ACCESS_KEY must be provided for API tests.',
  )
}

async function apiRequest(
  path,
  {
    method = 'GET',
    body,
    hostKey,
  } = {},
) {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (hostKey) {
    headers['X-Host-Key'] = hostKey
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    },
  )

  const data = await response.json()

  return {
    status: response.status,
    data,
  }
}

test('Slotly API integration tests', async (t) => {
  let slotId = ''

  const startsAt = new Date(
    Date.now() + 20 * 24 * 60 * 60 * 1000,
  ).toISOString()

  await t.test(
    'Reject creating a slot without host key',
    async () => {
      const result = await apiRequest('/slots', {
        method: 'POST',
        body: {
          startsAt,
          durationMinutes: 30,
        },
      })

      assert.equal(result.status, 401)
    },
  )

  await t.test(
    'Create a valid future slot',
    async () => {
      const result = await apiRequest('/slots', {
        method: 'POST',
        hostKey: HOST_ACCESS_KEY,
        body: {
          startsAt,
          durationMinutes: 30,
        },
      })

      assert.equal(result.status, 201)
      assert.equal(result.data.isBooked, false)
      assert.equal(result.data.durationMinutes, 30)
      assert.ok(result.data.id)

      slotId = result.data.id
    },
  )

  await t.test(
    'Reject overlapping time slots',
    async () => {
      const overlappingStart = new Date(
        new Date(startsAt).getTime() +
          5 * 60 * 1000,
      ).toISOString()

      const result = await apiRequest('/slots', {
        method: 'POST',
        hostKey: HOST_ACCESS_KEY,
        body: {
          startsAt: overlappingStart,
          durationMinutes: 30,
        },
      })

      assert.equal(result.status, 409)
    },
  )

  await t.test(
    'Show created slot as available',
    async () => {
      const result = await apiRequest('/slots')

      assert.equal(result.status, 200)
      assert.ok(Array.isArray(result.data))

      const slot = result.data.find(
        (item) => item.id === slotId,
      )

      assert.ok(slot)
      assert.equal(slot.isBooked, false)
    },
  )

  await t.test(
    'Allow only one concurrent booking',
    async () => {
      const bookingRequests = [
        {
          name: 'Integration User A',
          email: 'usera@example.com',
        },
        {
          name: 'Integration User B',
          email: 'userb@example.com',
        },
      ]

      const results = await Promise.all(
        bookingRequests.map((body) =>
          apiRequest(`/slots/${slotId}/book`, {
            method: 'POST',
            body,
          }),
        ),
      )

      const statuses = results
        .map((result) => result.status)
        .sort((a, b) => a - b)

      assert.deepEqual(statuses, [201, 409])

      const successful = results.find(
        (result) => result.status === 201,
      )

      assert.ok(successful)
      assert.ok(successful.data.booking.id)
      assert.equal(
        successful.data.slot.isBooked,
        true,
      )
    },
  )

  await t.test(
    'Hide booked slot from available slots',
    async () => {
      const result = await apiRequest('/slots')

      assert.equal(result.status, 200)

      const bookedSlot = result.data.find(
        (item) => item.id === slotId,
      )

      assert.equal(bookedSlot, undefined)
    },
  )

  await t.test(
    'Keep booked slot in dashboard history',
    async () => {
      const result = await apiRequest('/slots/all')

      assert.equal(result.status, 200)

      const bookedSlot = result.data.find(
        (item) => item.id === slotId,
      )

      assert.ok(bookedSlot)
      assert.equal(bookedSlot.isBooked, true)
    },
  )
})