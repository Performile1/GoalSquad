'use client';

import { motion } from 'framer-motion';
import {
  CertificationIcon,
  OrganicIcon,
  EcoIcon,
  RecycledIcon,
  FairTradeIcon,
  VeganIcon,
  GlutenFreeIcon,
} from './BrandIcons';

export interface Certification {
  id: string;
  name: string;
  icon?: string; // Emoji or image URL (deprecated)
  iconComponent?: React.ComponentType<{ size?: number; className?: string }>; // BrandIcon component
  color: string;
  description: string;
  category: 'food' | 'environmental' | 'ethical' | 'quality' | 'material';
}

export const CERTIFICATION_LIBRARY: Certification[] = [
  // Food & Dietary
  {
    id: 'organic',
    name: 'Ekologisk',
    iconComponent: OrganicIcon,
    color: '#10b981',
    description: 'EU-ekologisk certifiering',
    category: 'food',
  },
  {
    id: 'krav',
    name: 'KRAV',
    iconComponent: OrganicIcon,
    color: '#059669',
    description: 'KRAV-märkt ekologisk',
    category: 'food',
  },
  {
    id: 'gluten_free',
    name: 'Glutenfri',
    iconComponent: GlutenFreeIcon,
    color: '#f59e0b',
    description: 'Fri från gluten',
    category: 'food',
  },
  {
    id: 'vegan',
    name: 'Vegansk',
    iconComponent: VeganIcon,
    color: '#22c55e',
    description: '100% växtbaserad',
    category: 'food',
  },
  {
    id: 'vegetarian',
    name: 'Vegetarisk',
    iconComponent: VeganIcon,
    color: '#84cc16',
    description: 'Vegetarisk produkt',
    category: 'food',
  },
  {
    id: 'lactose_free',
    name: 'Laktosfri',
    color: '#3b82f6',
    description: 'Fri från laktos',
    category: 'food',
  },
  {
    id: 'sugar_free',
    name: 'Sockerfri',
    color: '#8b5cf6',
    description: 'Utan tillsatt socker',
    category: 'food',
  },

  // Ethical & Fair Trade
  {
    id: 'fairtrade',
    name: 'Fairtrade',
    iconComponent: FairTradeIcon,
    color: '#0ea5e9',
    description: 'Rättvis handel',
    category: 'ethical',
  },
  {
    id: 'rainforest_alliance',
    name: 'Rainforest Alliance',
    iconComponent: EcoIcon,
    color: '#059669',
    description: 'Hållbart jordbruk',
    category: 'ethical',
  },
  {
    id: 'utz',
    name: 'UTZ',
    iconComponent: EcoIcon,
    color: '#92400e',
    description: 'Hållbar odling',
    category: 'ethical',
  },

  // Environmental
  {
    id: 'msc',
    name: 'MSC',
    iconComponent: EcoIcon,
    color: '#0284c7',
    description: 'Hållbart fiske',
    category: 'environmental',
  },
  {
    id: 'asc',
    name: 'ASC',
    iconComponent: EcoIcon,
    color: '#06b6d4',
    description: 'Hållbar vattenbruk',
    category: 'environmental',
  },
  {
    id: 'fsc',
    name: 'FSC',
    iconComponent: EcoIcon,
    color: '#16a34a',
    description: 'Hållbart skogsbruk',
    category: 'environmental',
  },
  {
    id: 'svanen',
    name: 'Svanen',
    iconComponent: EcoIcon,
    color: '#0ea5e9',
    description: 'Nordisk miljömärkning',
    category: 'environmental',
  },
  {
    id: 'eu_ecolabel',
    name: 'EU Ecolabel',
    iconComponent: EcoIcon,
    color: '#3b82f6',
    description: 'EU:s miljömärke',
    category: 'environmental',
  },

  // Quality & Origin
  {
    id: 'swedish',
    name: 'Svenskt',
    iconComponent: CertificationIcon,
    color: '#0ea5e9',
    description: 'Producerat i Sverige',
    category: 'quality',
  },
  {
    id: 'norwegian',
    name: 'Norskt',
    iconComponent: CertificationIcon,
    color: '#dc2626',
    description: 'Producerat i Norge',
    category: 'quality',
  },
  {
    id: 'keyhole',
    name: 'Nyckelhålet',
    iconComponent: CertificationIcon,
    color: '#22c55e',
    description: 'Hälsosamt val',
    category: 'quality',
  },

  // Materials
  {
    id: 'cotton_100',
    name: '100% Bomull',
    color: '#f3f4f6',
    description: 'Ren bomull',
    category: 'material',
  },
  {
    id: 'organic_cotton',
    name: 'Ekologisk Bomull',
    iconComponent: OrganicIcon,
    color: '#10b981',
    description: 'GOTS-certifierad bomull',
    category: 'material',
  },
  {
    id: 'recycled',
    name: 'Återvunnet',
    iconComponent: RecycledIcon,
    color: '#059669',
    description: 'Återvunna material',
    category: 'material',
  },
  {
    id: 'oeko_tex',
    name: 'OEKO-TEX',
    iconComponent: CertificationIcon,
    color: '#6366f1',
    description: 'Testade textilier',
    category: 'material',
  },

  // Religious
  {
    id: 'halal',
    name: 'Halal',
    iconComponent: CertificationIcon,
    color: '#10b981',
    description: 'Halal-certifierad',
    category: 'food',
  },
  {
    id: 'kosher',
    name: 'Kosher',
    iconComponent: CertificationIcon,
    color: '#3b82f6',
    description: 'Kosher-certifierad',
    category: 'food',
  },
];

