import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getNGOStats,
  getOpenDonations,
  getDonationsByNGO,
  getMatchesForDonation,
  getReviewsByDonationIds,
  getDonorRatingSummaries,
} from '@/lib/store';
import { NGODashboard } from '@/components/ngo/ngo-dashboard';
import { RevalidationTimer } from '@/components/shared/revalidation-timer';

export const dynamic = 'force-dynamic';

export default async function NGOPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (user.role !== 'ngo') redirect(`/dashboard/${user.role}`);

  const stats = await getNGOStats(user.id);
  const openDonations = await getOpenDonations();
  const acceptedDonations = await getDonationsByNGO(user.id);
  const allVisibleDonations = [...openDonations, ...acceptedDonations];
  const reviewRows = await getReviewsByDonationIds(acceptedDonations.map((donation) => donation.id));
  const donationReviews = Object.fromEntries(reviewRows.map((review) => [review.donationId, review]));
  const donorRatings = await getDonorRatingSummaries(allVisibleDonations.map((donation) => donation.donorId));
  
  // Enrich open donations with match scores for this NGO
  const enrichedDonations = await Promise.all(openDonations.map(async (d) => {
    const matches = await getMatchesForDonation(d.id);
    const ngoMatch = matches.find((m) => m.ngoId === user.id);
    return {
      ...d,
      matchScore: ngoMatch?.score,
      matchReason: ngoMatch?.reason,
      donorRating: donorRatings[d.donorId],
    };
  }));

  const enrichedAcceptedDonations = acceptedDonations.map((donation) => ({
    ...donation,
    donorRating: donorRatings[donation.donorId],
    donorReview: donationReviews[donation.id],
  }));

  return (
    <>
      <NGODashboard
        stats={stats}
        openDonations={enrichedDonations}
        acceptedDonations={enrichedAcceptedDonations}
        ngoName={user.organizationName}
      />
      <RevalidationTimer intervalMs={10000} />
    </>
  );
}
