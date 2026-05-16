'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/status-badge';
import { Donation, AnalyticsSnapshot, DonorRatingSummary } from '@/types';
import { toast } from 'sonner';
import { uploadDonationPhoto } from '@/lib/photo-upload';
import { combineLocalDateAndTime, splitISOToLocalDateTime, validatePreparedAt } from '@/lib/food-safety';
import { bangaloreFoodSources, DONOR_TYPE_LABELS, FOOD_SOURCE_OTHER, validateDonationSource } from '@/lib/donation-source';
import {
  Package,
  Utensils,
  TrendingUp,
  PlusCircle,
  MapPin,
  Clock,
  ArrowUpRight,
  BarChart3,
  Heart,
  Edit3,
  Trash2,
  Loader2,
  ImagePlus,
  Star,
  MessageSquareText,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface DonorOverviewProps {
  stats: {
    totalDonations: number;
    mealsDoated: number;
    ngosHelped: number;
    impactScore: number;
    activeDonations: number;
  };
  recentDonations: Donation[];
  analytics?: AnalyticsSnapshot[];
  donorName: string;
  ratingSummary?: DonorRatingSummary;
}

const editableStatuses = ['open', 'accepted', 'pickup_assigned'];

const categories = [
  { value: 'cooked_meals', label: 'Cooked Meals' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'fresh_produce', label: 'Fresh Produce' },
  { value: 'packaged', label: 'Packaged' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'other', label: 'Other' },
];

const urgencyLevels = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'Urgent' },
];

const units = ['kg', 'portions', 'litres', 'items', 'boxes', 'packs', 'cups', 'bottles', 'sandwiches'];

const isoToTime = (value: string) => value?.slice(11, 16) || '';

const statusOrder = ['open', 'accepted', 'pickup_assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not set';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
};

const formatPickupWindow = (start?: string | null, end?: string | null) => {
  if (!start && !end) return 'Not set';

  const formatter = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  if (start && end) return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
  return formatter.format(new Date(start || end || ''));
};

const getPickupArea = (locationName: string) => {
  const bangaloreAreas = [
    'Koramangala',
    'Indiranagar',
    'Jayanagar',
    'Whitefield',
    'HSR Layout',
    'MG Road',
    'Electronic City',
    'JP Nagar',
    'Malleshwaram',
    'Marathahalli',
    'Hebbal',
  ];
  return bangaloreAreas.find((area) => locationName.toLowerCase().includes(area.toLowerCase())) || locationName;
};

const timeOptions = Array.from({ length: 96 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  const h24 = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = (hour % 12 || 12).toString().padStart(2, '0');
  return {
    value: `${h24}:${m}`,
    label: `${h12}:${m} ${period}`,
  };
});

const createEditForm = (donation: Donation) => {
  const prepared = splitISOToLocalDateTime(donation.preparedAt);
  const foodSourceChoice = donation.foodSourceName && bangaloreFoodSources.includes(donation.foodSourceName)
    ? donation.foodSourceName
    : donation.foodSourceName
      ? FOOD_SOURCE_OTHER
      : '';

  return {
    title: donation.title,
    category: donation.category,
    foodType: donation.foodType,
    donorType: donation.donorType || 'restaurant_business',
    foodSourceChoice,
    foodSourceName: foodSourceChoice === FOOD_SOURCE_OTHER ? donation.foodSourceName || '' : '',
    preparedDate: prepared.date,
    preparedTime: prepared.time,
    quantity: String(donation.quantity),
    unit: donation.unit,
    urgency: donation.urgency,
    locationName: donation.locationName,
    pickupStart: isoToTime(donation.pickupStart),
    pickupEnd: isoToTime(donation.pickupEnd),
    notes: donation.notes,
    isVegetarian: donation.isVegetarian,
    photoUrl: donation.photoUrl || '',
  };
};

