export interface Slot {
  id: string
  startsAt: string
  durationMinutes: number
  isBooked: boolean
  createdAt: string
}

export interface CreateSlotPayload {
  startsAt: string
  durationMinutes: number
}

export interface BookSlotPayload {
  name: string
  email: string
}

export interface Booking {
  id: string
  slotId: string
  name: string
  email: string
  createdAt: string
}

export interface BookingResponse {
  message: string
  booking: Booking
  slot: Slot
}