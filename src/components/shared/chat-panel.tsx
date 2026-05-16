'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { validatePreparedAt } from '@/lib/food-safety';
import {
  X,
  Sparkles,
  Leaf,
  User,
  Loader2,
  Zap,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  Camera,
  BarChart3,
  Route,
} from 'lucide-react';
import { FoodCategory, Urgency, UserRole } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type WizardStep =
  | 'title'
  | 'food'
  | 'prepared'
  | 'quantity'
  | 'location'
  | 'window'
  | 'urgency'
  | 'vegetarian'
  | 'notes'
  | 'confirm';

type DonationDraft = {
  title?: string;
  category?: FoodCategory;
  foodType?: string;
  preparedAt?: string;
  quantity?: number;
  unit?: string;
  locationName?: string;
  pickupStart?: string;
  pickupEnd?: string;
  urgency?: Urgency;
  isVegetarian?: boolean;
  notes?: string;
  latitude?: number;
  longitude?: number;
};

type WizardState = {
  active: boolean;
  step: WizardStep;
  draft: DonationDraft;
};

const rolePrompts: Record<UserRole, { text: string; icon: React.ReactNode }[]> = {
  donor: [
    { text: 'Help me create a donation', icon: <Zap className="w-3 h-3" /> },
    { text: 'Can I edit my donation?', icon: <Sparkles className="w-3 h-3" /> },
    { text: 'What photo should I upload?', icon: <Camera className="w-3 h-3" /> },
    { text: 'What details are needed?', icon: <MessageSquare className="w-3 h-3" /> },
  ],
  ngo: [
    { text: "Give me today's donation update", icon: <BarChart3 className="w-3 h-3" /> },
    { text: 'Which donation should I accept first?', icon: <Zap className="w-3 h-3" /> },
    { text: 'Explain donation zones', icon: <Sparkles className="w-3 h-3" /> },
    { text: 'Explain match score', icon: <MessageSquare className="w-3 h-3" /> },
  ],
  delivery: [
    { text: 'What should I do next?', icon: <Route className="w-3 h-3" /> },
    { text: 'Explain my route', icon: <Sparkles className="w-3 h-3" /> },
    { text: 'How do I update delivery status?', icon: <MessageSquare className="w-3 h-3" /> },
    { text: 'Which pickup is urgent?', icon: <Zap className="w-3 h-3" /> },
  ],
};

const categoryAliases: Record<FoodCategory, string[]> = {
  cooked_meals: ['cooked', 'meal', 'meals', 'biryani', 'rice', 'lunch', 'dinner', 'breakfast', 'idli', 'vada', 'paneer'],
  bakery: ['bakery', 'pastry', 'pastries', 'bread', 'cake', 'bun'],
  fresh_produce: ['fruit', 'vegetable', 'produce', 'salad', 'fresh'],
  packaged: ['packaged', 'pack', 'packs', 'box', 'boxes', 'sandwich'],
  dairy: ['dairy', 'milk', 'curd', 'yogurt', 'paneer'],
  beverages: ['beverage', 'drink', 'juice', 'bottle', 'tea', 'coffee'],
  other: ['other', 'misc'],
};

const areaCoordinates: Record<string, { lat: number; lng: number }> = {
  koramangala: { lat: 12.9352, lng: 77.6245 },
  indiranagar: { lat: 12.9784, lng: 77.6408 },
  jayanagar: { lat: 12.9250, lng: 77.5938 },
  whitefield: { lat: 12.9698, lng: 77.7500 },
  'hsr layout': { lat: 12.9121, lng: 77.6446 },
  'mg road': { lat: 12.9758, lng: 77.6068 },
  'electronic city': { lat: 12.8452, lng: 77.6602 },
  'jp nagar': { lat: 12.9063, lng: 77.5857 },
  malleshwaram: { lat: 13.0031, lng: 77.5643 },
  marathahalli: { lat: 12.9569, lng: 77.7011 },
  hebbal: { lat: 13.0358, lng: 77.5970 },
};

