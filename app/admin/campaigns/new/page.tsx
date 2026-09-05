'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    campaign_type: 'campaign',
    status: 'draft',
    featured_image_url: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kunde inte skapa kampanjen');
      router.push('/admin/campaigns');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Kunde inte skapa kampanjen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">Ny kampanj</h1>
        <p className="mt-3 text-gray-600">Skapa en kampanj, landningssida eller ett blogginlägg.</p>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold text-gray-700">Titel
            <input required value={form.title} onChange={(event) => updateField('title', event.target.value)} className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
          </label>
          <label className="block text-sm font-semibold text-gray-700">Slug
            <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => updateField('slug', event.target.value)} placeholder="sommar-kampanj" className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-gray-700">Typ
              <select value={form.campaign_type} onChange={(event) => updateField('campaign_type', event.target.value)} className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3">
                <option value="campaign">Kampanj</option><option value="blog">Blogg</option><option value="landing_page">Landningssida</option><option value="promotion">Erbjudande</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-gray-700">Status
              <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3">
                <option value="draft">Utkast</option><option value="published">Publicerad</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-semibold text-gray-700">Beskrivning
            <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={3} className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
          </label>
          <label className="block text-sm font-semibold text-gray-700">Innehåll
            <textarea value={form.content} onChange={(event) => updateField('content', event.target.value)} rows={10} className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
          </label>
          <label className="block text-sm font-semibold text-gray-700">Featured image URL
            <input type="url" value={form.featured_image_url} onChange={(event) => updateField('featured_image_url', event.target.value)} className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3" />
          </label>
          <div className="flex gap-3">
            <button disabled={saving} className="rounded-xl bg-primary-900 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Sparar...' : 'Skapa kampanj'}</button>
            <Link href="/admin/campaigns" className="rounded-xl border-2 border-gray-200 px-5 py-3 font-semibold text-gray-700">Avbryt</Link>
          </div>
        </form>
      </div>
    </main>
  );
}