/**
 * GoalSquad Brand Icons
 * All icons use the brand color palette:
 *   Primary: #003B3D (Petrol)
 *   Accent:  #004A4C (Petrol Light)
 */

const P = 'currentColor'; // Inherits CSS color — petrol on light, gold on dark
const A = 'currentColor'; // Inherits CSS color — petrol on light, gold on dark

interface IconProps {
  size?: number;
  className?: string;
}

export function ChevronDownIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 18l12 12 12-12" stroke={P} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShopIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M6 8h36l-4 20H10L6 8z" fill={A} />
      <path d="M10 28l-2-20H6a2 2 0 010-4h36a2 2 0 010 4h-2l-2 20a4 4 0 01-4 4H14a4 4 0 01-4-4z" stroke={P} strokeWidth="2.5" fill="none" />
      <circle cx="18" cy="42" r="3" fill={P} />
      <circle cx="30" cy="42" r="3" fill={P} />
      <path d="M18 16v-4a6 6 0 0112 0v4" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function TrophyIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 32c-8 0-14-6-14-14V8h28v10c0 8-6 14-14 14z" fill={A} />
      <path d="M24 32c-8 0-14-6-14-14V8h28v10c0 8-6 14-14 14z" stroke={P} strokeWidth="2.5" />
      <path d="M10 10H6a4 4 0 004 4" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 10h4a4 4 0 01-4 4" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="20" y="32" width="8" height="6" fill={A} stroke={P} strokeWidth="2" />
      <rect x="14" y="38" width="20" height="4" rx="2" fill={P} />
      <path d="M20 20l2 4 4-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CommunityIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="14" r="6" fill={A} stroke={P} strokeWidth="2" />
      <circle cx="10" cy="18" r="5" fill={A} stroke={P} strokeWidth="2" />
      <circle cx="38" cy="18" r="5" fill={A} stroke={P} strokeWidth="2" />
      <path d="M14 38c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke={P} strokeWidth="2.5" strokeLinecap="round" fill={A} />
      <path d="M2 40c0-4 3.134-7 7-7" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 40c0-4-3.134-7-7-7" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function OrdersIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="6" y="16" width="36" height="26" rx="3" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M6 22h36" stroke={P} strokeWidth="2" />
      <path d="M16 6h16l4 10H12L16 6z" fill={P} />
      <path d="M16 6h16l4 10H12L16 6z" stroke={P} strokeWidth="1.5" />
      <rect x="18" y="28" width="12" height="8" rx="1.5" fill="white" opacity="0.5" />
      <path d="M21 32l2 2 4-3" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CartIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 6h5l6 24h20l5-16H14" stroke={P} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 6H4" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M4 6l10 24h20l5-16H14" fill={A} />
      <circle cx="19" cy="40" r="3" fill={P} />
      <circle cx="33" cy="40" r="3" fill={P} />
      <path d="M20 22l2 4 6-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MerchantIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="6" y="20" width="36" height="22" rx="2" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M6 20l4-12h28l4 12H6z" fill={P} />
      <path d="M6 20h36" stroke={P} strokeWidth="2" />
      <path d="M16 42V30h8v12" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="28" y="28" width="8" height="6" rx="1" fill="white" opacity="0.6" />
      <path d="M10 14h4M24 14h4M34 14h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function LockIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="12" y="20" width="24" height="20" rx="3" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M16 20v-8a8 8 0 0116 0v8" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="30" r="3" fill={P} />
    </svg>
  );
}

export function RunnerIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="30" cy="8" r="4" fill={P} />
      <path d="M26 16l-6 10 8 4-4 12" stroke={P} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 26l-8 6M34 30l6 8" stroke={P} strokeWidth="3" strokeLinecap="round" />
      <path d="M26 16c2-2 6-2 8 0l4 8-6 2" fill={A} stroke={P} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function FlagIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <line x1="10" y1="6" x2="10" y2="42" stroke={P} strokeWidth="3" strokeLinecap="round" />
      <rect x="10" y="6" width="28" height="18" rx="2" fill={A} />
      <rect x="10" y="6" width="7" height="9" fill={P} opacity="0.7" />
      <rect x="17" y="15" width="7" height="9" fill={P} opacity="0.7" />
      <rect x="31" y="6" width="7" height="9" fill={P} opacity="0.7" />
      <rect x="24" y="15" width="7" height="9" fill={P} opacity="0.7" />
      <text x="22" y="19" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="system-ui">GS</text>
    </svg>
  );
}

