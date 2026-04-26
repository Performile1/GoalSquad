'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, UserIcon, CommunityIcon, ShopIcon, OrdersIcon, NoImagePlaceholder } from '@/app/components/BrandIcons';
import { useSearchParams } from 'next/navigation';
import debounce from 'lodash/debounce';

interface SearchResult {
  id: string;
  type: 'seller' | 'community' | 'product';
  name: string;
  description: string;
  imageUrl?: string;
  metadata: any;
  rank: number;
}

type SearchType = 'all' | 'sellers' | 'communities' | 'products';

export const dynamic = 'force-dynamic';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, type: SearchType) => {
      if (searchQuery.length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/search/advanced?q=${encodeURIComponent(searchQuery)}&type=${type}`
        );
        const data = await response.json();
        setResults(data.results || []);
        setHasSearched(true);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query, searchType);
  }, [query, searchType, debouncedSearch]);

  const groupedResults = {
    sellers: results.filter((r) => r.type === 'seller'),
    communities: results.filter((r) => r.type === 'community'),
    products: results.filter((r) => r.type === 'product'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-4"><SearchIcon size={48} /></div>
          <h1 className="text-4xl font-bold text-center mb-6">Sök på GoalSquad</h1>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök efter säljare, föreningar eller produkter..."
                className="w-full px-6 py-4 pr-14 rounded-2xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-primary-300 shadow-xl"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                <SearchIcon size={24} />
              </span>
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {[
                { value: 'all', label: 'Allt', icon: <ShopIcon size={16} /> },
                { value: 'sellers', label: 'Säljare', icon: <UserIcon size={16} /> },
                { value: 'communities', label: 'Föreningar', icon: <CommunityIcon size={16} /> },
                { value: 'products', label: 'Produkter', icon: <OrdersIcon size={16} /> },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSearchType(type.value as SearchType)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
                    searchType === type.value
                      ? 'bg-white text-primary-900 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center animate-bounce"><SearchIcon size={64} /></div>
            <p className="text-xl text-gray-600">Söker...</p>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center"><SearchIcon size={64} /></div>
            <p className="text-xl text-gray-600">
              Skriv minst 2 tecken för att söka
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center opacity-40"><SearchIcon size={64} /></div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              Inga resultat hittades
            </p>
            <p className="text-gray-600">
              Försök med andra sökord eller filtrera annorlunda
            </p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Sellers */}
            {groupedResults.sellers.length > 0 && (
              <ResultSection
                title="Säljare"
                emoji=""
                results={groupedResults.sellers}
                renderResult={renderSellerResult}
              />
            )}

            {/* Communities */}
            {groupedResults.communities.length > 0 && (
              <ResultSection
                title="Föreningar"
                emoji=""
                results={groupedResults.communities}
                renderResult={renderCommunityResult}
              />
            )}

            {/* Products */}
            {groupedResults.products.length > 0 && (
              <ResultSection
                title="Produkter"
                emoji=""
                results={groupedResults.products}
                renderResult={renderProductResult}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection({
  title,
  emoji,
  results,
  renderResult,
}: {
  title: string;
  emoji: string;
  results: SearchResult[];
  renderResult: (result: SearchResult, index: number) => React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-primary-900">{emoji}</span>
        {title} <span className="text-gray-400 font-normal">({results.length})</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => renderResult(result, index))}
      </div>
    </div>
  );
}

function renderSellerResult(result: SearchResult, index: number) {
  return (
    <motion.a
      key={result.id}
      href={`/shop/${result.metadata.shopUrl || result.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6 block"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center text-white font-bold flex-shrink-0">
          {result.imageUrl ? (
            <img
              src={result.imageUrl}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            result.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
            {result.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{result.description}</p>
          <p className="text-xs text-gray-500">
            {result.metadata.communityName}
          </p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="bg-primary-50 text-primary-900 px-3 py-1 rounded-full font-semibold">
              {parseFloat(result.metadata.totalSales).toLocaleString()} kr
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

function renderCommunityResult(result: SearchResult, index: number) {
  return (
    <motion.a
      key={result.id}
      href={`/communities/${result.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6 block"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center flex-shrink-0 text-white">
          {result.imageUrl ? (
            <img
              src={result.imageUrl}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <CommunityIcon size={32} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
            {result.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{result.description}</p>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">
              {result.metadata.totalMembers} medlemmar
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

function renderProductResult(result: SearchResult, index: number) {
  return (
    <motion.a
      key={result.id}
      href={`/products/${result.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition overflow-hidden block"
    >
      <div className="h-48 overflow-hidden">
        {result.imageUrl ? (
          <img
            src={result.imageUrl}
            alt={result.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <NoImagePlaceholder width={400} height={192} className="w-full h-full" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
          {result.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {result.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-primary-900">
            {parseFloat(result.metadata.price).toLocaleString()} kr
          </span>
          <span className="text-xs text-gray-500">
            {result.metadata.merchantName}
          </span>
        </div>
        {result.metadata.stock > 0 ? (
          <div className="mt-3 bg-primary-50 text-primary-900 px-3 py-1 rounded-full text-xs font-semibold inline-block">
            I lager
          </div>
        ) : (
          <div className="mt-3 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold inline-block">
            Slut i lager
          </div>
        )}
      </div>
    </motion.a>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar sökning...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
