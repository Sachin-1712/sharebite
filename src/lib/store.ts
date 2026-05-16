// Sharebite Data Store - Supabase Implementation
import {
  User,
  NGOProfile,
  Donation,
  MatchSuggestion,
  DeliveryJob,
  AnalyticsSnapshot,
  FoodCategory,
} from '@/types';
import { supabase } from './supabase';

// Helper to map DB snake_case to TS camelCase
const parseFoodTypes = (value: unknown): FoodCategory[] => {
  if (Array.isArray(value)) {
    return value as FoodCategory[];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed as FoodCategory[] : [];
    } catch {
      return [];
    }
  }

  return [];
};

const mapUser = (row: any): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  password: row.password,
  role: row.role as any,
  organizationName: row.organization_name,
  phone: row.phone,
  area: row.area,
  avatarUrl: row.avatar_url,
  createdAt: row.created_at,
});

const mapDonation = (row: any): Donation => ({
  id: row.id,
  donorId: row.donor_id,
  title: row.title,
  category: row.category as any,
  foodType: row.food_type,
  quantity: row.quantity,
  unit: row.unit,
  urgency: row.urgency as any,
  preparedAt: row.prepared_at,
  expiresAt: row.expires_at,
  pickupStart: row.pickup_start,
  pickupEnd: row.pickup_end,
  locationName: row.location_name,
  latitude: row.latitude,
  longitude: row.longitude,
  notes: row.notes,
  isVegetarian: row.is_vegetarian,
  photoUrl: row.photo_url || undefined,
  status: row.status as any,
  acceptedByNgoId: row.accepted_by_ngo_id,
  createdAt: row.created_at,
});

const mapJob = (row: any): DeliveryJob => ({
  id: row.id,
  donationId: row.donation_id,
  donorId: row.donor_id,
  ngoId: row.ngo_id,
  deliveryPartnerId: row.delivery_partner_id,
  pickupAddress: row.pickup_address,
  dropAddress: row.drop_address,
  etaMinutes: row.eta_minutes,
  distanceKm: row.distance_km,
  status: row.status as any,
  donationTitle: row.donation_title,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapMatch = (row: any): MatchSuggestion => ({
  id: row.id,
  donationId: row.donation_id,
  ngoId: row.ngo_id,
  score: row.score,
  reason: row.reason,
  rank: row.rank,
});

const mapNGO = (row: any): NGOProfile => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  supportedFoodTypes: parseFoodTypes(row.supported_food_types),
  maxDailyCapacity: row.max_daily_capacity,
  area: row.area,
  latitude: row.latitude,
  longitude: row.longitude,
  acceptanceRate: row.acceptance_rate,
  activeStatus: row.active_status,
});

// ─── Users ─────────────────────────────────────────────────
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const { data } = await supabase.from('profiles').select('*').eq('email', email).single();
  return data ? mapUser(data) : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
  return data ? mapUser(data) : undefined;
}

export async function getAllUsers(): Promise<User[]> {
  const { data } = await supabase.from('profiles').select('*');
  return (data || []).map(mapUser);
}

export async function getFirstDeliveryPartner(): Promise<User | undefined> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'delivery')
    .order('created_at', { ascending: true });

  if (!data || data.length === 0) return undefined;

  const seededDeliveryUser = data.find((row: any) => row.email === 'delivery@sharebite.demo');
  return mapUser(seededDeliveryUser || data[0]);
}

// ─── NGO Profiles ──────────────────────────────────────────
export async function getNGOProfileByUserId(userId: string): Promise<NGOProfile | undefined> {
  const { data } = await supabase.from('ngo_profiles').select('*').eq('user_id', userId).single();
  return data ? mapNGO(data) : undefined;
}

export async function getAllNGOProfiles(): Promise<NGOProfile[]> {
  const { data } = await supabase.from('ngo_profiles').select('*');
  return (data || []).map(mapNGO);
}

// ─── Donations ─────────────────────────────────────────────
export async function getDonationsByDonor(donorId: string): Promise<Donation[]> {
  const { data } = await supabase.from('donations').select('*').eq('donor_id', donorId).order('created_at', { ascending: false });
  return (data || []).map(mapDonation);
}

