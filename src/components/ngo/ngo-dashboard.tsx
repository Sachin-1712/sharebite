'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge, UrgencyBadge } from '@/components/shared/status-badge';
import { Donation } from '@/types';
import { DONOR_TYPE_LABELS } from '@/lib/donation-source';
import { toast } from 'sonner';
import {
  Package,
  Utensils,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  Timer,
  Leaf,
  ArrowUpRight,
  Filter,
  Zap,
  ChevronRight,
  Search,
  Loader2,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface EnrichedDonation extends Donation {
  matchScore?: number;
  matchReason?: string;
}

interface NGODashboardProps {
  stats: {
    totalReceived: number;
    mealsRescued: number;
    thisWeek: number;
    avgAcceptanceMinutes: number;
    topDonorType: string;
  };
  openDonations: EnrichedDonation[];
  acceptedDonations: Donation[];
  ngoName: string;
}

const categoryLabels: Record<string, string> = {
  cooked_meals: 'Cooked Meals',
  bakery: 'Bakery',
  fresh_produce: 'Fresh Produce',
  packaged: 'Packaged',
  dairy: 'Dairy',
  beverages: 'Beverages',
  other: 'Other',
};

const KPICard = ({ label, value, subtitle, icon: Icon, color = "text-fb-primary" }: { label: string, value: string, subtitle: string, icon: any, color?: string }) => (
  <Card className="bg-white border-fb-outline-variant/10 shadow-sm rounded-[2rem] overflow-hidden group hover:shadow-md transition-all duration-500">
    <CardContent className="p-6 relative">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
        <Icon className="w-16 h-16" />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className={cn("p-3 rounded-2xl bg-fb-surface-container", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-fb-primary/5 rounded-full border border-fb-primary/5">
          <div className="w-1 h-1 rounded-full bg-fb-primary" />
          <span className="text-[8px] font-black text-fb-primary uppercase tracking-widest">Live Flow</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest leading-none">{label}</p>
        <h4 className="text-2xl font-black text-fb-on-surface mt-2 tracking-tight">{value}</h4>
        <p className="text-[10px] font-bold text-fb-on-surface-variant/40 mt-1 uppercase">{subtitle}</p>
      </div>
    </CardContent>
  </Card>
);

export function NGODashboard({ stats, openDonations, acceptedDonations, ngoName }: NGODashboardProps) {
  const router = useRouter();
  const [selectedDonation, setSelectedDonation] = useState<EnrichedDonation | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [loading, setLoading] = useState<string | null>(null);

  const filteredDonations = openDonations.filter((d) => {
    if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
    if (urgencyFilter !== 'all' && d.urgency !== urgencyFilter) return false;
    return true;
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const inProgressDonations = acceptedDonations.filter(d => ['accepted', 'pickup_assigned', 'picked_up', 'in_transit'].includes(d.status));
  const completedDonations = acceptedDonations.filter(d => d.status === 'delivered');

  const handleAccept = async (donationId: string) => {
    setLoading(donationId);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', donationId }),
      });

      if (res.ok) {
        toast.success('Inventory Secured!', {
          description: 'Logistics fleet has been dispatched to coordinates.',
          icon: <CheckCircle2 className="w-4 h-4 text-fb-primary" />,
        });
        setSelectedDonation(null);
        router.refresh();
      } else {
        toast.error('Sync failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10 overflow-hidden h-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-fb-primary rounded-full" />
            <h2 className="text-[11px] font-black text-fb-primary uppercase tracking-[0.2em]">NGO Dashboard</h2>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl font-black tracking-tight text-fb-on-surface">
            NGO Marketplace
          </h1>
          <p className="text-sm text-fb-on-surface-variant mt-1.5 font-medium max-w-md">
            Review available donations for <span className="text-fb-on-surface font-black">{ngoName}</span> and accept what you can use.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1.5 pr-6 rounded-full border border-fb-outline-variant/10 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-fb-primary/10 flex items-center justify-center text-fb-primary font-black shadow-inner">
            {ngoName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-fb-on-surface-variant uppercase tracking-widest leading-none">Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-fb-on-surface uppercase">Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Donations" value={stats.thisWeek.toString()} subtitle="This Week" icon={Package} color="text-fb-primary" />
        <KPICard label="Meals Rescued" value={stats.mealsRescued.toLocaleString()} subtitle="Total portions" icon={Utensils} color="text-emerald-600" />
        <KPICard label="Response Time" value={`${stats.avgAcceptanceMinutes}m`} subtitle="Average confirmation" icon={Timer} color="text-amber-600" />
        <KPICard label="Top Source" value={stats.topDonorType} subtitle="Common donor type" icon={Building2} color="text-fb-primary" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-fb-surface-container-lowest/30 rounded-[2.5rem] border border-fb-outline-variant/5 overflow-hidden">
        <Tabs defaultValue="available" className="flex-1 flex flex-col">
          <div className="px-8 pt-8 pb-6 border-b border-fb-outline-variant/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <TabsList className="bg-fb-surface-container-low p-1.5 rounded-2xl h-14 w-fit">
              <TabsTrigger 
                value="available" 
                className="px-8 rounded-xl h-full data-[state=active]:bg-white data-[state=active]:text-fb-primary data-[state=active]:shadow-sm text-[11px] font-black uppercase tracking-widest transition-all"
              >
                Available <Badge className="ml-3 bg-fb-primary/10 text-fb-primary border-none font-mono text-[10px]">{filteredDonations.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="accepted" 
                className="px-8 rounded-xl h-full data-[state=active]:bg-white data-[state=active]:text-fb-primary data-[state=active]:shadow-sm text-[11px] font-black uppercase tracking-widest transition-all"
              >
                In Progress <Badge className="ml-3 bg-blue-500/10 text-blue-600 border-none font-mono text-[10px]">{inProgressDonations.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="px-8 rounded-xl h-full data-[state=active]:bg-white data-[state=active]:text-fb-primary data-[state=active]:shadow-sm text-[11px] font-black uppercase tracking-widest transition-all"
              >
                History <Badge className="ml-3 bg-emerald-500/10 text-emerald-600 border-none font-mono text-[10px]">{completedDonations.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fb-on-surface-variant opacity-40 group-focus-within:text-fb-primary transition-colors" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px] h-12 pl-10 bg-white border-fb-outline-variant/10 rounded-2xl shadow-sm text-[11px] font-black uppercase tracking-widest">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-fb-outline-variant/10 shadow-2xl">
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(categoryLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-[140px] h-12 bg-white border-fb-outline-variant/10 rounded-2xl shadow-sm text-[11px] font-black uppercase tracking-widest">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-fb-outline-variant/10 shadow-2xl">
                  <SelectItem value="all">Priority: All</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <TabsContent value="available" className="h-full m-0 focus-visible:ring-0">
              <div className="h-full overflow-y-auto px-8 py-8 custom-scrollbar">
                {filteredDonations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20 border-2 border-dashed border-fb-outline-variant/10 rounded-[3rem]">
                    <Search className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-black uppercase tracking-tight">No Donations Found</h3>
                    <p className="text-sm mt-2 max-w-xs font-medium">New donations will appear here when donors create them.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-12">
                    {filteredDonations.map((donation) => (
                      <DonationCard 
                        key={donation.id} 
                        donation={donation} 
                        onClick={() => setSelectedDonation(donation)} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="accepted" className="h-full m-0 focus-visible:ring-0">
              <div className="h-full overflow-y-auto px-8 py-8 custom-scrollbar">
                {inProgressDonations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20 border-2 border-dashed border-fb-outline-variant/10 rounded-[3rem]">
                    <Package className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-black uppercase tracking-tight">No Active Donations</h3>
                    <p className="text-sm mt-2 max-w-xs font-medium">Accept available donations to see them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                    {inProgressDonations.map((donation) => (
                      <DonationCard 
                        key={donation.id} 
                        donation={donation} 
                        onClick={() => setSelectedDonation(donation)} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="h-full m-0 focus-visible:ring-0">
              <div className="h-full overflow-y-auto px-8 py-8 custom-scrollbar">
                {completedDonations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20 border-2 border-dashed border-fb-outline-variant/10 rounded-[3rem]">
                    <CheckCircle2 className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-black uppercase tracking-tight">No History Found</h3>
                    <p className="text-sm mt-2 max-w-xs font-medium">Successfully completed deliveries will be archived here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                    {completedDonations.map((donation) => (
                      <DonationCard 
                        key={donation.id} 
                        donation={donation} 
                        onClick={() => setSelectedDonation(donation)} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedDonation} onOpenChange={() => setSelectedDonation(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl bg-white border-none rounded-[2.5rem] p-0 overflow-hidden shadow-2xl outline-none">
          <DialogDescription className="sr-only">
            Detailed information about this donation signal, including volume, resource type, and deployment window.
          </DialogDescription>
          {selectedDonation && (
            <div className="flex max-h-[92vh] flex-col">
              <div className="overflow-y-auto custom-scrollbar">
              <div className="p-6 sm:p-8 bg-[#f8f9f5] border-b border-fb-outline-variant/10 relative">
                {selectedDonation.photoUrl && (
                  <img src={selectedDonation.photoUrl} alt={selectedDonation.title} className="mb-6 max-h-72 w-full rounded-[2rem] object-cover shadow-sm" />
                )}
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                  <Package className="w-48 h-48" />
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 relative z-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <UrgencyBadge urgency={selectedDonation.urgency} className="h-6 px-4 text-[10px] font-black" />
                    {selectedDonation.isVegetarian && (
                      <Badge className="bg-fb-primary/10 text-fb-primary border-none px-4 h-6 text-[10px] font-black uppercase tracking-widest">Vegetarian</Badge>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-black text-fb-on-surface-variant/40 uppercase tracking-widest">Stream ID: {selectedDonation.id.slice(-6).toUpperCase()}</span>
                </div>
                
                <DialogTitle asChild>
                  <h2 className="break-words text-3xl sm:text-4xl font-black text-fb-on-surface tracking-tighter font-[family-name:var(--font-heading)] leading-[1.1] relative z-10 max-w-2xl">
                    {selectedDonation.title}
                  </h2>
                </DialogTitle>
                
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 relative z-10">
                  <DetailItem label="Quantity" value={`${selectedDonation.quantity} ${selectedDonation.unit}`} icon={Package} />
                  <DetailItem label="Food Type" value={selectedDonation.foodType || categoryLabels[selectedDonation.category]} icon={Utensils} />
                  <DetailItem label="Pickup Location" value={selectedDonation.locationName} icon={MapPin} />
                  <DetailItem label="Donor Type" value={DONOR_TYPE_LABELS[selectedDonation.donorType || 'restaurant_business']} icon={Building2} />
                  {selectedDonation.foodSourceName && (
                    <DetailItem label="Food Source" value={selectedDonation.foodSourceName} icon={Building2} />
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                {/* AI Intelligence Card */}
                {selectedDonation.matchScore && (
                  <div className="relative p-6 sm:p-8 rounded-[2rem] bg-[#0f5238] overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <Zap className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                            <Sparkles className="w-5 h-5 text-[#95d5b2]" />
                          </div>
                          <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Match Suggestion</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-[#95d5b2]">{selectedDonation.matchScore}</span>
                          <span className="text-[10px] font-black text-[#95d5b2]/60 uppercase">% Match</span>
                        </div>
                      </div>
                    <p className="break-words text-sm sm:text-base font-medium text-white/90 leading-relaxed tracking-tight italic">
                        "{selectedDonation.matchReason}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40">Pickup Window</span>
                    <div className="flex items-center gap-3 text-sm font-black text-fb-on-surface bg-fb-surface-container-low p-4 rounded-2xl border border-fb-outline-variant/5">
                      <Timer className="w-5 h-5 text-fb-primary" />
                      {new Date(selectedDonation.pickupStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <ChevronRight className="w-4 h-4 opacity-20" />
                      {new Date(selectedDonation.pickupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {selectedDonation.notes && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-40">Notes</span>
                      <p className="whitespace-pre-wrap break-words text-xs font-medium text-fb-on-surface-variant bg-fb-surface-container-low p-4 rounded-2xl border border-fb-outline-variant/5 italic leading-relaxed">
                        {selectedDonation.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    variant="outline"
                    className="h-16 flex-1 rounded-[1.5rem] border-fb-outline-variant/20 text-xs font-black uppercase tracking-widest hover:bg-fb-surface-container transition-all"
                    onClick={() => setSelectedDonation(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className="h-16 flex-1 rounded-[1.5rem] bg-[#0f5238] text-white hover:bg-[#1b4332] shadow-ambient-3 active:scale-[0.98] transition-all text-xs font-black uppercase tracking-widest gap-3"
                    onClick={() => handleAccept(selectedDonation.id)}
                    disabled={loading === selectedDonation.id}
                  >
                    {loading === selectedDonation.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Accept Donation
                        <ArrowUpRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DonationCard({ donation, onClick }: { donation: EnrichedDonation; onClick: () => void }) {
  const isCompleted = donation.status === 'delivered';
  
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "group cursor-pointer bg-white border border-fb-outline-variant/10 rounded-[2rem] shadow-sm hover:shadow-md hover:translate-y-[-4px] transition-all duration-500 relative overflow-hidden flex flex-col h-full min-w-0",
        isCompleted ? "opacity-60 grayscale-[0.6] hover:grayscale-0 hover:opacity-100" : "hover:border-fb-primary/20"
      )}
    >
      {donation.photoUrl && (
        <img src={donation.photoUrl} alt={donation.title} className="h-40 w-full object-cover" />
      )}
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <UrgencyBadge urgency={donation.urgency} className="h-5 px-3 text-[9px] font-black" />
            {donation.status !== 'open' && donation.status !== 'matched' && (
              <StatusBadge status={donation.status} className="h-5 px-3 text-[9px] font-black border-none" />
            )}
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-fb-primary/5 rounded-full border border-fb-primary/10">
            <Sparkles className="w-3.5 h-3.5 text-fb-primary animate-pulse" />
            <span className="text-[10px] font-black text-fb-primary">{donation.matchScore || 85}%</span>
          </div>
        </div>

        <h3 className={cn(
          "text-lg font-black text-fb-on-surface tracking-tight leading-[1.2] mb-4 break-words transition-colors",
          isCompleted ? "text-fb-on-surface-variant" : "group-hover:text-fb-primary"
        )}>
          {donation.title}
        </h3>

        <div className="grid grid-cols-1 gap-3 mb-5 sm:grid-cols-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-fb-surface-container group-hover:bg-fb-primary/5 transition-colors">
              <Package className="w-3.5 h-3.5 text-fb-on-surface-variant opacity-60" />
            </div>
            <span className="min-w-0 break-words text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest">{donation.quantity} {donation.unit}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-fb-surface-container group-hover:bg-fb-primary/5 transition-colors">
              <Clock className="w-3.5 h-3.5 text-fb-on-surface-variant opacity-60" />
            </div>
            <span className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest">{categoryLabels[donation.category]}</span>
          </div>
        </div>
        {donation.notes && (
          <p className="mb-5 line-clamp-2 break-words rounded-2xl bg-fb-surface-container-low p-3 text-[11px] font-semibold leading-relaxed text-fb-on-surface-variant">
            {donation.notes}
          </p>
        )}
        {donation.foodSourceName && (
          <div className="mb-5 rounded-2xl border border-fb-primary/10 bg-fb-primary/5 p-3">
            <p className="text-[8px] font-black uppercase tracking-widest text-fb-primary/60">Food Source</p>
            <p className="mt-1 line-clamp-1 break-words text-[11px] font-black text-fb-on-surface">{donation.foodSourceName}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-fb-outline-variant/5 mt-auto">
          <div className="flex items-start gap-2 min-w-0">
            <div className={cn(
              "mt-1 w-2 h-2 shrink-0 rounded-full transition-colors",
              isCompleted ? "bg-zinc-300" : "bg-fb-primary/40 group-hover:bg-fb-primary"
            )} />
            <span className="min-w-0 break-words text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest leading-snug">{donation.locationName}</span>
          </div>
          <ArrowUpRight className={cn(
            "w-5 h-5 transition-all",
            isCompleted ? "text-fb-on-surface-variant opacity-20" : "text-fb-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1"
          )} />
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="min-w-0 space-y-2 rounded-2xl bg-white/70 p-4">
      <div className="flex items-center gap-2 text-[10px] font-black text-fb-on-surface-variant uppercase tracking-[0.2em] opacity-40">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="break-words text-sm font-black text-fb-on-surface leading-snug">{value}</p>
    </div>
  );
}