export function LeaderboardIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="4" y="28" width="10" height="14" rx="2" fill={A} stroke={P} strokeWidth="2" />
      <rect x="18" y="18" width="12" height="24" rx="2" fill={P} stroke={P} strokeWidth="2" />
      <rect x="34" y="22" width="10" height="20" rx="2" fill={A} stroke={P} strokeWidth="2" />
      <text x="9" y="23" fontSize="9" fontWeight="bold" fill={A} textAnchor="middle" fontFamily="system-ui">2</text>
      <text x="24" y="13" fontSize="9" fontWeight="bold" fill={P} textAnchor="middle" fontFamily="system-ui">1</text>
      <text x="39" y="17" fontSize="9" fontWeight="bold" fill={A} textAnchor="middle" fontFamily="system-ui">3</text>
      <path d="M21 12l1.5-3 1.5 3 3 .5-2.2 2 .7 3.3-3-1.6-3 1.6.7-3.3-2.2-2 3-.5z" fill="white" />
    </svg>
  );
}

export function SearchIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="10" cy="10" r="6" stroke={P} strokeWidth="2.5" />
      <path d="M20 20l-4-4" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SplitEngineIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="18" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M24 10v28M12 18l12 6 12-6M12 30l12-6 12 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="24" r="4" fill={P} />
    </svg>
  );
}

export function LogisticsIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="16" width="28" height="18" rx="2" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M30 22h10l6 8v6H30V22z" fill={P} stroke={P} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="10" cy="38" r="4" fill={P} stroke="white" strokeWidth="1.5" />
      <circle cx="38" cy="38" r="4" fill={P} stroke="white" strokeWidth="1.5" />
      <path d="M8 22l4-6M18 16v6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function AuditIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="10" y="6" width="28" height="36" rx="3" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M18 16h12M18 22h12M18 28h8" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <circle cx="32" cy="34" r="8" fill={P} />
      <path d="M28.5 34l2.5 2.5 4-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DashboardIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="4" y="4" width="18" height="18" rx="3" fill={A} stroke={P} strokeWidth="2" />
      <rect x="26" y="4" width="18" height="18" rx="3" fill={P} stroke={P} strokeWidth="2" />
      <rect x="4" y="26" width="18" height="18" rx="3" fill={P} stroke={P} strokeWidth="2" />
      <rect x="26" y="26" width="18" height="18" rx="3" fill={A} stroke={P} strokeWidth="2" />
    </svg>
  );
}

export function MessageIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M6 8h36a2 2 0 012 2v22a2 2 0 01-2 2H16l-8 6V10a2 2 0 012-2z" fill={A} stroke={P} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M14 20h20M14 27h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function NoImagePlaceholder({ width = 300, height = 300, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg width={width} height={height} viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="300" height="300" fill={A} />
      <rect x="1" y="1" width="298" height="298" fill={A} rx="0" />
      {/* Mountains */}
      <path d="M0 220L80 120L140 180L200 100L300 220V300H0V220Z" fill={P} opacity="0.6" />
      <path d="M0 260L60 180L120 230L200 160L300 260V300H0V260Z" fill={P} opacity="0.8" />
      {/* Sun */}
      <circle cx="230" cy="70" r="30" fill="white" opacity="0.2" />
      {/* GS Logo area */}
      <rect x="110" y="120" width="80" height="60" rx="8" fill="white" opacity="0.12" />
      <text x="150" y="159" fontSize="28" fontWeight="800" fill="white" textAnchor="middle" fontFamily="system-ui" opacity="0.7">GS</text>
    </svg>
  );
}

export function UserIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="16" r="10" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M6 44c0-9.941 8.059-18 18-18s18 8.059 18 18" fill={A} stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function JerseyIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 8L6 14v6l6 4 6-4 6 4 6-4 6 4 6-4v-6l-6-6H12z" fill={A} stroke={P} strokeWidth="2.5" />
      <rect x="18" y="24" width="12" height="20" fill={P} />
      <path d="M12 24l6-4" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M36 24l-6-4" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="34" r="4" fill="white" />
    </svg>
  );
}