export async function getOpenDonations(): Promise<Donation[]> {
  const { data } = await supabase.from('donations').select('*').in('status', ['open', 'matched']).order('created_at', { ascending: false });
  return (data || []).map(mapDonation);
}

export async function getDonationById(id: string): Promise<Donation | undefined> {
  const { data } = await supabase.from('donations').select('*').eq('id', id).single();
  return data ? mapDonation(data) : undefined;
}

export async function createDonation(donation: Donation): Promise<Donation> {
  const dbDonation = {
    // don't send id if we want db to generate, but if it has one we can
    ...(donation.id ? { id: donation.id } : {}),
    donor_id: donation.donorId,
    title: donation.title,
    category: donation.category,
    food_type: donation.foodType,
    quantity: donation.quantity,
    unit: donation.unit,
    urgency: donation.urgency,
    prepared_at: donation.preparedAt,
    expires_at: donation.expiresAt,
    pickup_start: donation.pickupStart,
    pickup_end: donation.pickupEnd,
    location_name: donation.locationName,
    latitude: donation.latitude,
    longitude: donation.longitude,
    notes: donation.notes,
    is_vegetarian: donation.isVegetarian,
    photo_url: donation.photoUrl || null,
    status: donation.status,
    accepted_by_ngo_id: donation.acceptedByNgoId || null,
  };
  const { data, error } = await supabase.from('donations').insert([dbDonation]).select().single();
  if (error) throw error;
  return mapDonation(data);
}

export async function updateDonationStatus(
  id: string,
  status: Donation['status'],
  acceptedByNgoId?: string
): Promise<Donation | undefined> {
  const updatePayload: any = { status };
  if (acceptedByNgoId) {
    updatePayload.accepted_by_ngo_id = acceptedByNgoId;
  }
  const { data, error } = await supabase.from('donations').update(updatePayload).eq('id', id).select().single();
  if (error) return undefined;
  return mapDonation(data);
}

export async function updateDonationDetails(
  id: string,
  updates: Pick<Donation, 'title' | 'category' | 'foodType' | 'preparedAt' | 'quantity' | 'unit' | 'urgency' | 'pickupStart' | 'pickupEnd' | 'locationName' | 'notes' | 'isVegetarian' | 'photoUrl'>
): Promise<Donation | undefined> {
  const { data, error } = await supabase.from('donations').update({
    title: updates.title,
    category: updates.category,
    food_type: updates.foodType,
    prepared_at: updates.preparedAt,
    quantity: updates.quantity,
    unit: updates.unit,
    urgency: updates.urgency,
    pickup_start: updates.pickupStart,
    pickup_end: updates.pickupEnd,
    location_name: updates.locationName,
    notes: updates.notes,
    is_vegetarian: updates.isVegetarian,
    photo_url: updates.photoUrl || null,
  }).eq('id', id).select().single();

  if (error) return undefined;
  return mapDonation(data);
}

export async function getDonationsByNGO(ngoId: string): Promise<Donation[]> {
  const { data } = await supabase.from('donations').select('*').eq('accepted_by_ngo_id', ngoId).order('created_at', { ascending: false });
  return (data || []).map(mapDonation);
}

export async function getAllDonations(): Promise<Donation[]> {
  const { data } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapDonation);
}

// ─── Match Suggestions ────────────────────────────────────
export async function getMatchesForDonation(donationId: string): Promise<MatchSuggestion[]> {
  const { data } = await supabase.from('match_suggestions').select('*').eq('donation_id', donationId).order('rank', { ascending: true });
  return (data || []).map(mapMatch);
}

export async function getMatchesForNGO(ngoId: string): Promise<MatchSuggestion[]> {
  const { data } = await supabase.from('match_suggestions').select('*').eq('ngo_id', ngoId).order('score', { ascending: false });
  return (data || []).map(mapMatch);
}

export async function createMatchSuggestion(match: MatchSuggestion): Promise<void> {
  await supabase.from('match_suggestions').insert([{
    donation_id: match.donationId,
    ngo_id: match.ngoId,
    score: match.score,
    reason: match.reason,
    rank: match.rank,
  }]);
}

// ─── Delivery Jobs ─────────────────────────────────────────
export async function getJobsByDeliveryPartner(partnerId: string): Promise<DeliveryJob[]> {
  const { data } = await supabase.from('delivery_jobs').select('*').eq('delivery_partner_id', partnerId).order('created_at', { ascending: false });
  return (data || []).map(mapJob);
}

