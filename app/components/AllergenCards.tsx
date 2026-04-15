'use client';

import { motion } from 'framer-motion';

export interface Allergen {
  id: string;
  name: string;
  emoji: string;
  severity: 'contains' | 'may_contain' | 'free';
  description?: string;
}

interface AllergenCardsProps {
  allergens: Allergen[];
  mode?: 'display' | 'select';
  onToggle?: (allergenId: string, severity: 'contains' | 'may_contain' | 'free') => void;
}

export const COMMON_ALLERGENS: Omit<Allergen, 'severity'>[] = [
  { id: 'milk', name: 'Mjölk', emoji: '🥛', description: 'Mjölkprotein och laktos' },
  { id: 'eggs', name: 'Ägg', emoji: '🥚', description: 'Äggprotein' },
  { id: 'fish', name: 'Fisk', emoji: '🐟', description: 'Fiskprotein' },
  { id: 'shellfish', name: 'Skaldjur', emoji: '🦐', description: 'Räkor, krabba, hummer' },
  { id: 'nuts', name: 'Nötter', emoji: '🥜', description: 'Trädnötter (valnöt, mandel, etc)' },
  { id: 'peanuts', name: 'Jordnötter', emoji: '🥜', description: 'Jordnötsprotein' },
  { id: 'soy', name: 'Soja', emoji: '🫘', description: 'Sojaprotein' },
  { id: 'wheat', name: 'Vete', emoji: '🌾', description: 'Vetegluten' },
  { id: 'gluten', name: 'Gluten', emoji: '🌾', description: 'Gluten från spannmål' },
  { id: 'celery', name: 'Selleri', emoji: '🥬', description: 'Selleri och selleriprodukter' },
  { id: 'mustard', name: 'Senap', emoji: '🌭', description: 'Senap och senapsprodukter' },
  { id: 'sesame', name: 'Sesam', emoji: '🌰', description: 'Sesamfrön' },
  { id: 'lupin', name: 'Lupin', emoji: '🌱', description: 'Lupinfrön' },
  { id: 'sulfites', name: 'Svaveldioxid', emoji: '⚗️', description: 'Konserveringsmedel E220-E228' },
];

export default function AllergenCards({ allergens, mode = 'display', onToggle }: AllergenCardsProps) {
  if (mode === 'display') {
    return <DisplayMode allergens={allergens} />;
  }
  return <SelectMode allergens={allergens} onToggle={onToggle} />;
}

// Display mode - Show allergen warnings on product page
function DisplayMode({ allergens }: { allergens: Allergen[] }) {
  const contains = allergens.filter((a) => a.severity === 'contains');
  const mayContain = allergens.filter((a) => a.severity === 'may_contain');

  if (contains.length === 0 && mayContain.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Contains */}
      {contains.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
            ⚠️ Innehåller
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {contains.map((allergen, index) => (
              <motion.div
                key={allergen.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-red-50 border-2 border-red-500 rounded-xl p-4 text-center"
              >
                <div className="text-4xl mb-2">{allergen.emoji}</div>
                <div className="font-bold text-red-900 text-sm">{allergen.name}</div>
                {allergen.description && (
                  <div className="text-xs text-red-700 mt-1">{allergen.description}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* May Contain */}
      {mayContain.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-yellow-900 mb-3 flex items-center gap-2">
            ⚠️ Kan innehålla spår av
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {mayContain.map((allergen, index) => (
              <motion.div
                key={allergen.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-yellow-50 border-2 border-yellow-500 rounded-xl p-4 text-center"
              >
                <div className="text-4xl mb-2">{allergen.emoji}</div>
                <div className="font-bold text-yellow-900 text-sm">{allergen.name}</div>
                {allergen.description && (
                  <div className="text-xs text-yellow-700 mt-1">{allergen.description}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Select mode - Interactive selection for product creation
function SelectMode({ allergens, onToggle }: { allergens: Allergen[]; onToggle?: (id: string, severity: 'contains' | 'may_contain' | 'free') => void }) {
  const getAllergenSeverity = (id: string): 'contains' | 'may_contain' | 'free' => {
    const allergen = allergens.find((a) => a.id === id);
    return allergen?.severity || 'free';
  };

  const handleClick = (id: string) => {
    const current = getAllergenSeverity(id);
    let next: 'contains' | 'may_contain' | 'free';
    
    if (current === 'free') next = 'contains';
    else if (current === 'contains') next = 'may_contain';
    else next = 'free';

    if (onToggle) onToggle(id, next);
  };

  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900 font-semibold mb-2">
          💡 Klicka på allergener för att markera:
        </p>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Innehåller</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Kan innehålla spår</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>Fri från</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {COMMON_ALLERGENS.map((allergen) => {
          const severity = getAllergenSeverity(allergen.id);
          
          let bgColor = 'bg-gray-100 border-gray-300';
          let textColor = 'text-gray-700';
          let borderColor = 'border-gray-300';
          
          if (severity === 'contains') {
            bgColor = 'bg-red-50 border-red-500';
            textColor = 'text-red-900';
            borderColor = 'border-red-500';
          } else if (severity === 'may_contain') {
            bgColor = 'bg-yellow-50 border-yellow-500';
            textColor = 'text-yellow-900';
            borderColor = 'border-yellow-500';
          }

          return (
            <button
              key={allergen.id}
              type="button"
              onClick={() => handleClick(allergen.id)}
              className={`${bgColor} border-2 ${borderColor} rounded-xl p-4 text-center hover:shadow-lg transition cursor-pointer`}
            >
              <div className="text-4xl mb-2">{allergen.emoji}</div>
              <div className={`font-bold text-sm ${textColor}`}>{allergen.name}</div>
              {severity !== 'free' && (
                <div className="text-xs mt-2 font-semibold">
                  {severity === 'contains' ? '⚠️ Innehåller' : '⚠️ Spår'}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact allergen badges for product cards
export function AllergenBadges({ allergens }: { allergens: Allergen[] }) {
  const contains = allergens.filter((a) => a.severity === 'contains');
  
  if (contains.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {contains.slice(0, 4).map((allergen) => (
        <div
          key={allergen.id}
          className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
          title={allergen.description}
        >
          <span>{allergen.emoji}</span>
          <span>{allergen.name}</span>
        </div>
      ))}
      {contains.length > 4 && (
        <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
          +{contains.length - 4} fler
        </div>
      )}
    </div>
  );
}

// Free-from badges (marketing feature)
export function FreeFromBadges({ allergens }: { allergens: Allergen[] }) {
  const freeFrom = COMMON_ALLERGENS.filter(
    (common) => !allergens.some((a) => a.id === common.id && a.severity !== 'free')
  );

  // Show top free-from allergens
  const topFreeFrom = freeFrom.filter((a) => 
    ['gluten', 'milk', 'nuts', 'soy'].includes(a.id)
  );

  if (topFreeFrom.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {topFreeFrom.map((allergen) => (
        <div
          key={allergen.id}
          className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
        >
          <span>✓</span>
          <span>{allergen.emoji}</span>
          <span>Fri från {allergen.name.toLowerCase()}</span>
        </div>
      ))}
    </div>
  );
}