const KPICard = ({ 
  label, 
  value, 
  subtitle, 
  icon: Icon, 
  color = "bg-fb-primary" 
}: { 
  label: string; 
  value: string; 
  subtitle: string; 
  icon: any;
  color?: string;
}) => (
  <Card className="relative overflow-hidden border-fb-outline-variant/10 shadow-sm bg-white group hover:shadow-md transition-all duration-500 rounded-[2rem]">
    <div className={cn("absolute top-0 right-0 w-24 h-24 opacity-[0.03] -mr-8 -mt-8 rounded-full", color)} />
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-2xl bg-fb-surface-container group-hover:scale-110 transition-transform duration-500", color.replace('bg-', 'text-'))}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-fb-primary/5 rounded-full border border-fb-primary/5">
          <div className="w-1 h-1 rounded-full bg-fb-primary" />
          <span className="text-[8px] font-black text-fb-primary uppercase tracking-widest">Live</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest leading-none">{label}</p>
        <p className="text-3xl font-black text-fb-on-surface mt-2 tracking-tight">{value}</p>
        <p className="text-[10px] font-bold text-fb-on-surface-variant/40 mt-1 uppercase">{subtitle}</p>
      </div>
    </CardContent>
  </Card>
);

export function DonorOverview({ stats, recentDonations, analytics = [], donorName, ratingSummary }: DonorOverviewProps) {
  const router = useRouter();
  const firstName = donorName.split(' ')[0];
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [deleteDonation, setDeleteDonation] = useState<Donation | null>(null);
  const [allDonationsOpen, setAllDonationsOpen] = useState(false);
  const [editForm, setEditForm] = useState<ReturnType<typeof createEditForm> | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const donationActivity = recentDonations.reduce<Record<string, { date: string; donations: number; meals: number }>>((acc, donation) => {
    const label = new Date(donation.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    if (!acc[label]) {
      acc[label] = { date: label, donations: 0, meals: 0 };
    }
    acc[label].donations += 1;
    acc[label].meals += donation.quantity;
    return acc;
  }, {});

  const chartData = analytics.length > 0
    ? analytics.map((a) => ({
        date: new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        donations: a.donationsReceived,
        meals: a.mealsRescued,
      }))
    : Object.values(donationActivity);
  const hasChartData = chartData.some((row) => row.donations > 0 || row.meals > 0);
  const statusSummary = statusOrder
    .map((status) => ({
      status,
      count: recentDonations.filter((donation) => donation.status === status).length,
    }))
    .filter((item) => item.count > 0);

  const openEditDialog = (donation: Donation) => {
    setEditingDonation(donation);
    setEditForm(createEditForm(donation));
    setEditPhotoFile(null);
    setEditPhotoPreview(donation.photoUrl || null);
  };

  const updateEditForm = (field: keyof NonNullable<typeof editForm>, value: string | boolean) => {
    setEditForm((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const handleEditPhotoChange = (file: File | null) => {
    setEditPhotoFile(file);
    if (!file) {
      setEditPhotoPreview(editForm?.photoUrl || null);
      return;
    }

    setEditPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveEdit = async () => {
    if (!editingDonation || !editForm) return;
    const foodSourceName = editForm.donorType === 'individual'
      ? (editForm.foodSourceChoice === FOOD_SOURCE_OTHER ? editForm.foodSourceName : editForm.foodSourceChoice)
      : '';
    const sourceValidation = validateDonationSource(editForm.donorType as any, foodSourceName);
    if (!sourceValidation.ok) {
      toast.error(sourceValidation.error);
      return;
    }

    const preparedAt = combineLocalDateAndTime(editForm.preparedDate, editForm.preparedTime);
    const preparedValidation = validatePreparedAt(preparedAt);
    if (!preparedValidation.ok) {
      toast.error(preparedValidation.error);
      return;
    }

    setSaving(true);

    try {
      let photoUrl = editForm.photoUrl || undefined;

      if (editPhotoFile) {
        const upload = await uploadDonationPhoto(editPhotoFile, editingDonation.id);
        if (upload.url) {
          photoUrl = upload.url;
          if (upload.usedFallback) {
            toast.info('Photo stored with demo fallback', {
              description: 'Supabase Storage upload was unavailable, so this small image was saved with the donation.',
            });
          }
        } else {
          toast.error('Photo upload skipped', {
            description: upload.error || 'Existing photo was kept.',
          });
        }
      }

      const res = await fetch('/api/donations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationId: editingDonation.id,
          donation: {
            ...editForm,
            donorType: editForm.donorType,
            foodSourceName,
            preparedAt,
            photoUrl,
            quantity: Number(editForm.quantity),
          },
        }),
      });

      if (res.ok) {
        toast.success('Donation updated');
        setEditingDonation(null);
        setEditForm(null);
        setEditPhotoFile(null);
        setEditPhotoPreview(null);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || 'Unable to update donation');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDonation) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/donations?donationId=${encodeURIComponent(deleteDonation.id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Donation deleted');
        setDeleteDonation(null);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || 'Unable to delete donation');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-fb-primary rounded-full" />
            <h2 className="text-[11px] font-black text-fb-primary uppercase tracking-[0.2em]">Donor Dashboard</h2>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl font-black tracking-tight text-fb-on-surface">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-fb-on-surface-variant mt-1.5 font-medium max-w-md">
            Track your active donations and food-sharing impact.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest">Active Donor</span>
            <span className="text-xs font-black text-fb-on-surface mt-1">{donorName}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-fb-surface-container flex items-center justify-center border border-fb-outline-variant/10 shadow-inner overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${donorName}&backgroundColor=0f5238&textColor=ffffff`} alt={donorName} className="w-full h-full" />
          </div>
          <Separator orientation="vertical" className="h-10 mx-2 bg-fb-outline-variant/20" />
          <Button
            onClick={() => router.push('/dashboard/donor/new')}
            className="h-14 px-8 rounded-2xl bg-fb-primary text-white shadow-ambient-2 hover:shadow-ambient-3 hover:translate-y-[-2px] active:translate-y-0 transition-all font-black uppercase tracking-widest gap-3"
          >
            <PlusCircle className="w-5 h-5" />
            New Donation
          </Button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Active Donations" value={stats.activeDonations.toString()} subtitle="In Progress" icon={Clock} color="bg-blue-600" />
        <KPICard label="Meals Rescued" value={stats.mealsDoated.toLocaleString()} subtitle="Food Shared" icon={Utensils} color="bg-fb-primary" />
        <KPICard label="Impact Points" value={stats.impactScore.toLocaleString()} subtitle="Community Score" icon={Heart} color="bg-rose-500" />
        <KPICard label="Partnerships" value={stats.ngosHelped.toString()} subtitle="Local NGOs Supported" icon={TrendingUp} color="bg-amber-600" />
      </div>

      <Card className="bg-white border-fb-outline-variant/10 shadow-sm rounded-[2rem] overflow-hidden">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Star className="h-6 w-6 fill-current" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/50">Donor Rating</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-3xl font-black text-fb-on-surface">
                  {ratingSummary && ratingSummary.reviewCount > 0 ? ratingSummary.averageRating.toFixed(1) : '--'}
                </p>
                <p className="text-xs font-black uppercase tracking-widest text-fb-on-surface-variant">
                  {ratingSummary?.reviewCount || 0} reviews
                </p>
              </div>
            </div>
          </div>

          {ratingSummary && ratingSummary.reviewCount > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {ratingSummary.recentReviews.map((review) => (
                <div key={review.id} className="rounded-2xl bg-fb-surface-container-low p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-700">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-black">{review.rating}/5</span>
                    </div>
                    <span className="truncate text-[8px] font-black uppercase tracking-widest text-fb-on-surface-variant/40">
                      {review.ngoName || 'NGO'}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-fb-on-surface-variant">
                    {review.comment || (review.tags.length > 0 ? review.tags.join(', ') : 'Positive donor experience.')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-fb-surface-container-low p-4">
              <MessageSquareText className="h-5 w-5 text-fb-on-surface-variant/40" />
              <p className="text-xs font-bold text-fb-on-surface-variant">
                NGO feedback will appear here after delivered donations are reviewed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card className="bg-white border-fb-outline-variant/10 shadow-sm rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-fb-outline-variant/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-fb-primary/10">
                  <BarChart3 className="w-5 h-5 text-fb-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-fb-on-surface uppercase tracking-tight">Donation Activity</h3>
                  <p className="text-[10px] font-bold text-fb-on-surface-variant uppercase tracking-widest opacity-60">Recent donation history</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-black border-fb-outline-variant/20 px-3 py-1 rounded-lg">LIVE DATA</Badge>
            </div>
            <div className="p-8">
              {hasChartData ? (
                <>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0f5238" stopOpacity={1} />
                            <stop offset="100%" stopColor="#2d6a4f" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={10} 
                          fontWeight={700}
                          tickLine={false} 
                          axisLine={false} 
                          stroke="#a0a0a0" 
                          dy={10}
                        />
                        <YAxis 
                          fontSize={10} 
                          fontWeight={700}
                          tickLine={false} 
                          axisLine={false} 
                          stroke="#a0a0a0" 
                        />
                        <Tooltip
                          cursor={{ fill: '#f8f9f5' }}
                          contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 30px rgba(15,82,56,0.1)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: '#ffffff',
                            padding: '12px 16px',
                          }}
                        />
                        <Bar dataKey="donations" fill="url(#chartGradient)" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {statusSummary.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {statusSummary.map((item) => (
                        <div key={item.status} className="rounded-2xl bg-fb-surface-container-low px-3 py-2">
                          <p className="text-[8px] font-black uppercase tracking-widest text-fb-on-surface-variant/50">{item.status.replace('_', ' ')}</p>
                          <p className="mt-1 text-sm font-black text-fb-on-surface">{item.count}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-fb-outline-variant/20 bg-fb-surface-container-lowest p-8 text-center">
                  <BarChart3 className="mb-4 h-10 w-10 text-fb-outline opacity-40" />
                  <p className="text-sm font-black uppercase tracking-widest text-fb-on-surface">No Donation Activity Yet</p>
                  <p className="mt-2 max-w-sm text-xs font-medium text-fb-on-surface-variant">
                    Your activity chart will fill in after you create donations. Active, delivered, and cancelled donations will all be counted.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* List Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="flex-1 bg-white border-fb-outline-variant/10 shadow-sm rounded-[2.5rem] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-fb-outline-variant/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-fb-on-surface uppercase tracking-tight">Active Donations</h3>
                  <p className="text-[10px] font-bold text-fb-on-surface-variant uppercase tracking-widest opacity-60">Current donation status</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAllDonationsOpen(true)}
                className="text-[10px] font-black text-fb-primary uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>
            
            <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
              {recentDonations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20 border-2 border-dashed border-fb-outline-variant/30 rounded-[2rem]">
                  <Package className="w-12 h-12 mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">No Active Donations</p>
                  <p className="text-[10px] mt-2 font-medium">Create a new donation to begin.</p>
                </div>
              ) : (
                recentDonations.slice(0, 8).map((d) => {
                  const canManage = editableStatuses.includes(d.status);

                  return (
                    <div
                      key={d.id}
                      className="flex items-center gap-4 p-5 rounded-3xl bg-fb-surface-container-lowest border border-transparent hover:border-fb-outline-variant/10 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-fb-surface-container flex items-center justify-center text-fb-primary transition-transform group-hover:scale-110">
                        {d.photoUrl ? (
                          <img src={d.photoUrl} alt={d.title} className="h-full w-full rounded-2xl object-cover" />
                        ) : (
                          <Package className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-fb-on-surface truncate group-hover:text-fb-primary transition-colors">{d.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-fb-on-surface-variant uppercase">{d.quantity} {d.unit}</span>
                          <Separator orientation="vertical" className="h-2.5 bg-fb-outline-variant/30" />
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-fb-on-surface-variant/60 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {d.locationName}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={d.status} className="h-5 text-[8px] font-black px-2 py-0 border-none" />
                        {canManage ? (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-lg text-fb-on-surface-variant hover:text-fb-primary"
                              onClick={() => openEditDialog(d)}
                              aria-label={`Edit ${d.title}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-lg text-fb-on-surface-variant hover:text-fb-error"
                              onClick={() => setDeleteDonation(d)}
                              aria-label={`Delete ${d.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[8px] font-black text-fb-on-surface-variant/40 uppercase tracking-widest">Locked</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-6 bg-fb-surface-container-lowest border-t border-fb-outline-variant/5">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-fb-on-surface-variant uppercase tracking-widest">Platform Status: Ready</span>
                </div>
                <span className="text-[9px] font-black text-fb-on-surface-variant opacity-40 uppercase">FB-DN-2024</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={allDonationsOpen} onOpenChange={setAllDonationsOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden rounded-[2rem] bg-white p-0 sm:max-w-5xl">
          <DialogHeader className="border-b border-fb-outline-variant/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-black text-fb-on-surface">All Donations</DialogTitle>
                <DialogDescription>
                  Complete donor history from Supabase, including active, completed, and cancelled donations.
                </DialogDescription>
              </div>
              <Badge variant="outline" className="mt-1 rounded-full border-fb-outline-variant/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                {recentDonations.length} total
              </Badge>
            </div>
          </DialogHeader>

          <div className="max-h-[68vh] overflow-y-auto p-5 custom-scrollbar">
            {recentDonations.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-fb-outline-variant/20 bg-fb-surface-container-lowest p-8 text-center">
                <Package className="mb-4 h-10 w-10 text-fb-outline opacity-40" />
                <p className="text-sm font-black uppercase tracking-widest text-fb-on-surface">No Donations Yet</p>
                <p className="mt-2 max-w-sm text-xs font-medium text-fb-on-surface-variant">
                  Create a donation and it will appear here with its status, pickup details, source, and management options.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDonations.map((donation) => {
                  const canManage = editableStatuses.includes(donation.status);

                  return (
                    <div
                      key={donation.id}
                      className="grid gap-4 rounded-[1.5rem] border border-fb-outline-variant/10 bg-fb-surface-container-lowest p-4 md:grid-cols-[72px_minmax(0,1.4fr)_minmax(240px,1fr)_auto]"
                    >
                      <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white text-fb-primary shadow-inner">
                        {donation.photoUrl ? (
                          <img src={donation.photoUrl} alt={donation.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={donation.status} className="h-5 border-none px-2 py-0 text-[8px] font-black" />
                          <Badge className="rounded-full bg-fb-primary/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-fb-primary shadow-none">
                            {donation.urgency === 'high' ? 'Urgent' : donation.urgency}
                          </Badge>
                        </div>
                        <p className="mt-2 break-words text-sm font-black leading-snug text-fb-on-surface">{donation.title}</p>
                        <p className="mt-1 text-xs font-bold text-fb-on-surface-variant">
                          {donation.quantity} {donation.unit} · {donation.foodType}
                        </p>
                        <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-fb-on-surface-variant/70">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="break-words">{getPickupArea(donation.locationName)} · {donation.locationName}</span>
                        </p>
                      </div>

                      <div className="grid gap-2 text-xs font-bold text-fb-on-surface-variant">
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-[8px] font-black uppercase tracking-widest text-fb-on-surface-variant/50">Prepared</p>
                          <p className="mt-1 text-fb-on-surface">{formatDateTime(donation.preparedAt)}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-[8px] font-black uppercase tracking-widest text-fb-on-surface-variant/50">Pickup Window</p>
                          <p className="mt-1 text-fb-on-surface">{formatPickupWindow(donation.pickupStart, donation.pickupEnd)}</p>
                        </div>
                        {donation.foodSourceName && (
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-[8px] font-black uppercase tracking-widest text-fb-on-surface-variant/50">Food Source</p>
                            <p className="mt-1 break-words text-fb-on-surface">{donation.foodSourceName}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 md:flex-col md:items-end md:justify-center">
                        {canManage ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                              onClick={() => {
                                setAllDonationsOpen(false);
                                openEditDialog(donation);
                              }}
                            >
                              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest text-fb-error hover:text-fb-error"
                              onClick={() => {
                                setAllDonationsOpen(false);
                                setDeleteDonation(donation);
                              }}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </>
                        ) : (
                          <div className="rounded-2xl bg-white px-3 py-2 text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest text-fb-on-surface-variant/50">Manage</p>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant">Locked</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDonation} onOpenChange={(open) => {
        if (!open) {
          setEditingDonation(null);
          setEditForm(null);
          setEditPhotoFile(null);
          setEditPhotoPreview(null);
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-fb-outline-variant/10 p-6">
            <DialogTitle className="text-xl font-black text-fb-on-surface">Edit Donation</DialogTitle>
            <DialogDescription>
              Donors can edit donations until pickup starts.
            </DialogDescription>
          </DialogHeader>

          {editForm && (
            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Title</Label>
                <Input value={editForm.title} onChange={(e) => updateEditForm('title', e.target.value)} className="h-12 rounded-2xl bg-fb-surface-container-low font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Category</Label>
                <Select value={editForm.category} onValueChange={(value) => updateEditForm('category', value)}>
                  <SelectTrigger className="h-12 rounded-2xl bg-fb-surface-container-low font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Food Type</Label>
                <Input value={editForm.foodType} onChange={(e) => updateEditForm('foodType', e.target.value)} className="h-12 rounded-2xl bg-fb-surface-container-low font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Donor Type</Label>
                <Select value={editForm.donorType} onValueChange={(value) => updateEditForm('donorType', value)}>
                  <SelectTrigger className="h-12 rounded-2xl bg-fb-surface-container-low font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {Object.entries(DONOR_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editForm.donorType === 'individual' && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Where did you buy this food from?</Label>
                  <Select value={editForm.foodSourceChoice} onValueChange={(value) => updateEditForm('foodSourceChoice', value)}>
                    <SelectTrigger className="h-12 rounded-2xl bg-fb-surface-container-low font-bold">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-[320px]">
                      {bangaloreFoodSources.map((source) => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                      <SelectItem value={FOOD_SOURCE_OTHER}>Other / Enter manually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editForm.donorType === 'individual' && editForm.foodSourceChoice === FOOD_SOURCE_OTHER && (
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Food Source Name</Label>
                  <Input value={editForm.foodSourceName} onChange={(e) => updateEditForm('foodSourceName', e.target.value)} className="h-12 rounded-2xl bg-fb-surface-container-low font-bold" />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Cooked/Prepared Date</Label>
                <Input type="date" value={editForm.preparedDate} onChange={(e) => updateEditForm('preparedDate', e.target.value)} className="h-12 rounded-2xl bg-fb-surface-container-low font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Cooked/Prepared Time</Label>
                <Select value={editForm.preparedTime} onValueChange={(value) => updateEditForm('preparedTime', value)}>
                  <SelectTrigger className="h-12 rounded-2xl bg-fb-surface-container-low font-bold">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-[320px]">
                    {timeOptions.map((time) => (
                      <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Quantity</Label>
                <Input type="number" min={1} value={editForm.quantity} onChange={(e) => updateEditForm('quantity', e.target.value)} className="h-12 rounded-2xl bg-fb-surface-container-low font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Unit</Label>
                <Select value={editForm.unit} onValueChange={(value) => updateEditForm('unit', value)}>
                  <SelectTrigger className="h-12 rounded-2xl bg-fb-surface-container-low font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Urgency</Label>
                <Select value={editForm.urgency} onValueChange={(value) => updateEditForm('urgency', value)}>
                  <SelectTrigger className="h-12 rounded-2xl bg-fb-surface-container-low font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {urgencyLevels.map((urgency) => (
                      <SelectItem key={urgency.value} value={urgency.value}>{urgency.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Vegetarian</Label>
                <div className="flex h-12 items-center justify-between rounded-2xl bg-fb-surface-container-low px-4">
                  <span className="text-xs font-bold text-fb-on-surface-variant">Vegetarian Food</span>
                  <Switch checked={editForm.isVegetarian} onCheckedChange={(value) => updateEditForm('isVegetarian', value)} className="data-[state=checked]:bg-fb-primary" />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Pickup Location</Label>
                <Input value={editForm.locationName} onChange={(e) => updateEditForm('locationName', e.target.value)} className="h-12 rounded-2xl bg-fb-surface-container-low font-bold" />
              </div>

              <div className="space-y-3 sm:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Food Photo</Label>
                <div className="rounded-2xl border border-fb-outline-variant/10 bg-fb-surface-container-low p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white p-2 text-fb-primary">
                        <ImagePlus className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-fb-on-surface-variant">Upload or replace food photo</p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleEditPhotoChange(e.target.files?.[0] || null)}
                      className="max-w-[240px] rounded-xl bg-white text-xs font-bold"
                    />
                  </div>
                  {editPhotoPreview && (
                    <img src={editPhotoPreview} alt="Food preview" className="mt-4 h-48 w-full rounded-2xl object-cover" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Pickup Start</Label>
                <Input type="time" value={editForm.pickupStart} onChange={(e) => updateEditForm('pickupStart', e.target.value)} className="h-12 rounded-2xl bg-fb-surface-container-low font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Pickup End</Label>
                <Input type="time" value={editForm.pickupEnd} onChange={(e) => updateEditForm('pickupEnd', e.target.value)} className="h-12 rounded-2xl bg-fb-surface-container-low font-bold" />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">Notes</Label>
                <Textarea value={editForm.notes} onChange={(e) => updateEditForm('notes', e.target.value)} rows={4} className="rounded-[1.5rem] bg-fb-surface-container-low font-medium" />
              </div>
            </div>
          )}

          <DialogFooter className="rounded-b-[2rem] border-t border-fb-outline-variant/10 bg-fb-surface-container-lowest p-6">
            <Button variant="outline" className="h-11 rounded-2xl" onClick={() => {
              setEditingDonation(null);
              setEditForm(null);
              setEditPhotoFile(null);
              setEditPhotoPreview(null);
            }} disabled={saving}>
              Cancel
            </Button>
            <Button className="h-11 rounded-2xl bg-fb-primary px-6 text-white" onClick={handleSaveEdit} disabled={saving || !editForm?.title || !editForm?.quantity || !editForm?.preparedDate || !editForm?.preparedTime || (editForm?.donorType === 'individual' && !editForm?.foodSourceChoice)}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDonation} onOpenChange={(open) => !open && setDeleteDonation(null)}>
        <DialogContent className="rounded-[2rem] bg-white p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-fb-on-surface">Delete Donation?</DialogTitle>
            <DialogDescription>
              This removes the donation from donor, NGO, and delivery views. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-fb-surface-container-low p-4">
            <p className="text-sm font-black text-fb-on-surface">{deleteDonation?.title}</p>
            <p className="mt-1 text-xs font-bold text-fb-on-surface-variant">{deleteDonation?.quantity} {deleteDonation?.unit}</p>
          </div>
          <DialogFooter className="mt-2 rounded-b-none border-t-0 bg-transparent p-0">
            <Button variant="outline" className="h-11 rounded-2xl" onClick={() => setDeleteDonation(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="h-11 rounded-2xl px-6" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