interface CertificationBadgesProps {
  certifications: string[]; // Array of certification IDs
  size?: 'small' | 'medium' | 'large';
  layout?: 'horizontal' | 'grid';
  showTooltip?: boolean;
}

export default function CertificationBadges({
  certifications,
  size = 'medium',
  layout = 'horizontal',
  showTooltip = true,
}: CertificationBadgesProps) {
  const selectedCerts = CERTIFICATION_LIBRARY.filter((cert) =>
    certifications.includes(cert.id)
  );

  if (selectedCerts.length === 0) {
    return null;
  }

  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-12 h-12 text-sm',
    large: 'w-16 h-16 text-base',
  };

  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-2',
    grid: 'grid grid-cols-4 gap-2',
  };

  return (
    <div className={layoutClasses[layout]}>
      {selectedCerts.map((cert, index) => (
        <motion.div
          key={cert.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative group"
        >
          <div
            className={`${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold shadow-md hover:shadow-lg transition cursor-pointer`}
            style={{
              backgroundColor: cert.color,
              color: cert.color === '#f3f4f6' ? '#1f2937' : '#ffffff',
            }}
            title={showTooltip ? cert.description : undefined}
          >
            <span className="text-2xl">
              {cert.iconComponent ? (
                <cert.iconComponent size={20} />
              ) : cert.icon ? (
                cert.icon
              ) : null}
            </span>
          </div>

          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              <div className="font-semibold">{cert.name}</div>
              <div className="text-gray-300">{cert.description}</div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Compact badges for product cards
export function CertificationBadgesCompact({
  certifications,
  maxShow = 3,
}: {
  certifications: string[];
  maxShow?: number;
}) {
  const selectedCerts = CERTIFICATION_LIBRARY.filter((cert) =>
    certifications.includes(cert.id)
  );

  if (selectedCerts.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {selectedCerts.slice(0, maxShow).map((cert) => (
        <div
          key={cert.id}
          className="w-6 h-6 rounded flex items-center justify-center text-sm shadow-sm"
          style={{
            backgroundColor: cert.color,
            color: cert.color === '#f3f4f6' ? '#1f2937' : '#ffffff',
          }}
          title={cert.name}
        >
          {cert.iconComponent ? (
            <cert.iconComponent size={16} />
          ) : cert.icon ? (
            cert.icon
          ) : null}
        </div>
      ))}
      {selectedCerts.length > maxShow && (
        <div className="w-6 h-6 rounded flex items-center justify-center text-xs bg-gray-200 text-gray-700 font-semibold">
          +{selectedCerts.length - maxShow}
        </div>
      )}
    </div>
  );
}

// Selector for product creation
export function CertificationSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (certifications: string[]) => void;
}) {
  const toggleCertification = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((c) => c !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const categories = Array.from(
    new Set(CERTIFICATION_LIBRARY.map((c) => c.category))
  );

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const certs = CERTIFICATION_LIBRARY.filter((c) => c.category === category);
        const categoryNames = {
          food: 'Mat & Kost',
          environmental: 'Miljö',
          ethical: 'Etik',
          quality: 'Kvalitet',
          material: 'Material',
        };

        return (
          <div key={category}>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              {categoryNames[category as keyof typeof categoryNames]}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {certs.map((cert) => {
                const isSelected = selected.includes(cert.id);
                return (
                  <button
                    key={cert.id}
                    type="button"
                    onClick={() => toggleCertification(cert.id)}
                    className={`p-4 rounded-xl border-2 transition ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center text-2xl shadow-md"
                      style={{
                        backgroundColor: cert.color,
                        color: cert.color === '#f3f4f6' ? '#1f2937' : '#ffffff',
                      }}
                    >
                      {cert.iconComponent ? (
            <cert.iconComponent size={16} />
          ) : cert.icon ? (
            cert.icon
          ) : null}
                    </div>
                    <div className="text-xs font-semibold text-gray-900 text-center">
                      {cert.name}
                    </div>
                    {isSelected && (
                      <div className="text-primary-900 text-center mt-1">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// List view with descriptions
export function CertificationList({ certifications }: { certifications: string[] }) {
  const selectedCerts = CERTIFICATION_LIBRARY.filter((cert) =>
    certifications.includes(cert.id)
  );

  if (selectedCerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {selectedCerts.map((cert) => (
        <div
          key={cert.id}
          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-md flex-shrink-0"
            style={{
              backgroundColor: cert.color,
              color: cert.color === '#f3f4f6' ? '#1f2937' : '#ffffff',
            }}
          >
            {cert.iconComponent ? (
            <cert.iconComponent size={16} />
          ) : cert.icon ? (
            cert.icon
          ) : null}
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900">{cert.name}</div>
            <div className="text-sm text-gray-600">{cert.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