export function HandmadeIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M14 20c-3 0-6 3-6 7s3 7 6 7h20c3 0 6-3 6-7s-3-7-6-7H14z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M14 20v-8c0-2 2-4 4-4s4 2 4 4v8" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 20v-8c0-2 2-4 4-4s4 2 4 4v8" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="34" r="3" fill={P} />
      <circle cx="32" cy="34" r="3" fill={P} />
    </svg>
  );
}

export function EquipmentIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="16" fill={A} stroke={P} strokeWidth="2.5" />
      <circle cx="24" cy="24" r="8" fill={P} />
      <circle cx="24" cy="24" r="3" fill={A} />
      <path d="M24 8v6M24 34v6M40 24h-6M14 24H8" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function FoodIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 12c0-4 4-8 12-8s12 4 12 8v8c0 4-4 8-12 8s-12-4-12-8v-8z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M16 20c0-2 2-4 8-4s8 2 8 4v4c0 2-2 4-8 4s-8-2-8-4v-4z" fill={P} />
      <circle cx="20" cy="18" r="2" fill={A} />
      <circle cx="28" cy="18" r="2" fill={A} />
      <path d="M24 28v8" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="6" y="12" width="36" height="28" rx="4" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M6 18h36" stroke={P} strokeWidth="2" />
      <path d="M16 12l4-6h8l4 6" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="28" r="8" fill={P} />
      <circle cx="24" cy="28" r="4" fill={A} />
      <circle cx="24" cy="28" r="1.5" fill="white" />
    </svg>
  );
}

export function MoneyIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="4" y="16" width="40" height="20" rx="4" fill={A} stroke={P} strokeWidth="2.5" />
      <circle cx="14" cy="26" r="4" fill={P} />
      <circle cx="34" cy="26" r="4" fill={P} />
      <path d="M20 22h4M24 26h4M20 30h4" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export function ShoppingBagIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10 16h28l-4 24H14L10 16z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M16 16v-8c0-4 3.582-8 8-8s8 4 8 8v8" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="30" r="2" fill={P} />
      <circle cx="30" cy="30" r="2" fill={P} />
    </svg>
  );
}

export function LeafIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 6c-8 0-14 6-14 14 0 6 4 12 10 16 6-4 10-10 10-16 0-8-6-14-14-14z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M24 6v24" stroke={P} strokeWidth="2" />
      <path d="M24 14c-2 2-4 4-4 8" stroke={P} strokeWidth="2" strokeLinecap="round" />
      <path d="M24 18c2 2 4 4 4 8" stroke={P} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HandshakeIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M8 24l8-8h12l8 8-8 8H16l-8-8z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M16 16l-4 8 4 8" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 16l4 8-4 8" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="4" fill={P} />
    </svg>
  );
}

export function RocketIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 4c0 0-8 8-8 20 0 8 4 16 8 20 4-4 8-12 8-20 0-12-8-20-8-20z" fill={A} stroke={P} strokeWidth="2.5" />
      <circle cx="24" cy="16" r="4" fill={P} />
      <path d="M16 36l-4 8M32 36l4 8M16 12l-6-4M32 12l6-4" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function LaptopIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="6" y="8" width="36" height="24" rx="2" fill={A} stroke={P} strokeWidth="2.5" />
      <rect x="2" y="32" width="44" height="6" rx="2" fill={P} />
      <rect x="8" y="12" width="32" height="16" fill={P} opacity="0.3" />
    </svg>
  );
}

export function TargetIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="18" fill={A} stroke={P} strokeWidth="2.5" />
      <circle cx="24" cy="24" r="12" fill={P} />
      <circle cx="24" cy="24" r="6" fill={A} />
      <circle cx="24" cy="24" r="2" fill="white" />
    </svg>
  );
}

export function FilterIcon({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M6 18L14 26L30 10" stroke={P} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function AlertIcon({ size = 36, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M18 4L4 32h28L18 4z" stroke={P} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill={A} />
      <path d="M18 14v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="26" r="2" fill="white" />
    </svg>
  );
}

