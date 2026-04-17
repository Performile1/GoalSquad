'use client';

import { useState, useEffect } from 'react';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog')
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Blog</h1>
        
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600">Inga blogginlägg än.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {post.image_url && (
                  <img src={post.image_url} alt={post.title} className="w-full h-64 object-cover" />
                )}
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h2>
                  <div className="text-gray-600 mb-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                  <p className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
