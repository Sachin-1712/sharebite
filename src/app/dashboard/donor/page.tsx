import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDonorRatingSummary, getDonorStats, getDonationsByDonor } from '@/lib/store';
import { DonorOverview } from '@/components/donor/donor-overview';
import { RevalidationTimer } from '@/components/shared/revalidation-timer';

export const dynamic = 'force-dynamic';

export default async function DonorDashboard() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (user.role !== 'donor') redirect(`/dashboard/${user.role}`);

  const stats = await getDonorStats(user.id);
  const donations = await getDonationsByDonor(user.id);
  const ratingSummary = await getDonorRatingSummary(user.id);

  return (
    <>
      <DonorOverview stats={stats} recentDonations={donations} donorName={user.name} ratingSummary={ratingSummary} />
      <RevalidationTimer intervalMs={10000} />
    </>
  );
}