const introByRole: Record<UserRole, string> = {
  donor: "Hello! I'm Sharebite AI. I can guide you through creating a donation, explain edit/delete rules, and help choose useful food details.",
  ngo: "Hello! I'm Sharebite AI. I can summarize live marketplace data, explain donation zones, and help you decide what to accept first.",
  delivery: "Hello! I'm Sharebite AI. I can help with your next pickup, route priority, Google Maps links, and delivery status updates.",
};

const createIntent = (text: string) => {
  const normalized = text.toLowerCase();
  return normalized.includes('help me create') || normalized.includes('create a donation') || normalized.includes('new donation');
};

const parseFood = (text: string): Pick<DonationDraft, 'category' | 'foodType'> => {
  const lower = text.toLowerCase();
  const category = (Object.entries(categoryAliases).find(([, aliases]) => aliases.some((alias) => lower.includes(alias)))?.[0] || 'other') as FoodCategory;
  const foodType = text
    .replace(/cooked meals?/i, '')
    .replace(/fresh produce/i, '')
    .replace(/packaged/i, '')
    .replace(/bakery/i, '')
    .replace(/beverages?/i, '')
    .replace(/dairy/i, '')
    .replace(/[-:]/g, ' ')
    .trim();

  return {
    category,
    foodType: foodType || category.replace('_', ' '),
  };
};

const parseQuantity = (text: string) => {
  const match = text.match(/(\d+)\s*([a-zA-Z ]+)?/);
  if (!match) return null;
  return {
    quantity: Number(match[1]),
    unit: (match[2] || 'meals').trim().toLowerCase(),
  };
};