export function TruckIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="16" width="28" height="18" rx="2" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M30 22h10l6 8v6H30V22z" fill={P} stroke={P} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="10" cy="38" r="4" fill={P} stroke="white" strokeWidth="1.5" />
      <circle cx="38" cy="38" r="4" fill={P} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export function DocumentIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10 6h20l8 8v28a2 2 0 01-2 2H12a2 2 0 01-2-2V6z" fill={A} stroke={P} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 6v8h8" stroke={P} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M16 20h16M16 28h16M16 36h8" stroke={P} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SendIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeartIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={A} />
    </svg>
  );
}

export function CommentIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={A} />
    </svg>
  );
}

export function ShareIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="18" cy="5" r="3" stroke={P} strokeWidth="2" />
      <circle cx="6" cy="12" r="3" stroke={P} strokeWidth="2" />
      <circle cx="18" cy="19" r="3" stroke={P} strokeWidth="2" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l6.83 3.98" stroke={P} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BoxIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 18l20 12 20-12M4 18l20-12 20 12M24 30v18" stroke={P} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="6" width="40" height="24" rx="2" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M4 30v12a2 2 0 002 2h36a2 2 0 002-2V30" fill={A} stroke={P} strokeWidth="2.5" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FacebookIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InstagramIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke={P} strokeWidth="2" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" stroke={P} strokeWidth="2" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke={P} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function MailIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={P} strokeWidth="2" />
      <path d="M22 6l-10 7L2 6" stroke={P} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneIcon({ size = 32, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Gamification Icons

export function XPIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 6L14 20h8l-2 14 12-16h-8l2-14z" fill={A} stroke={P} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LevelIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="18" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M24 12v12l8 4" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <text x="24" y="28" fontSize="14" fontWeight="bold" fill={P} textAnchor="middle" fontFamily="system-ui">LVL</text>
    </svg>
  );
}

export function AvatarIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="18" r="10" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M6 44c0-9.941 8.059-18 18-18s18 8.059 18 18" fill={A} stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="14" r="3" fill={P} />
    </svg>
  );
}

export function QuestIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="6" y="6" width="36" height="36" rx="4" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M14 20l6 6 14-14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="38" r="6" fill={P} />
      <path d="M24 36v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LootBoxIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="8" y="16" width="32" height="24" rx="4" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M8 24h32" stroke={P} strokeWidth="2" />
      <circle cx="24" cy="12" r="6" fill={P} />
      <path d="M20 12l4-4 4 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="32" r="3" fill={P} />
      <circle cx="32" cy="32" r="3" fill={P} />
    </svg>
  );
}

export function CouponIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 12h40v16H4z" fill={A} stroke={P} strokeWidth="2.5" />
      <circle cx="4" cy="20" r="4" fill={P} />
      <circle cx="44" cy="20" r="4" fill={P} />
      <path d="M8 20h32" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M12 16l-4 4 4 4" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 16l4 4-4 4" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GiftIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="8" y="16" width="32" height="24" rx="2" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M24 16v24" stroke={P} strokeWidth="2.5" />
      <path d="M8 24h32" stroke={P} strokeWidth="2.5" />
      <path d="M16 16v-8c0-4.418 3.582-8 8-8s8 3.582 8 8v8" stroke={P} strokeWidth="2.5" />
      <circle cx="24" cy="8" r="4" fill={P} />
      <path d="M20 8h8" stroke="white" strokeWidth="2" />
    </svg>
  );
}

export function FireModeIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 4c-4 0-8 4-8 12 0 4 2 8 6 12-2-4-2-8 0-12 2-4 6-8 8-8z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M24 16c-2 0-4 2-4 6 0 2 1 4 3 5-1-2-1-4 0-6 1-2 3-4 5-4z" fill={P} />
      <path d="M24 22c-1 0-2 1-2 3 0 1 0.5 2 1.5 2.5-0.5-1-0.5-2 0-3 0.5-1 1.5-2 2.5-2z" fill="white" />
    </svg>
  );
}

