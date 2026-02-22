// Types
export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance"
export type ReservationType = "room" | "table"
export type ReservationStatus = "confirmed" | "checked-in" | "checked-out" | "cancelled"
export type PaymentStatus = "pending" | "paid" | "partial"
export type UserRole = "receptionist" | "operational" | "administrator"

export interface Room {
  id: string
  number: string
  type: "single" | "double" | "suite" | "deluxe"
  floor: number
  pricePerNight: number
  status: RoomStatus
  capacity: number
}

export interface RestaurantTable {
  id: string
  number: string
  seats: number
  location: "indoor" | "terrace" | "private"
  status: "available" | "reserved" | "occupied"
}

export interface Guest {
  id: string
  name: string
  email: string
  phone: string
  idDocument: string
}

export interface Reservation {
  id: string
  type: ReservationType
  guest: Guest
  roomId?: string
  tableId?: string
  checkIn: string
  checkOut: string
  status: ReservationStatus
  services: Service[]
  totalAmount: number
  paymentStatus: PaymentStatus
  createdAt: string
}

export interface Service {
  id: string
  name: string
  price: number
  quantity: number
}

export interface InventoryItem {
  id: string
  name: string
  category: "linens" | "toiletries" | "food" | "beverages" | "cleaning"
  currentStock: number
  minStock: number
  unit: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  lastLogin: string
}

// Mock Data
export const rooms: Room[] = [
  { id: "r1", number: "101", type: "single", floor: 1, pricePerNight: 85, status: "available", capacity: 1 },
  { id: "r2", number: "102", type: "single", floor: 1, pricePerNight: 85, status: "occupied", capacity: 1 },
  { id: "r3", number: "103", type: "double", floor: 1, pricePerNight: 130, status: "cleaning", capacity: 2 },
  { id: "r4", number: "201", type: "double", floor: 2, pricePerNight: 130, status: "available", capacity: 2 },
  { id: "r5", number: "202", type: "suite", floor: 2, pricePerNight: 250, status: "occupied", capacity: 3 },
  { id: "r6", number: "203", type: "deluxe", floor: 2, pricePerNight: 350, status: "available", capacity: 2 },
  { id: "r7", number: "301", type: "suite", floor: 3, pricePerNight: 250, status: "maintenance", capacity: 3 },
  { id: "r8", number: "302", type: "deluxe", floor: 3, pricePerNight: 350, status: "available", capacity: 2 },
  { id: "r9", number: "303", type: "single", floor: 3, pricePerNight: 95, status: "occupied", capacity: 1 },
  { id: "r10", number: "304", type: "double", floor: 3, pricePerNight: 140, status: "available", capacity: 2 },
]

export const tables: RestaurantTable[] = [
  { id: "t1", number: "T1", seats: 2, location: "indoor", status: "available" },
  { id: "t2", number: "T2", seats: 4, location: "indoor", status: "reserved" },
  { id: "t3", number: "T3", seats: 6, location: "indoor", status: "occupied" },
  { id: "t4", number: "T4", seats: 2, location: "terrace", status: "available" },
  { id: "t5", number: "T5", seats: 4, location: "terrace", status: "reserved" },
  { id: "t6", number: "T6", seats: 8, location: "private", status: "available" },
  { id: "t7", number: "T7", seats: 4, location: "indoor", status: "available" },
  { id: "t8", number: "T8", seats: 6, location: "terrace", status: "occupied" },
]

export const guests: Guest[] = [
  { id: "g1", name: "Maria Garcia", email: "maria@email.com", phone: "+34 612 345 678", idDocument: "12345678A" },
  { id: "g2", name: "James Wilson", email: "james.w@email.com", phone: "+44 7700 900000", idDocument: "AB123456" },
  { id: "g3", name: "Sophie Laurent", email: "sophie.l@email.com", phone: "+33 6 12 34 56 78", idDocument: "FR9876543" },
  { id: "g4", name: "Marco Rossi", email: "marco.r@email.com", phone: "+39 333 1234567", idDocument: "IT4567890" },
  { id: "g5", name: "Yuki Tanaka", email: "yuki.t@email.com", phone: "+81 90 1234 5678", idDocument: "JP2345678" },
]

