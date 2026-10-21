import assert from 'node:assert/strict'
import { test } from 'node:test'

const API_URL =
  process.env.TEST_API_URL ??
  'http://localhost:3100/api'

async function apiRequest(
  path,
  {
    method = 'GET',
    body,
  } = {},
) {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
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
    'Reject invalid slot duration',
    async () => {
      const result = await apiRequest('/slots', {
        method: 'POST',
        body: {
          startsAt,
          durationMinutes: 5,
        },
      })

      assert.equal(result.status, 400)
    },
  )

  await t.test(
    'Create a valid future slot without login',
    async () => {
      const result = await apiRequest('/slots', {
        method: 'POST',
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
    'Reject overlapping slots',
    async () => {
      const overlappingStart = new Date(
        new Date(startsAt).getTime() +
          5 * 60 * 1000,
      ).toISOString()

      const result = await apiRequest('/slots', {
        method: 'POST',
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
      const requests = [
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
        requests.map((body) =>
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
    },
  )

  await t.test(
    'Hide booked slot from availability',
    async () => {
      const result = await apiRequest('/slots')

      assert.equal(result.status, 200)

      const slot = result.data.find(
        (item) => item.id === slotId,
      )

      assert.equal(slot, undefined)
    },
  )

  await t.test(
    'Keep booked slot in dashboard history',
    async () => {
      const result = await apiRequest('/slots/all')

      assert.equal(result.status, 200)

      const slot = result.data.find(
        (item) => item.id === slotId,
      )

      assert.ok(slot)
      assert.equal(slot.isBooked, true)
    },
  )
})