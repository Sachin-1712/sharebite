// Sharebite Type Definitions

export type UserRole = 'donor' | 'ngo' | 'delivery';

export type DonorType = 'restaurant_business' | 'individual' | 'event_organizer';

export type DonationStatus =
  | 'open'
  | 'matched'
  | 'accepted'
  | 'pickup_assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type DeliveryStatus =
  | 'assigned'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type Urgency = 'low' | 'medium' | 'high';

export type FoodCategory =
  | 'cooked_meals'
  | 'bakery'
  | 'fresh_produce'
  | 'packaged'
  | 'dairy'
  | 'beverages'
  | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // demo only, plain text
  role: UserRole;
  organizationName: string;
  phone: string;
  area: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface NGOProfile {
  id: string;
  userId: string;
  name: string;
  supportedFoodTypes: FoodCategory[];
  maxDailyCapacity: number;
  area: string;
  latitude: number;
  longitude: number;
  acceptanceRate: number;
  activeStatus: boolean;
}

export interface Donation {
  id: string;
  donorId: string;
  title: string;
  category: FoodCategory;
  foodType: string;
  donorType?: DonorType;
  foodSourceName?: string;
  quantity: number;
  unit: string;
  urgency: Urgency;
  preparedAt: string;
  expiresAt: string;
  pickupStart: string;
  pickupEnd: string;
  locationName: string;
  latitude: number;
  longitude: number;
  notes: string;
  isVegetarian: boolean;
  photoUrl?: string;
  status: DonationStatus;
  acceptedByNgoId?: string;
  createdAt: string;
}

export interface MatchSuggestion {
  id: string;
  donationId: string;
  ngoId: string;
  score: number;
  reason: string;
  rank: number;
}

export interface DonorReview {
  id: string;
  donationId: string;
  donorId: string;
  ngoId: string;
  rating: number;
  comment?: string;
  tags: string[];
  createdAt: string;
  ngoName?: string;
  donationTitle?: string;
}

export interface DonorRatingSummary {
  donorId: string;
  averageRating: number;
  reviewCount: number;
  recentReviews: DonorReview[];
}

export interface DeliveryJob {
  id: string;
  donationId: string;
  donorId: string;
  ngoId: string;
  deliveryPartnerId: string;
  pickupAddress: string;
  dropAddress: string;
  etaMinutes: number;
  distanceKm: number;
  status: DeliveryStatus;
  donationTitle: string;
  donationPhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
  priorityScore?: number;
  aiReasoning?: string;
}

export interface AnalyticsSnapshot {
  id: string;
  ngoId: string;
  date: string;
  donationsReceived: number;
  mealsRescued: number;
  avgAcceptanceTime: number;
  topCategory: FoodCategory;
  summaryText: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
