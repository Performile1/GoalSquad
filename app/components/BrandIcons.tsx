/**
 * GoalSquad Brand Icons
 * All icons use the brand color palette:
 *   Primary: #004040
 *   Accent:  #006666
 */

const P = '#004040'; // Huvudfärg
const A = '#006666'; // Accentfärg

interface IconProps {
  size?: number;
  className?: string;
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