export const reservations: Reservation[] = [
  {
    id: "res-001", type: "room", guest: guests[0], roomId: "r2",
    checkIn: "2026-02-20", checkOut: "2026-02-24", status: "checked-in",
    services: [
      { id: "s1", name: "Room Service Breakfast", price: 25, quantity: 2 },
      { id: "s2", name: "Spa Treatment", price: 80, quantity: 1 },
    ],
    totalAmount: 650, paymentStatus: "partial", createdAt: "2026-02-15",
  },
  {
    id: "res-002", type: "room", guest: guests[1], roomId: "r5",
    checkIn: "2026-02-21", checkOut: "2026-02-25", status: "checked-in",
    services: [{ id: "s3", name: "Mini Bar", price: 45, quantity: 1 }],
    totalAmount: 1045, paymentStatus: "pending", createdAt: "2026-02-18",
  },
  {
    id: "res-003", type: "table", guest: guests[2], tableId: "t2",
    checkIn: "2026-02-22", checkOut: "2026-02-22", status: "confirmed",
    services: [], totalAmount: 0, paymentStatus: "pending", createdAt: "2026-02-20",
  },
  {
    id: "res-004", type: "room", guest: guests[3], roomId: "r9",
    checkIn: "2026-02-19", checkOut: "2026-02-22", status: "checked-in",
    services: [
      { id: "s4", name: "Laundry Service", price: 30, quantity: 1 },
      { id: "s5", name: "Airport Transfer", price: 60, quantity: 1 },
    ],
    totalAmount: 375, paymentStatus: "paid", createdAt: "2026-02-14",
  },
  {
    id: "res-005", type: "table", guest: guests[4], tableId: "t5",
    checkIn: "2026-02-22", checkOut: "2026-02-22", status: "confirmed",
    services: [], totalAmount: 0, paymentStatus: "pending", createdAt: "2026-02-21",
  },
  {
    id: "res-006", type: "room", guest: guests[0], roomId: "r4",
    checkIn: "2026-02-26", checkOut: "2026-02-28", status: "confirmed",
    services: [], totalAmount: 260, paymentStatus: "pending", createdAt: "2026-02-22",
  },
  {
    id: "res-007", type: "room", guest: guests[1], roomId: "r6",
    checkIn: "2026-02-10", checkOut: "2026-02-14", status: "checked-out",
    services: [
      { id: "s6", name: "Room Service Dinner", price: 55, quantity: 2 },
      { id: "s7", name: "Spa Treatment", price: 80, quantity: 1 },
    ],
    totalAmount: 1590, paymentStatus: "paid", createdAt: "2026-02-05",
  },
]

export const inventoryItems: InventoryItem[] = [
  { id: "inv1", name: "Bath Towels", category: "linens", currentStock: 120, minStock: 50, unit: "pieces" },
  { id: "inv2", name: "Bed Sheets (King)", category: "linens", currentStock: 35, minStock: 30, unit: "sets" },
  { id: "inv3", name: "Shampoo Bottles", category: "toiletries", currentStock: 200, minStock: 100, unit: "bottles" },
  { id: "inv4", name: "Soap Bars", category: "toiletries", currentStock: 80, minStock: 100, unit: "pieces" },
  { id: "inv5", name: "Coffee Packets", category: "food", currentStock: 300, minStock: 150, unit: "packets" },
  { id: "inv6", name: "Bottled Water", category: "beverages", currentStock: 45, minStock: 200, unit: "bottles" },
  { id: "inv7", name: "Floor Cleaner", category: "cleaning", currentStock: 25, minStock: 10, unit: "liters" },
  { id: "inv8", name: "Pillow Cases", category: "linens", currentStock: 60, minStock: 40, unit: "pieces" },
  { id: "inv9", name: "Tea Bags", category: "food", currentStock: 500, minStock: 200, unit: "bags" },
  { id: "inv10", name: "Hand Sanitizer", category: "toiletries", currentStock: 15, minStock: 30, unit: "bottles" },
]

export const users: User[] = [
  { id: "u1", name: "Ana Martinez", email: "ana.m@hoteldesk.com", role: "administrator", active: true, lastLogin: "2026-02-22" },
  { id: "u2", name: "Carlos Ruiz", email: "carlos.r@hoteldesk.com", role: "receptionist", active: true, lastLogin: "2026-02-22" },
  { id: "u3", name: "Laura Gomez", email: "laura.g@hoteldesk.com", role: "receptionist", active: true, lastLogin: "2026-02-21" },
  { id: "u4", name: "Pedro Sanchez", email: "pedro.s@hoteldesk.com", role: "operational", active: true, lastLogin: "2026-02-22" },
  { id: "u5", name: "Isabel Torres", email: "isabel.t@hoteldesk.com", role: "operational", active: false, lastLogin: "2026-02-10" },
]

export const availableServices: { name: string; price: number }[] = [
  { name: "Room Service Breakfast", price: 25 },
  { name: "Room Service Dinner", price: 55 },
  { name: "Mini Bar", price: 45 },
  { name: "Spa Treatment", price: 80 },
  { name: "Laundry Service", price: 30 },
  { name: "Airport Transfer", price: 60 },
  { name: "Late Check-out", price: 40 },
  { name: "Extra Bed", price: 35 },
]
