import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createDonorReview, getDonationById, getReviewByDonationId } from '@/lib/store';

const allowedTags = new Set([
  'Fresh food',
  'Good packaging',
  'Easy pickup',
  'On-time',
  'Needs improvement',
]);

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'ngo') {
    return NextResponse.json({ error: 'Only NGO users can review donors' }, { status: 403 });
  }

  const body = await request.json();
  const donationId = String(body.donationId || '');
  const rating = Number(body.rating);
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((tag: unknown): tag is string => typeof tag === 'string' && allowedTags.has(tag))
    : [];

  if (!donationId) {
    return NextResponse.json({ error: 'Donation is required' }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  const donation = await getDonationById(donationId);
  if (!donation) {
    return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
  }

  if (donation.acceptedByNgoId !== user.id) {
    return NextResponse.json({ error: 'You can only review donations accepted by your NGO' }, { status: 403 });
  }

  if (donation.status !== 'delivered') {
    return NextResponse.json({ error: 'Donor reviews are only available after delivery' }, { status: 409 });
  }

  const existingReview = await getReviewByDonationId(donation.id);
  if (existingReview) {
    return NextResponse.json({ error: 'This donation has already been reviewed' }, { status: 409 });
  }

  try {
    const review = await createDonorReview({
      id: crypto.randomUUID(),
      donationId: donation.id,
      donorId: donation.donorId,
      ngoId: user.id,
      rating,
      comment,
      tags,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save review' },
      { status: 500 }
    );
  }
}
