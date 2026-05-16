import { DonorType } from '@/types';

export const DONOR_TYPE_LABELS: Record<DonorType, string> = {
  restaurant_business: 'Restaurant / Business',
  individual: 'Individual',
  event_organizer: 'Event Organizer',
};

export const FOOD_SOURCE_OTHER = 'other';

export const bangaloreFoodSources = [
  'Meghana Foods, Koramangala',
  'Empire Restaurant, Indiranagar',
  'MTR, Lalbagh Road',
  'CTR, Malleshwaram',
  'Rameshwaram Cafe, Indiranagar',
  'Vidyarthi Bhavan, Basavanagudi',
  'Truffles, Koramangala',
  'Nagarjuna, Residency Road',
  'A2B, Jayanagar',
  'Udupi Grand, HSR Layout',
];

export function validateDonationSource(donorType?: DonorType, foodSourceName?: string) {
  if (donorType === 'individual' && !foodSourceName?.trim()) {
    return {
      ok: false,
      error: 'Please enter where the food was bought from.',
    };
  }

  return { ok: true, error: null };
}

export function normalizeDonorType(value?: string): DonorType {
  if (value === 'individual' || value === 'event_organizer' || value === 'restaurant_business') {
    return value;
  }

  return 'restaurant_business';
}