export function StreakIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="36" r="8" fill={A} stroke={P} strokeWidth="2.5" />
      <circle cx="24" cy="24" r="8" fill={A} stroke={P} strokeWidth="2.5" />
      <circle cx="36" cy="12" r="8" fill={P} stroke={P} strokeWidth="2.5" />
      <path d="M18 32l6-6" stroke={P} strokeWidth="2" strokeLinecap="round" />
      <path d="M30 20l6-6" stroke={P} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BadgeIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="20" r="14" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M24 34v10M18 42l6-4 6 4" stroke={P} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 18l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MilestoneIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 40V24l16-16 16 16v16" stroke={P} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="8" r="6" fill={A} stroke={P} strokeWidth="2.5" />
      <circle cx="36" cy="24" r="6" fill={P} stroke={P} strokeWidth="2.5" />
      <circle cx="12" cy="40" r="6" fill={A} stroke={P} strokeWidth="2.5" />
    </svg>
  );
}

export function SquadIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="14" r="6" fill={P} stroke={P} strokeWidth="2" />
      <circle cx="10" cy="18" r="5" fill={A} stroke={P} strokeWidth="2" />
      <circle cx="38" cy="18" r="5" fill={A} stroke={P} strokeWidth="2" />
      <path d="M14 38c0-5.523 4.477-10 10-10s10 4.477 10 10" fill={A} stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M2 40c0-4 3.134-7 7-7" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 40c0-4-3.134-7-7-7" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="8" fill={P} opacity="0.3" />
    </svg>
  );
}

export function SupportIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 6c-8 0-14 6-14 14 0 4 2 8 6 10v8l8-4 8 4v-8c4-2 6-6 6-10 0-8-6-14-14-14z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M18 18l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="32" r="4" fill={P} />
    </svg>
  );
}

export function ImpactIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="18" fill={A} stroke={P} strokeWidth="2.5" />
      <circle cx="24" cy="24" r="12" fill={P} opacity="0.5" />
      <circle cx="24" cy="24" r="6" fill={P} />
      <path d="M24 6v6M24 36v6M42 24h-6M12 24H6" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function ReferralIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="18" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M24 12v12M24 36v-6M12 24h12M36 24H30" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="18" r="4" fill={P} />
      <circle cx="30" cy="30" r="4" fill={P} />
    </svg>
  );
}

// Additional icons needed for new features

export function XIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M18 6L6 18M6 6l12 12" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EyeIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke={P} strokeWidth="2" />
    </svg>
  );
}

export function ViewIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke={P} strokeWidth="2" />
    </svg>
  );
}

export function ClickIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 3h6v6" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14L21 3" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={P} strokeWidth="2" />
      <path d="M16 2v6M8 2v6M3 10h18" stroke={P} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 5v14M5 12h14" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EditIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GlobeIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="10" stroke={P} strokeWidth="2" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10M12 2a15.3 15.3 0 00-4 10 15.3 15.3 0 004 10" stroke={P} strokeWidth="2" />
    </svg>
  );
}

export function SaveIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 21v-8H7v8" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 3v5h8" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShieldIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BellIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 01-3.46 0" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PackageIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M16.5 9.4L7.55 4.24" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.27 6.96l8.73 5.07" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22.08V12" stroke={P} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ShoppingCartIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="9" cy="21" r="1" stroke={P} strokeWidth="2" />
      <circle cx="20" cy="21" r="1" stroke={P} strokeWidth="2" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheerIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 6c-8 0-14 6-14 14 0 6 4 12 10 16 6-4 10-10 10-16 0-8-6-14-14-14z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M24 12l2 6 6 0-5 4 2 6-5-4-5 4 2-6-5-4 6 0z" fill={P} />
    </svg>
  );
}

export function TierIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="4" y="28" width="10" height="14" rx="2" fill={A} stroke={P} strokeWidth="2" />
      <rect x="18" y="18" width="12" height="24" rx="2" fill={P} stroke={P} strokeWidth="2" />
      <rect x="34" y="22" width="10" height="20" rx="2" fill={A} stroke={P} strokeWidth="2" />
      <circle cx="24" cy="12" r="6" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M24 18v0" stroke={P} strokeWidth="2" />
    </svg>
  );
}

export function EquipmentSlotIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="6" y="6" width="36" height="36" rx="4" fill={A} stroke={P} strokeWidth="2.5" strokeDasharray="4 4" />
      <path d="M24 16v16M16 24h16" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="6" fill={P} />
    </svg>
  );
}