export async function getJobByDonationId(donationId: string): Promise<DeliveryJob | undefined> {
  const { data } = await supabase.from('delivery_jobs').select('*').eq('donation_id', donationId).single();
  return data ? mapJob(data) : undefined;
}

export async function getJobById(jobId: string): Promise<DeliveryJob | undefined> {
  const { data } = await supabase.from('delivery_jobs').select('*').eq('id', jobId).single();
  return data ? mapJob(data) : undefined;
}

export async function createDeliveryJob(job: DeliveryJob): Promise<DeliveryJob> {
  const { data, error } = await supabase.from('delivery_jobs').insert([{
    donation_id: job.donationId,
    donor_id: job.donorId,
    ngo_id: job.ngoId,
    delivery_partner_id: job.deliveryPartnerId,
    pickup_address: job.pickupAddress,
    drop_address: job.dropAddress,
    eta_minutes: job.etaMinutes,
    distance_km: job.distanceKm,
    status: job.status,
    donation_title: job.donationTitle,
  }]).select().single();
  if (error) throw error;
  return mapJob(data);
}

export async function updateDeliveryJobForDonation(
  donationId: string,
  updates: Pick<DeliveryJob, 'ngoId' | 'deliveryPartnerId' | 'pickupAddress' | 'dropAddress' | 'etaMinutes' | 'distanceKm' | 'status' | 'donationTitle'>
): Promise<DeliveryJob | undefined> {
  const { data, error } = await supabase
    .from('delivery_jobs')
    .update({
      ngo_id: updates.ngoId,
      delivery_partner_id: updates.deliveryPartnerId,
      pickup_address: updates.pickupAddress,
      drop_address: updates.dropAddress,
      eta_minutes: updates.etaMinutes,
      distance_km: updates.distanceKm,
      status: updates.status,
      donation_title: updates.donationTitle,
      updated_at: new Date().toISOString(),
    })
    .eq('donation_id', donationId)
    .select()
    .single();

  if (error) return undefined;
  return mapJob(data);
}

export async function updateDeliveryJobStatus(
  id: string,
  status: DeliveryJob['status']
): Promise<DeliveryJob | undefined> {
  const { data, error } = await supabase.from('delivery_jobs').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) return undefined;
  return mapJob(data);
}

export async function updateDeliveryJobDonationDetails(
  donationId: string,
  updates: Pick<DeliveryJob, 'pickupAddress' | 'donationTitle'>
): Promise<void> {
  await supabase
    .from('delivery_jobs')
    .update({
      pickup_address: updates.pickupAddress,
      donation_title: updates.donationTitle,
      updated_at: new Date().toISOString(),
    })
    .eq('donation_id', donationId);
}

export async function deleteDonationCascade(donationId: string): Promise<boolean> {
  await supabase.from('match_suggestions').delete().eq('donation_id', donationId);
  await supabase.from('delivery_jobs').delete().eq('donation_id', donationId);
  const { error } = await supabase.from('donations').delete().eq('id', donationId);
  return !error;
}

// ─── Analytics ─────────────────────────────────────────────
export async function getAnalyticsForNGO(ngoId: string): Promise<AnalyticsSnapshot[]> {
  const { data: dbData } = await supabase.from('analytics_snapshots').select('*').eq('ngo_id', ngoId).order('date', { ascending: true });
  
  if (dbData && dbData.length > 0) {
    return dbData.map((row: any) => ({
      id: row.id,
      ngoId: row.ngo_id,
      date: row.date,
      donationsReceived: row.donations_received,
      mealsRescued: row.meals_rescued,
      avgAcceptanceTime: row.avg_acceptance_time,
      topCategory: row.top_category,
      summaryText: row.summary_text,
    }));
  }

  // Fallback: Generate dynamically from actual donations
  const ngoDonations = await getDonationsByNGO(ngoId);
  const snapshots: AnalyticsSnapshot[] = [];
  
  // Create last 7 days of data
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString();
    
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayDonations = ngoDonations.filter(don => {
      const created = new Date(don.createdAt);
      return created >= d && created < nextDay;
    });

    const meals = dayDonations.reduce((acc, curr) => acc + curr.quantity, 0);

    snapshots.push({
      id: `dynamic-${dateStr}`,
      ngoId,
      date: dateStr,
      donationsReceived: dayDonations.length,
      mealsRescued: meals,
      avgAcceptanceTime: Math.floor(Math.random() * 10) + 5, // mock response time for now
      topCategory: 'cooked_meals',
      summaryText: '',
    });
  }

  return snapshots;
}

