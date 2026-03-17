export interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: string
}

export interface TimeSlot {
  id: string
  time: string
  available: boolean
}

export interface Review {
  id: string
  clientName: string
  rating: number
  comment: string
  date: string
  avatar: string
}

export interface Professional {
  id: string
  name: string
  category: string
  specialty: string
  description: string
  location: string
  city: string
  state: string
  rating: number
  reviewCount: number
  completedServices: number
  phone: string
  whatsapp: string
  avatar: string
  coverImage: string
  photos: string[]
  services: Service[]
  reviews: Review[]
  featured: boolean
  plan: 'free' | 'pro'
  monthlyRevenue: number
  clients: Client[]
}

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  lastVisit: string
  totalVisits: number
  totalSpent: number
}

export interface Appointment {
  id: string
  clientName: string
  clientPhone: string
  service: string
  date: string
  time: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  price: number
  professionalId: string
}

export interface Category {
  id: string
  name: string
  icon: string
  count: number
}