export function SkinIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 6c-6 0-10 4-10 10 0 4 2 8 6 10v8l8-4 8 4v-8c4-2 6-6 6-10 0-6-4-10-10-10z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M20 18l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GoldenHoodieIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 8L6 14v6l6 4 6-4 6 4 6-4 6 4 6-4v-6l-6-6H12z" fill="#FFD700" stroke={P} strokeWidth="2.5" />
      <rect x="18" y="24" width="12" height="20" fill={P} />
      <path d="M12 24l6-4" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M36 24l-6-4" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="34" r="4" fill="#FFD700" />
    </svg>
  );
}

export function SettingsIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="6" fill={P} />
      <path d="M24 4v4M24 40v4M4 24h4M40 24h4M8.686 8.686l2.828 2.828M36.486 36.486l2.828 2.828M8.686 39.314l2.828-2.828M36.486 11.514l2.828-2.828" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="10" stroke={P} strokeWidth="2.5" fill={A} />
      <circle cx="24" cy="24" r="4" fill={P} />
    </svg>
  );
}

export function BarcodeIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="4" y="8" width="40" height="32" rx="3" fill={A} stroke={P} strokeWidth="2" />
      <line x1="10" y1="14" x2="10" y2="34" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="15" y1="14" x2="15" y2="34" stroke={P} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="14" x2="19" y2="34" stroke={P} strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="14" x2="24" y2="34" stroke={P} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="14" x2="28" y2="34" stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="14" x2="32" y2="34" stroke={P} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="36" y1="14" x2="36" y2="34" stroke={P} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function VerifiedIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2l2.4 3.2L18 4l.8 3.8L22 10l-2 3.2 2 3.2-3.2 2.2L18 22l-3.6-1.2L12 24l-2.4-2.8L6 22l-.8-3.6L2 16.4l2-3.2L2 10l3.2-2.2L6 4l3.6 1.2L12 2z" fill={A} stroke={P} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.5 12l2.5 2.5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SellerIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="14" r="8" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M10 40c0-7.732 6.268-14 14-14s14 6.268 14 14" fill={A} stroke={P} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="36" cy="12" r="8" fill={P} />
      <path d="M33 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Certification Icons
export function CertificationIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 4l4 8h8l-6 6 2 8-8-4-8 4 2-8-6-6h8z" fill={A} stroke={P} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="12" stroke={P} strokeWidth="2.5" fill="none" />
    </svg>
  );
}

export function OrganicIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 8c-8 0-14 6-14 14 0 8 6 14 14 14s14-6 14-14c0-8-6-14-14-14z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M24 16v8M20 20h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 12l-4 4M24 12l4 4" stroke={P} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EcoIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 6c-4 0-8 2-10 6-2 4-2 8 0 12l10 14 10-14c2-4 2-8 0-12-2-4-6-6-10-6z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M24 14v10M20 18h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function RecycledIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 8l-6 10 6 4 6-4-6-10z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M18 18l-6 4 6 10 6-4-6-10z" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M30 18l6 4-6 10-6-4 6-10z" fill={A} stroke={P} strokeWidth="2.5" />
      <circle cx="24" cy="24" r="4" fill={P} />
    </svg>
  );
}

export function FairTradeIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="16" fill={A} stroke={P} strokeWidth="2.5" />
      <path d="M16 24l6 6 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 8v4M24 36v4M8 24h4M36 24h4" stroke={P} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Allergen Icons
export function AllergenIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="16" fill="#FEE2E2" stroke="#DC2626" strokeWidth="2.5" />
      <path d="M20 18l8 12M28 18l-8 12" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function WarningIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24 8l-18 32h36z" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 20v10M24 34v2" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function GlutenFreeIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="16" fill="#D1FAE5" stroke="#059669" strokeWidth="2.5" />
      <path d="M18 24l6 6 10-10" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 12v4M24 32v4" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function VeganIcon({ size = 48, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="16" fill="#DCFCE7" stroke="#22C55E" strokeWidth="2.5" />
      <path d="M16 28c0-6 4-10 8-10s8 4 8 10" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M20 28v4M28 28v4" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="16" r="4" fill="#22C55E" />
    </svg>
  );
}