// ─── Smart Matching Algorithm ──────────────────────────────
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function generateMatchSuggestions(donation: Donation): Promise<MatchSuggestion[]> {
  const allProfiles = await getAllNGOProfiles();
  const profiles = allProfiles.filter((p) => p.activeStatus);
  const suggestions: MatchSuggestion[] = [];

  for (const ngo of profiles) {
    const dist = haversineDistance(
      donation.latitude, donation.longitude,
      ngo.latitude, ngo.longitude
    );
    const distScore = Math.max(0, 100 - dist * 10) * 0.35;

    const categoryFit = ngo.supportedFoodTypes.includes(donation.category as FoodCategory)
      ? 100 : 30;
    const catScore = categoryFit * 0.20;

    const urgencyMultiplier = donation.urgency === 'high' ? 1.2 : donation.urgency === 'medium' ? 1.0 : 0.8;
    const urgScore = (ngo.acceptanceRate * 100 * urgencyMultiplier) * 0.20;

    const capScore = Math.min(100, (ngo.maxDailyCapacity / donation.quantity) * 50) * 0.15;
    const relScore = (ngo.acceptanceRate * 100) * 0.10;

    const totalScore = Math.round(Math.min(100, distScore + catScore + urgScore + capScore + relScore));

    const reasons: string[] = [];
    if (dist < 5) reasons.push(`Close proximity (${dist.toFixed(1)} km)`);
    else reasons.push(`${dist.toFixed(1)} km away`);
    if (categoryFit === 100) reasons.push(`accepts ${donation.category.replace('_', ' ')}`);
    else reasons.push(`${donation.category.replace('_', ' ')} not in primary categories`);
    if (ngo.maxDailyCapacity > donation.quantity * 2) reasons.push('high capacity available');
    reasons.push(`${Math.round(ngo.acceptanceRate * 100)}% acceptance rate`);

    suggestions.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `match-${Date.now()}-${ngo.id}`,
      donationId: donation.id,
      ngoId: ngo.userId,
      score: totalScore,
      reason: reasons.join(', ') + '.',
      rank: 0,
    });
  }

  suggestions.sort((a, b) => b.score - a.score);
  suggestions.forEach((s, i) => { s.rank = i + 1; });

  for (const s of suggestions) {
    await createMatchSuggestion(s);
  }

  return suggestions;
}

// ─── Donor Stats ───────────────────────────────────────────
export async function getDonorStats(donorId: string) {
  const donorDonations = await getDonationsByDonor(donorId);
  const delivered = donorDonations.filter((d) => d.status === 'delivered');
  const totalMeals = delivered.reduce((sum, d) => sum + d.quantity, 0);
  const uniqueNGOs = new Set(delivered.map((d) => d.acceptedByNgoId).filter(Boolean)).size;
  const impactScore = Math.min(100, Math.round(totalMeals * 0.8 + uniqueNGOs * 10 + delivered.length * 5));

  return {
    totalDonations: donorDonations.length,
    mealsDoated: totalMeals, // kept typo to match previous
    ngosHelped: uniqueNGOs,
    impactScore,
    activeDonations: donorDonations.filter((d) => !['delivered', 'cancelled'].includes(d.status)).length,
  };
}

// ─── NGO Stats ─────────────────────────────────────────────
export async function getNGOStats(ngoId: string) {
  const ngoDonations = await getDonationsByNGO(ngoId);
  const delivered = ngoDonations.filter((d) => d.status === 'delivered');
  const totalMeals = delivered.reduce((sum, d) => sum + d.quantity, 0);
  const thisWeek = ngoDonations.filter((d) => {
    const created = new Date(d.createdAt);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return created >= weekAgo;
  });

  return {
    totalReceived: ngoDonations.length,
    mealsRescued: totalMeals,
    thisWeek: thisWeek.length,
    avgAcceptanceMinutes: 12,
    topDonorType: 'Restaurant',
  };
}
