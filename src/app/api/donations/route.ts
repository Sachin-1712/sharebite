import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  createDonation,
  getAllDonations,
  getDonationsByDonor,
  getOpenDonations,
  updateDonationStatus,
  updateDonationDetails,
  getDonationById,
  generateMatchSuggestions,
  getMatchesForDonation,
  getDonationsByNGO,
  createDeliveryJob,
  getNGOProfileByUserId,
  getAllNGOProfiles,
  getFirstDeliveryPartner,
  getJobByDonationId,
  updateDeliveryJobForDonation,
  updateDeliveryJobDonationDetails,
  deleteDonationCascade,
} from '@/lib/store';
import { DeliveryJob, Donation } from '@/types';
import { validatePreparedAt } from '@/lib/food-safety';
import { normalizeDonorType, validateDonationSource } from '@/lib/donation-source';

const donorEditableStatuses: Donation['status'][] = ['open', 'accepted', 'pickup_assigned'];

const timeToISO = (timeStr: string | undefined, fallbackISO?: string, hoursOffset = 0) => {
  if (!timeStr) {
    return fallbackISO || new Date(Date.now() + hoursOffset * 3600000).toISOString();
  }

  if (timeStr.includes('T')) {
    return new Date(timeStr).toISOString();
  }

  if (!timeStr.includes(':')) {
    return fallbackISO || new Date(Date.now() + hoursOffset * 3600000).toISOString();
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  const base = fallbackISO ? new Date(fallbackISO) : new Date();
  base.setHours(hours, minutes, 0, 0);
  return base.toISOString();
};

const preparedToISO = (value: string | undefined, fallbackISO?: string) => {
  if (!value) return fallbackISO || '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
};

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');

  if (view === 'open') {
    const donations = await getOpenDonations();
    // Attach match info for NGO view
    const enriched = await Promise.all(donations.map(async (d) => {
      const matches = await getMatchesForDonation(d.id);
      const ngoMatch = matches.find((m) => m.ngoId === user.id);
      return { ...d, matchScore: ngoMatch?.score, matchReason: ngoMatch?.reason };
    }));
    return NextResponse.json({ donations: enriched });
  }

  if (view === 'donor') {
    const donations = await getDonationsByDonor(user.id);
    return NextResponse.json({ donations });
  }

  if (view === 'ngo') {
    const donations = await getDonationsByNGO(user.id);
    return NextResponse.json({ donations });
  }

  if (view === 'matches') {
    const donationId = searchParams.get('donationId');
    if (donationId) {
      const matches = await getMatchesForDonation(donationId);
      const profiles = await getAllNGOProfiles();
      // Enrich with NGO names
      const enriched = matches.map((m) => {
        const profile = profiles.find((p) => p.userId === m.ngoId);
        return { ...m, ngoName: profile?.name || 'Unknown NGO' };
      });
      return NextResponse.json({ matches: enriched });
    }
  }

  const donations = await getAllDonations();
  return NextResponse.json({ donations });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Create donation
  if (body.action === 'create') {
    if (user.role !== 'donor') {
      return NextResponse.json({ error: 'Only donors can create donations' }, { status: 403 });
    }

    const preparedAt = preparedToISO(body.donation.preparedAt);
    const preparedValidation = validatePreparedAt(preparedAt);
    if (!preparedValidation.ok) {
      return NextResponse.json({ error: preparedValidation.error }, { status: 400 });
    }
    const donorType = normalizeDonorType(body.donation.donorType);
    const foodSourceName = body.donation.foodSourceName?.trim() || undefined;
    const sourceValidation = validateDonationSource(donorType, foodSourceName);
    if (!sourceValidation.ok) {
      return NextResponse.json({ error: sourceValidation.error }, { status: 400 });
    }

    const donation: Donation = {
      id: body.donation.id || crypto.randomUUID(),
      donorId: user.id,
      title: body.donation.title,
      category: body.donation.category,
      foodType: body.donation.foodType,
      donorType,
      foodSourceName,
      quantity: Number(body.donation.quantity),
      unit: body.donation.unit,
      urgency: body.donation.urgency,
      preparedAt,
      expiresAt: timeToISO(body.donation.expiresAt, undefined, 6), // Default 6h if missing
      pickupStart: timeToISO(body.donation.pickupStart),
      pickupEnd: timeToISO(body.donation.pickupEnd, undefined, 3),   // Default 3h if missing
      locationName: body.donation.locationName || user.area,
      latitude: body.donation.latitude || 51.5117,
      longitude: body.donation.longitude || -0.124,
      notes: body.donation.notes || '',
      isVegetarian: body.donation.isVegetarian || false,
      photoUrl: body.donation.photoUrl || undefined,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    const created = await createDonation(donation);
    
    // Generate match suggestions
    const matches = await generateMatchSuggestions(created);

    return NextResponse.json({ donation: created, matches });
  }

  // Accept donation (NGO action)
  if (body.action === 'accept') {
    if (user.role !== 'ngo') {
      return NextResponse.json({ error: 'Only NGOs can accept donations' }, { status: 403 });
    }

    const donation = await getDonationById(body.donationId);
    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    if (!['open', 'matched'].includes(donation.status)) {
      return NextResponse.json(
        { error: 'Donation is no longer available for acceptance' },
        { status: 409 }
      );
    }

    const deliveryPartner = await getFirstDeliveryPartner();
    if (!deliveryPartner) {
      return NextResponse.json(
        { error: 'No delivery partner is available for assignment' },
        { status: 500 }
      );
    }

    const ngoProfile = await getNGOProfileByUserId(user.id);

    const jobPayload: DeliveryJob = {
      id: crypto.randomUUID(),
      donationId: donation.id,
      donorId: donation.donorId,
      ngoId: user.id,
      deliveryPartnerId: deliveryPartner.id,
      pickupAddress: donation.locationName,
      dropAddress: ngoProfile?.area || user.area,
      etaMinutes: Math.floor(Math.random() * 15) + 15,
      distanceKm: Math.round((Math.random() * 5 + 2) * 10) / 10,
      status: 'assigned' as const,
      donationTitle: donation.title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingJob = await getJobByDonationId(donation.id);
    const job = existingJob
      ? await updateDeliveryJobForDonation(donation.id, jobPayload)
      : await createDeliveryJob(jobPayload);

    await updateDonationStatus(body.donationId, 'pickup_assigned', user.id);

    return NextResponse.json({ donation: await getDonationById(body.donationId), job });
  }

  // Reject donation
  if (body.action === 'reject') {
    if (user.role !== 'ngo') {
      return NextResponse.json({ error: 'Only NGOs can reject donations' }, { status: 403 });
    }

    // Just acknowledge — in demo we don't track rejections
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Only donors can edit donations' }, { status: 403 });
  }

  const body = await request.json();
  const donation = await getDonationById(body.donationId);

  if (!donation) {
    return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
  }

  if (donation.donorId !== user.id) {
    return NextResponse.json({ error: 'You can only edit your own donations' }, { status: 403 });
  }

  if (!donorEditableStatuses.includes(donation.status)) {
    return NextResponse.json(
      { error: 'Donation can no longer be edited because pickup has started or it is closed' },
      { status: 409 }
    );
  }

  const preparedAt = preparedToISO(body.donation.preparedAt, donation.preparedAt);
  const preparedValidation = validatePreparedAt(preparedAt);
  if (!preparedValidation.ok) {
    return NextResponse.json({ error: preparedValidation.error }, { status: 400 });
  }
  const donorType = normalizeDonorType(body.donation.donorType);
  const foodSourceName = body.donation.foodSourceName?.trim() || undefined;
  const sourceValidation = validateDonationSource(donorType, foodSourceName);
  if (!sourceValidation.ok) {
    return NextResponse.json({ error: sourceValidation.error }, { status: 400 });
  }

  const edited = await updateDonationDetails(donation.id, {
    title: body.donation.title,
    category: body.donation.category,
    foodType: body.donation.foodType,
    donorType,
    foodSourceName,
    preparedAt,
    quantity: Number(body.donation.quantity),
    unit: body.donation.unit,
    urgency: body.donation.urgency,
    pickupStart: timeToISO(body.donation.pickupStart, donation.pickupStart),
    pickupEnd: timeToISO(body.donation.pickupEnd, donation.pickupEnd),
    locationName: body.donation.locationName || donation.locationName,
    notes: body.donation.notes || '',
    isVegetarian: Boolean(body.donation.isVegetarian),
    photoUrl: body.donation.photoUrl ?? donation.photoUrl,
  });

  if (!edited) {
    return NextResponse.json({ error: 'Unable to update donation' }, { status: 500 });
  }

  await updateDeliveryJobDonationDetails(edited.id, {
    pickupAddress: edited.locationName,
    donationTitle: edited.title,
  });

  return NextResponse.json({ donation: edited });
}

export async function DELETE(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Only donors can delete donations' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const donationId = searchParams.get('donationId');

  if (!donationId) {
    return NextResponse.json({ error: 'donationId is required' }, { status: 400 });
  }

  const donation = await getDonationById(donationId);
  if (!donation) {
    return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
  }

  if (donation.donorId !== user.id) {
    return NextResponse.json({ error: 'You can only delete your own donations' }, { status: 403 });
  }

  if (!donorEditableStatuses.includes(donation.status)) {
    return NextResponse.json(
      { error: 'Donation can no longer be deleted because pickup has started or it is closed' },
      { status: 409 }
    );
  }

  const deleted = await deleteDonationCascade(donation.id);
  if (!deleted) {
    return NextResponse.json({ error: 'Unable to delete donation' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
