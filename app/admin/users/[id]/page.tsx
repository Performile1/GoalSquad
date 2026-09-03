'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { AlertIcon, BuildingIcon, CommunityIcon, MoneyIcon, OrdersIcon, UserIcon } from '@/app/components/BrandIcons';

interface UserDetail {
  profile: { id: string; email: string; full_name: string | null; display_name: string | null; avatar_url: string | null; role: string; is_active: boolean; is_verified: boolean; created_at: string; updated_at: string | null };
  stats: { orders: number; totalSpent: number; achievements: number; totalXp: number };
  recentOrders: { id: string; total_amount: number; status: string; created_at: string }[];
  entities: { seller: { id: string; full_name: string } | null; merchant: { id: string; merchant_name: string } | null; community: { id: string; name: string } | null; warehouse: { id: string; partner_name: string } | null };
}

const roleLabels: Record<string, string> = { gs_admin: 'Admin', merchant: 'Företag', seller: 'Säljare', community: 'Förening', warehouse: 'Lagerpartner', guardian: 'Vårdnadshavare', user: 'Användare' };

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<UserDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/api/admin/users/${id}`).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Kunde inte hämta användaren');
      setData(result);
    }).catch((reason) => setError(reason.message));
  }, [id]);

  if (error) return <div className="min-h-screen bg-[#F4F6F5] p-6"><div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-8 text-center"><AlertIcon size={40} className="mx-auto text-red-500" /><h1 className="mt-4 text-xl font-black text-slate-900">Användaren kunde inte hämtas</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link href="/admin/users" className="btn-primary mt-6">Till användarlistan</Link></div></div>;
  if (!data) return <div className="flex min-h-screen items-center justify-center bg-[#F4F6F5] text-sm font-semibold text-[#003B3D]">Laddar användarprofil...</div>;

  const { profile, stats, entities } = data;
  const name = profile.display_name || profile.full_name || profile.email;
  const connected = [entities.seller && `Säljare: ${entities.seller.full_name}`, entities.merchant && `Företag: ${entities.merchant.merchant_name}`, entities.community && `Förening: ${entities.community.name}`, entities.warehouse && `Lager: ${entities.warehouse.partner_name}`].filter(Boolean);
  const cards = [{ label: 'Ordrar', value: stats.orders, icon: OrdersIcon }, { label: 'Handlat', value: `${stats.totalSpent.toLocaleString('sv-SE')} kr`, icon: MoneyIcon }, { label: 'XP', value: stats.totalXp.toLocaleString('sv-SE'), icon: UserIcon }, { label: 'Prestationer', value: stats.achievements, icon: BuildingIcon }];

  return <div className="min-h-screen bg-[#F4F6F5] p-4 sm:p-6 lg:p-10"><div className="mx-auto max-w-6xl space-y-6"><Link href="/admin/users" className="text-sm font-bold text-[#003B3D] hover:text-[#B68B2C]">← Alla användare</Link><header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-[#003B3D] text-2xl font-black text-[#FFD700]">{profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : name[0].toUpperCase()}</div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B68B2C]">Användarprofil</p><h1 className="mt-1 text-2xl font-black text-slate-900">{name}</h1><p className="text-sm text-slate-500">{profile.email}</p></div></div><div className="flex flex-wrap gap-2"><span className="badge-petrol">{roleLabels[profile.role] || profile.role}</span><span className={profile.is_active ? 'badge-gold' : 'rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700'}>{profile.is_active ? 'Aktiv' : 'Inaktiv'}</span>{profile.is_verified && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Verifierad</span>}</div></div></header><section className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map((card) => <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><card.icon size={23} className="icon-brand" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</p><p className="mt-1 text-2xl font-black text-slate-900">{card.value}</p></div>)}</section><section className="grid gap-6 lg:grid-cols-[1fr_320px]"><div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-center gap-2"><OrdersIcon size={22} className="icon-brand" /><h2 className="text-lg font-black text-slate-900">Senaste ordrar</h2></div>{data.recentOrders.length ? <div className="divide-y divide-slate-100">{data.recentOrders.map((order) => <div key={order.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-bold text-slate-800">Order #{order.id.slice(0, 8)}</p><p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString('sv-SE')}</p></div><div className="text-right"><p className="text-sm font-black text-[#003B3D]">{Number(order.total_amount || 0).toLocaleString('sv-SE')} kr</p><p className="text-xs text-slate-500">{order.status}</p></div></div>)}</div> : <p className="py-8 text-sm text-slate-500">Inga ordrar registrerade.</p>}</div><aside className="rounded-xl border border-slate-200 bg-[#003B3D] p-6 text-white shadow-sm"><div className="flex items-center gap-2"><CommunityIcon size={22} className="text-[#FFD700]" /><h2 className="text-lg font-black">Kopplingar</h2></div>{connected.length ? <ul className="mt-5 space-y-3 text-sm font-semibold">{connected.map((item) => <li key={item as string} className="border-b border-white/10 pb-3">{item}</li>)}</ul> : <p className="mt-5 text-sm text-white/70">Ingen kopplad verksamhet.</p>}<div className="mt-7 border-t border-white/10 pt-5 text-xs text-white/60">Registrerad {new Date(profile.created_at).toLocaleDateString('sv-SE')}</div></aside></section></div></div>;
}
