'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

export default function AdminBlogPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    image_url: '',
    published: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/admin/blog');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blog');
      const data = await res.json();
      setPosts(data.posts || []);
      setLoadingPosts(false);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setLoadingPosts(false);
    }
  };

  const handleCreate = () => {
    setEditingPost(null);
    setForm({ title: '', content: '', excerpt: '', image_url: '', published: false });
    setShowEditor(true);
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      image_url: post.image_url || '',
      published: post.published,
    });
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta inlägg?')) return;

    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPost ? `/api/blog/${editingPost.id}` : '/api/blog';
      const method = editingPost ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowEditor(false);
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Blogg-hantering</h1>
          <button
            onClick={handleCreate}
            className="bg-primary-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-600 transition"
          >
            + Nytt inlägg
          </button>
        </div>

        {showEditor ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingPost ? 'Redigera inlägg' : 'Nytt inlägg'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rubrik *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Innehåll *</label>
                <div className="mb-2 text-xs text-gray-500">
                  Använd HTML-taggar för formatering: &lt;h2&gt;, &lt;h3&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;p&gt;, &lt;br&gt;, &lt;img src="..."&gt;
                </div>
                <textarea
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sammanfattning</label>
                <input
                  type="text"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bild-URL</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="w-5 h-5 accent-primary-900 rounded"
                />
                <label htmlFor="published" className="text-sm font-semibold text-gray-700">
                  Publicerad
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-primary-300 transition"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-900 text-white py-3 rounded-xl font-bold hover:bg-primary-600 transition"
                >
                  Spara
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {loadingPosts ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin mx-auto" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <p className="text-gray-600">Inga blogginlägg än.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rubrik</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Datum</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {posts.map((post) => (
                      <tr key={post.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{post.title}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            post.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {post.published ? 'Publicerad' : 'Utkast'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(post.created_at).toLocaleDateString('sv-SE')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(post)}
                            className="text-primary-900 hover:text-primary-600 font-semibold text-sm mr-3"
                          >
                            Redigera
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-red-600 hover:text-red-700 font-semibold text-sm"
                          >
                            Ta bort
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
