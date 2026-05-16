'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { uploadDonationPhoto } from '@/lib/photo-upload';
import { combineLocalDateAndTime, validatePreparedAt } from '@/lib/food-safety';
import { bangaloreFoodSources, DONOR_TYPE_LABELS, FOOD_SOURCE_OTHER, validateDonationSource } from '@/lib/donation-source';
import {
  Package,
  MapPin,
  Clock,
  Sparkles,
  ArrowLeft,
  Send,
  Leaf,
  ChevronRight,
  Zap,
  Info,
  Loader2,
  Calendar,
  AlertCircle,
  ImagePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  { value: 'low', label: 'Low — flexible timing' },
  { value: 'medium', label: 'Medium — within a few hours' },
  { value: 'high', label: 'High — urgent pickup needed' },
];

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

export function DonationForm({ donorArea }: { donorArea?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: '',
    foodType: '',
    donorType: 'restaurant_business',
    foodSourceChoice: '',
    foodSourceName: '',
    preparedDate: '',
    preparedTime: '',
    quantity: '',
    unit: 'kg',
    urgency: 'medium',
    locationName: donorArea || '',
    pickupStart: '',
    pickupEnd: '',
    notes: '',
    isVegetarian: false,
  });

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file);
    if (!file) {
      setPhotoPreview(null);
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const foodSourceName = form.donorType === 'individual'
      ? (form.foodSourceChoice === FOOD_SOURCE_OTHER ? form.foodSourceName : form.foodSourceChoice)
      : '';
    const sourceValidation = validateDonationSource(form.donorType as any, foodSourceName);
    if (!sourceValidation.ok) {
      toast.error(sourceValidation.error);
      return;
    }

    const preparedAt = combineLocalDateAndTime(form.preparedDate, form.preparedTime);
    const preparedValidation = validatePreparedAt(preparedAt);
    if (!preparedValidation.ok) {
      toast.error(preparedValidation.error);
      return;
    }

    setLoading(true);

    try {
      const donationId = crypto.randomUUID();
      let photoUrl: string | undefined;

      if (photoFile) {
        const upload = await uploadDonationPhoto(photoFile, donationId);
        photoUrl = upload.url;

        if (upload.usedFallback) {
          toast.info('Photo stored with demo fallback', {
            description: 'Supabase Storage upload was unavailable, so this small image was saved with the donation.',
          });
        } else if (!upload.url) {
          toast.error('Photo upload skipped', {
            description: upload.error || 'The donation will be saved without a photo.',
          });
        }
      }

      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          donation: {
            ...form,
            id: donationId,
            donorType: form.donorType,
            foodSourceName,
            preparedAt,
            quantity: Number(form.quantity),
            photoUrl,
          },
        }),
      });

      if (res.ok) {
        toast.success('Donation created', {
          description: 'Sharebite is matching your food with nearby NGOs.',
          icon: <Sparkles className="w-4 h-4 text-fb-primary" />,
        });
        router.push('/dashboard/donor');
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || 'Submission failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest hover:text-fb-primary transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-fb-primary rounded-full" />
              <h2 className="text-[11px] font-black text-fb-primary uppercase tracking-[0.2em]">New Donation</h2>
            </div>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl font-black tracking-tight text-fb-on-surface">
              Donation Details
            </h1>
            <p className="text-sm text-fb-on-surface-variant mt-1.5 font-medium max-w-md">
              Add the food details, pickup time, and notes for the NGO.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Main Area */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
          <Card className="bg-white border-fb-outline-variant/10 shadow-sm rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-10 space-y-10">
              {/* Section 1: Content */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-fb-outline-variant/5">
                  <div className="p-2 rounded-xl bg-fb-primary/5 text-fb-primary">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-fb-on-surface uppercase tracking-widest">Food Details</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40 ml-1">Donation Title</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => update('title', e.target.value)}
                      placeholder="e.g. Artisanal Sourdough Surplus — Batch 04"
                      required
                      className="bg-fb-surface-container-low border-fb-outline-variant/5 focus:border-fb-primary/30 rounded-2xl h-14 font-bold text-fb-on-surface placeholder:text-fb-on-surface-variant/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40 ml-1">Food Category</Label>
                      <Select value={form.category} onValueChange={(v) => update('category', v)}>
                        <SelectTrigger className="bg-fb-surface-container-low border-fb-outline-variant/5 rounded-2xl h-14 font-bold">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl">
                          {categories.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40 ml-1">Specific Item Type</Label>
                      <Input
                        value={form.foodType}
                        onChange={(e) => update('foodType', e.target.value)}
                        placeholder="e.g. Mixed Breads, Pastries"
                        className="bg-fb-surface-container-low border-fb-outline-variant/5 rounded-2xl h-14 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-fb-outline-variant/10 bg-fb-surface-container-low p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40 ml-1">Donor Type</Label>
                        <Select value={form.donorType} onValueChange={(v) => update('donorType', v)}>
                          <SelectTrigger className="bg-white border-fb-outline-variant/5 rounded-2xl h-14 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl shadow-2xl">
                            {Object.entries(DONOR_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {form.donorType === 'individual' && (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40 ml-1">Where did you buy this food from?</Label>
                          <Select value={form.foodSourceChoice} onValueChange={(v) => update('foodSourceChoice', v)}>
                            <SelectTrigger className="bg-white border-fb-outline-variant/5 rounded-2xl h-14 font-bold">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-2xl max-h-[320px]">
                              {bangaloreFoodSources.map((source) => (
                                <SelectItem key={source} value={source}>{source}</SelectItem>
                              ))}
                              <SelectItem value={FOOD_SOURCE_OTHER}>Other / Enter manually</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {form.donorType === 'individual' && form.foodSourceChoice === FOOD_SOURCE_OTHER && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40 ml-1">Food Source Name</Label>
                        <Input
                          value={form.foodSourceName}
                          onChange={(e) => update('foodSourceName', e.target.value)}
                          placeholder="Enter restaurant or store name"
                          className="bg-white border-fb-outline-variant/5 rounded-2xl h-14 font-bold"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40 ml-1">Cooked/Prepared Date</Label>
                      <Input
                        type="date"
                        value={form.preparedDate}
                        onChange={(e) => update('preparedDate', e.target.value)}
                        required
                        className="bg-fb-surface-container-low border-fb-outline-variant/5 rounded-2xl h-14 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40 ml-1">Cooked/Prepared Time</Label>
                      <Select value={form.preparedTime} onValueChange={(v) => update('preparedTime', v)}>
                        <SelectTrigger className="bg-fb-surface-container-low border-fb-outline-variant/5 rounded-2xl h-14 font-bold">
                          <SelectValue placeholder="Select Time" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[1.5rem] shadow-ambient-4 max-h-[320px] p-2 border-fb-outline-variant/10">
                          {timeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest focus:bg-fb-primary/5 focus:text-fb-primary transition-colors cursor-pointer">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40 ml-1">Quantity</Label>
                      <Input
                        type="number"
                        value={form.quantity}
                        onChange={(e) => update('quantity', e.target.value)}
                        placeholder="00"
                        required
                        min={1}
                        className="bg-fb-surface-container-low border-fb-outline-variant/5 rounded-2xl h-14 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40 ml-1">Unit</Label>
                      <Select value={form.unit} onValueChange={(v) => update('unit', v)}>
                        <SelectTrigger className="bg-fb-surface-container-low border-fb-outline-variant/5 rounded-2xl h-14 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl">
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="portions">Total Portions</SelectItem>
                          <SelectItem value="litres">Liquid (L)</SelectItem>
                          <SelectItem value="items">Discrete Units</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-fb-primary/5 border border-fb-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-fb-primary text-white">
                        <Leaf className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-fb-on-surface uppercase tracking-widest">Vegetarian Food</p>
                        <p className="text-[10px] font-bold text-fb-primary uppercase opacity-60">Vegetarian option</p>
                      </div>
                    </div>
                    <Switch
                      checked={form.isVegetarian}
                      onCheckedChange={(v) => update('isVegetarian', v)}
                      className="data-[state=checked]:bg-fb-primary"
                    />
                  </div>

                  <div className="space-y-3 rounded-2xl border border-fb-outline-variant/10 bg-fb-surface-container-low p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white text-fb-primary">
                          <ImagePlus className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-fb-on-surface uppercase tracking-widest">Food Photo</p>
                          <p className="text-[10px] font-bold text-fb-on-surface-variant uppercase opacity-60">Optional image preview</p>
                        </div>
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
                        className="max-w-[220px] rounded-xl bg-white text-xs font-bold"
                      />
                    </div>
                    {photoPreview && (
                      <div className="overflow-hidden rounded-2xl border border-fb-outline-variant/10 bg-white">
                        <img src={photoPreview} alt="Food preview" className="h-48 w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Logistics */}
              <div className="space-y-8 pt-4">
                <div className="flex items-center gap-3 pb-4 border-b border-fb-outline-variant/5">
                  <div className="p-2 rounded-xl bg-fb-primary/5 text-fb-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-fb-on-surface uppercase tracking-widest">Pickup Details</h3>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-[0.15em] opacity-50 ml-1">Tactical Pickup Address</Label>
                    <div className="relative group">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-fb-on-surface-variant group-focus-within:text-fb-primary transition-colors opacity-40 group-focus-within:opacity-100" />
                      <Input
                        value={form.locationName}
                        onChange={(e) => update('locationName', e.target.value)}
                        placeholder="e.g. 42 Baker Street, Loading Bay 2"
                        required
                        className="bg-fb-surface-container-low border-fb-outline-variant/5 pl-14 rounded-2xl h-16 font-black text-xs uppercase tracking-widest transition-all focus:border-fb-primary/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-[0.15em] opacity-50 ml-1">Pickup Window Start</Label>
                      <div className="relative group">
                        <Select value={form.pickupStart} onValueChange={(v) => update('pickupStart', v)}>
                          <SelectTrigger className="bg-fb-surface-container-low border-fb-outline-variant/5 pl-12 rounded-2xl h-16 font-black text-xs uppercase tracking-widest transition-all focus:border-fb-primary/30">
                            <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-fb-on-surface-variant opacity-40 group-focus-within:opacity-100 transition-opacity" />
                            <SelectValue placeholder="Start Time" />
                          </SelectTrigger>
                          <SelectContent className="rounded-[1.5rem] shadow-ambient-4 max-h-[320px] p-2 border-fb-outline-variant/10">
                            {timeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest focus:bg-fb-primary/5 focus:text-fb-primary transition-colors cursor-pointer">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-[0.15em] opacity-50 ml-1">Pickup Window End</Label>
                      <div className="relative group">
                        <Select value={form.pickupEnd} onValueChange={(v) => update('pickupEnd', v)}>
                          <SelectTrigger className="bg-fb-surface-container-low border-fb-outline-variant/5 pl-12 rounded-2xl h-16 font-black text-xs uppercase tracking-widest transition-all focus:border-fb-primary/30">
                            <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-fb-on-surface-variant opacity-40 group-focus-within:opacity-100 transition-opacity" />
                            <SelectValue placeholder="End Time" />
                          </SelectTrigger>
                          <SelectContent className="rounded-[1.5rem] shadow-ambient-4 max-h-[320px] p-2 border-fb-outline-variant/10">
                            {timeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest focus:bg-fb-primary/5 focus:text-fb-primary transition-colors cursor-pointer">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-[0.15em] opacity-50 ml-1">Logistics Priority</Label>
                    <Select value={form.urgency} onValueChange={(v) => update('urgency', v)}>
                      <SelectTrigger className="bg-fb-surface-container-low border-fb-outline-variant/5 rounded-2xl h-16 font-black text-xs uppercase tracking-widest transition-all focus:border-fb-primary/30">
                        <SelectValue placeholder="Select Urgency" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[1.5rem] shadow-ambient-4 p-2 border-fb-outline-variant/10">
                        {urgencyLevels.map((u) => (
                          <SelectItem key={u.value} value={u.value} className="rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest focus:bg-fb-primary/5 focus:text-fb-primary transition-colors cursor-pointer">
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-[0.15em] opacity-50 ml-1">Mission Notes (Optional)</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => update('notes', e.target.value)}
                      placeholder="Storage instructions, access notes, or allergens..."
                      rows={4}
                      className="bg-fb-surface-container-low border-fb-outline-variant/5 rounded-[2rem] resize-none font-medium p-6 focus:border-fb-primary/30 transition-all text-sm leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading || !form.title || !form.category || !form.quantity || !form.preparedDate || !form.preparedTime || (form.donorType === 'individual' && !form.foodSourceChoice)}
            className="w-full h-18 rounded-[2rem] bg-[#0f5238] hover:bg-[#1b4332] text-white font-black uppercase tracking-[0.2em] shadow-ambient-3 hover:translate-y-[-2px] transition-all group"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <div className="flex items-center gap-3">
                Create Donation
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </Button>
        </form>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          <Card className="bg-[#0f5238] border-none shadow-xl rounded-[2.5rem] overflow-hidden sticky top-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-[#95d5b2]" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Donation Tips</h4>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Helpful Suggestions</p>
                </div>
              </div>

              <div className="space-y-6">
                <IntelligenceTip 
                  icon={Zap}
                  title="Clear Titles"
                  text={'Specific titles like "Fresh veg meals" help NGOs understand the donation quickly.'} 
                />
                <IntelligenceTip 
                  icon={AlertCircle}
                  title="Popular Items"
                  text="Cooked meals and bakery items are usually accepted quickly." 
                />
                <IntelligenceTip 
                  icon={Calendar}
                  title="Best Pickup Time"
                  text="Morning pickup windows are often easier for NGOs and delivery partners." 
                />
                <IntelligenceTip 
                  icon={Info}
                  title="Food Notes"
                  text="Adding allergen and storage notes helps NGOs respond faster." 
                />
              </div>

              <div className="mt-10 p-5 rounded-[1.5rem] bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Network Status</span>
                </div>
                <p className="text-[10px] font-bold text-white leading-relaxed">
                  Sharebite is checking nearby NGO matches for current donations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function IntelligenceTip({ icon: Icon, title, text }: { icon: any, title: string, text: string }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 h-fit">
        <Icon className="w-4 h-4" />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{title}</p>
        <p className="text-[11px] font-medium text-white/60 leading-relaxed tracking-tight">{text}</p>
      </div>
    </div>
  );
}