const parsePreparedAt = (text: string) => {
  const now = new Date();
  const lower = text.toLowerCase().trim();
  const hoursAgo = lower.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|hrs|hours)\s*ago/);
  const daysAgo = lower.match(/(\d+(?:\.\d+)?)\s*(?:day|days)\s*ago/);

  if (lower === 'now' || lower.includes('just now')) {
    return now.toISOString();
  }

  if (hoursAgo) {
    return new Date(now.getTime() - Number(hoursAgo[1]) * 3600000).toISOString();
  }

  if (daysAgo) {
    return new Date(now.getTime() - Number(daysAgo[1]) * 86400000).toISOString();
  }

  const explicit = lower.match(/(?:(today|yesterday)\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (explicit) {
    let hour = Number(explicit[2]);
    const minutes = Number(explicit[3] || 0);
    const meridiem = explicit[4];
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    const date = new Date(now);
    if (explicit[1] === 'yesterday') date.setDate(date.getDate() - 1);
    date.setHours(hour, minutes, 0, 0);
    return date.toISOString();
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

const parsePickupWindow = (text: string) => {
  const now = new Date();
  const lower = text.toLowerCase();
  const range = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  const single = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);

  const toDate = (hourText: string, minuteText?: string, meridiem?: string) => {
    let hour = Number(hourText);
    const minutes = Number(minuteText || 0);
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    const date = new Date(now);
    date.setHours(hour, minutes, 0, 0);
    if (date.getTime() < now.getTime() - 30 * 60000) {
      date.setDate(date.getDate() + 1);
    }
    return date;
  };

  if (range) {
    const start = toDate(range[1], range[2], range[3] || range[6]);
    const end = toDate(range[4], range[5], range[6] || range[3]);
    if (end <= start) end.setDate(end.getDate() + 1);
    return { pickupStart: start.toISOString(), pickupEnd: end.toISOString() };
  }

  if (single) {
    const start = toDate(single[1], single[2], single[3]);
    const end = new Date(start.getTime() + 2 * 3600000);
    return { pickupStart: start.toISOString(), pickupEnd: end.toISOString() };
  }

  if (lower.includes('morning')) {
    const start = new Date(now);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(11, 0, 0, 0);
    return { pickupStart: start.toISOString(), pickupEnd: end.toISOString() };
  }

  if (lower.includes('afternoon')) {
    const start = new Date(now);
    start.setHours(13, 0, 0, 0);
    const end = new Date(start);
    end.setHours(15, 0, 0, 0);
    return { pickupStart: start.toISOString(), pickupEnd: end.toISOString() };
  }

  const start = new Date(now.getTime() + 60 * 60000);
  const end = new Date(start.getTime() + 2 * 3600000);
  return { pickupStart: start.toISOString(), pickupEnd: end.toISOString() };
};

const detectArea = (text: string) => {
  const lower = text.toLowerCase();
  const area = Object.keys(areaCoordinates).find((name) => lower.includes(name));
  return area ? areaCoordinates[area] : { lat: 12.9716, lng: 77.5946 };
};

const formatWindow = (start?: string, end?: string) => {
  if (!start || !end) return 'Not set';
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(start).toLocaleTimeString([], options)} to ${new Date(end).toLocaleTimeString([], options)}`;
};

const summarizeDraft = (draft: DonationDraft) => (
  `Donation summary:\n` +
  `Title: ${draft.title}\n` +
  `Food: ${draft.foodType} (${draft.category?.replace('_', ' ')})\n` +
  `Cooked/prepared: ${draft.preparedAt ? new Date(draft.preparedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set'}\n` +
  `Quantity: ${draft.quantity} ${draft.unit}\n` +
  `Pickup: ${draft.locationName}\n` +
  `Window: ${formatWindow(draft.pickupStart, draft.pickupEnd)}\n` +
  `Urgency: ${draft.urgency}\n` +
  `Vegetarian: ${draft.isVegetarian ? 'Yes' : 'No'}\n` +
  `Notes: ${draft.notes || 'None'}\n\n` +
  `Type "confirm" to create it, or "cancel" to discard. You can add or replace a food photo from the donation form after creating it.`
);

export function ChatPanel({ onClose, userRole }: { onClose: () => void; userRole: UserRole }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: introByRole[userRole],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [wizard, setWizard] = useState<WizardState>({ active: false, step: 'title', draft: {} });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const addAssistantMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: 'assistant', content }]);
  };

  const startDonationWizard = () => {
    setWizard({ active: true, step: 'title', draft: {} });
    addAssistantMessage(
      'Great. I will collect the donation details step by step and create a clean donation row only after you confirm.\n\nWhat is the food name or donation title?'
    );
  };

  const createDonationFromDraft = async (draft: DonationDraft) => {
    setLoading(true);
    try {
      const expiresAt = draft.pickupEnd ? new Date(new Date(draft.pickupEnd).getTime() + 4 * 3600000).toISOString() : undefined;
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          donation: {
            title: draft.title,
            category: draft.category,
            foodType: draft.foodType,
            quantity: draft.quantity,
            unit: draft.unit,
            urgency: draft.urgency,
            preparedAt: draft.preparedAt,
            expiresAt,
            pickupStart: draft.pickupStart,
            pickupEnd: draft.pickupEnd,
            locationName: draft.locationName,
            latitude: draft.latitude,
            longitude: draft.longitude,
            notes: draft.notes || '',
            isVegetarian: draft.isVegetarian,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        addAssistantMessage(data.error || 'I could not create this donation. Please check the details and try again.');
        return;
      }

      setWizard({ active: false, step: 'title', draft: {} });
      addAssistantMessage(
        `Created "${data.donation.title}" successfully. It is now open for NGOs, and match suggestions were generated. Refresh the donor dashboard or marketplace to see it.`
      );
      router.refresh();
    } catch {
      addAssistantMessage('I could not create the donation because the app connection failed. Your draft was not saved.');
    } finally {
      setLoading(false);
    }
  };

  const handleWizardInput = async (text: string) => {
    const lower = text.toLowerCase();
    if (lower === 'cancel' || lower === 'stop') {
      setWizard({ active: false, step: 'title', draft: {} });
      addAssistantMessage('Cancelled the donation draft. Nothing was created.');
      return;
    }

    const draft = { ...wizard.draft };

    if (wizard.step === 'title') {
      draft.title = text;
      setWizard({ active: true, step: 'food', draft });
      addAssistantMessage('What food type/category is this? Example: "cooked meals - Veg biryani" or "bakery - pastries".');
      return;
    }

    if (wizard.step === 'food') {
      Object.assign(draft, parseFood(text));
      setWizard({ active: true, step: 'prepared', draft });
      addAssistantMessage('When was the food cooked/prepared? Example: "now", "2 hours ago", or "today 10:30". Food older than 24 hours cannot be donated.');
      return;
    }

    if (wizard.step === 'prepared') {
      const preparedAt = parsePreparedAt(text);
      const preparedValidation = validatePreparedAt(preparedAt);
      if (!preparedValidation.ok) {
        addAssistantMessage(preparedValidation.error || 'Please enter a valid cooked/prepared time.');
        return;
      }
      draft.preparedAt = preparedAt;
      setWizard({ active: true, step: 'quantity', draft });
      addAssistantMessage('How much food is available? Example: "35 boxes", "18 items", or "22 cups".');
      return;
    }

    if (wizard.step === 'quantity') {
      const parsed = parseQuantity(text);
      if (!parsed || parsed.quantity <= 0) {
        addAssistantMessage('Please send the quantity with a unit, for example "35 boxes" or "12 bottles".');
        return;
      }
      Object.assign(draft, parsed);
      setWizard({ active: true, step: 'location', draft });
      addAssistantMessage('Where should the food be picked up? Please include the Bangalore area, for example "Koramangala Kitchen, 4th Block, Koramangala".');
      return;
    }

    if (wizard.step === 'location') {
      const coords = detectArea(text);
      draft.locationName = text.includes('Bangalore') ? text : `${text}, Bangalore`;
      draft.latitude = coords.lat;
      draft.longitude = coords.lng;
      setWizard({ active: true, step: 'window', draft });
      addAssistantMessage('What is the pickup window? Example: "6pm to 8pm", "14:00 to 16:00", "morning", or "afternoon".');
      return;
    }

    if (wizard.step === 'window') {
      Object.assign(draft, parsePickupWindow(text));
      setWizard({ active: true, step: 'urgency', draft });
      addAssistantMessage('What is the pickup urgency: low, medium, or high?');
      return;
    }

    if (wizard.step === 'urgency') {
      const urgency = lower.includes('high') || lower.includes('urgent') ? 'high' : lower.includes('low') ? 'low' : lower.includes('medium') ? 'medium' : undefined;
      if (!urgency) {
        addAssistantMessage('Please choose one urgency: low, medium, or high.');
        return;
      }
      draft.urgency = urgency;
      setWizard({ active: true, step: 'vegetarian', draft });
      addAssistantMessage('Is the food vegetarian? Please answer yes or no.');
      return;
    }

    if (wizard.step === 'vegetarian') {
      if (!['yes', 'y', 'no', 'n'].includes(lower)) {
        addAssistantMessage('Please answer yes or no for vegetarian.');
        return;
      }
      draft.isVegetarian = lower.startsWith('y');
      setWizard({ active: true, step: 'notes', draft });
      addAssistantMessage('Any optional notes for the NGO or delivery partner? Type "skip" if there are none.');
      return;
    }

    if (wizard.step === 'notes') {
      draft.notes = lower === 'skip' ? '' : text;
      setWizard({ active: true, step: 'confirm', draft });
      addAssistantMessage(summarizeDraft(draft));
      return;
    }

    if (wizard.step === 'confirm') {
      if (lower === 'confirm' || lower === 'yes') {
        await createDonationFromDraft(draft);
        return;
      }
      addAssistantMessage('Type "confirm" to create this donation, or "cancel" to discard it.');
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || sendingRef.current) return;
    sendingRef.current = true;

    const trimmed = text.trim();
    const userMsg: Message = { role: 'user', content: trimmed };
    const outboundMessages = [...messages, userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      if (wizard.active) {
        await handleWizardInput(trimmed);
        return;
      }

      if (userRole === 'donor' && createIntent(trimmed)) {
        startDonationWizard();
        return;
      }

      setLoading(true);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: userRole,
          messages: outboundMessages.map((m) => ({
            role: m.role,
            parts: [{ text: m.content }],
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'I could not fetch a Sharebite answer right now. Please try again.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sharebite AI could not connect. Please try again shortly.' },
      ]);
    } finally {
      setLoading(false);
      sendingRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-fb-primary/5 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between px-6 h-20 border-b border-fb-outline-variant/10 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#0f5238] shadow-lg rotate-3 transition-transform">
              <Sparkles className="w-5 h-5 text-[#95d5b2]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="font-black text-sm text-fb-on-surface tracking-tight uppercase">
              Sharebite AI
            </h2>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-black text-fb-primary uppercase tracking-[0.1em]">
                {userRole === 'ngo' ? 'NGO assistant' : userRole === 'delivery' ? 'Delivery assistant' : 'Donor assistant'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-2xl bg-fb-surface-container hover:bg-fb-surface-container-high transition-all text-fb-on-surface-variant group active:scale-95"
          aria-label="Close panel"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar relative z-10">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex gap-4 group', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
          >
            <div className="flex items-end shrink-0">
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110',
                msg.role === 'assistant' ? 'bg-[#0f5238] text-white' : 'bg-fb-surface-container-high text-fb-on-surface-variant'
              )}>
                {msg.role === 'assistant' ? <Leaf className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
            </div>

            <div
              className={cn(
                'max-w-[85%] whitespace-pre-wrap px-5 py-4 text-[13px] leading-relaxed relative transition-all shadow-sm',
                msg.role === 'assistant'
                  ? 'bg-fb-surface-container-lowest border border-fb-outline-variant/10 rounded-[1.5rem] rounded-bl-none text-fb-on-surface'
                  : 'bg-[#0f5238] text-white rounded-[1.5rem] rounded-br-none font-medium'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 items-end" aria-live="polite">
            <div className="w-8 h-8 rounded-xl bg-[#0f5238] flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="bg-fb-surface-container-lowest border border-fb-outline-variant/10 rounded-[1.5rem] rounded-bl-none px-5 py-4 shadow-sm">
              <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-fb-on-surface-variant/60">
                Sharebite AI is thinking...
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-fb-primary animate-bounce [animation-delay:0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-fb-primary animate-bounce [animation-delay:200ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-fb-primary animate-bounce [animation-delay:400ms]" />
              </div>
            </div>
          </div>
        )}

        {messages.length <= 1 && !loading && (
          <div className="flex flex-col gap-3 pt-4 pl-12">
            <p className="text-[10px] font-black text-fb-on-surface-variant uppercase tracking-widest opacity-60">Suggested Questions</p>
            <div className="flex flex-col gap-2">
              {rolePrompts[userRole].map((qr) => (
                <button
                  key={qr.text}
                  onClick={() => sendMessage(qr.text)}
                  disabled={loading}
                  className="flex items-center justify-between w-fit px-5 py-2.5 bg-white border border-fb-outline-variant/20 rounded-2xl text-[11px] font-black text-fb-on-surface hover:border-fb-primary hover:text-fb-primary hover:bg-fb-primary/5 hover:shadow-md transition-all group disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <span className="opacity-60">{qr.icon}</span>
                    {qr.text}
                  </div>
                  <ChevronRight className="w-3 h-3 ml-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-8 pt-4 border-t border-fb-outline-variant/10 bg-white shrink-0 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="relative flex items-center group"
        >
          <div className="absolute left-5 text-fb-on-surface-variant/40 group-focus-within:text-fb-primary transition-colors">
            <MessageSquare className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={wizard.active ? 'Reply to the donation wizard...' : 'Ask Sharebite AI...'}
            disabled={loading}
            className="w-full bg-fb-surface-container-lowest border border-fb-outline-variant/20 rounded-2xl py-4 pl-12 pr-16 text-[13px] text-fb-on-surface placeholder:text-fb-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-[#0f5238]/10 focus:border-fb-primary/30 transition-all disabled:opacity-60 shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={cn(
              'absolute right-2 w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95',
              input.trim() && !loading
                ? 'bg-[#0f5238] text-white shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-fb-surface-container-high text-fb-on-surface-variant/40 cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-[9px] text-center text-fb-on-surface-variant/40 mt-4 uppercase tracking-widest font-black">
          Role-aware Sharebite support chat
        </p>
      </div>
    </div>
  );
}
