export function MoonIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M36 10 C20 14 10 22 10 32 C10 42 20 50 36 54 C30 48 26 40 26 32 C26 24 30 16 36 10Z" fill="#FAC775"/>
      <circle cx="52" cy="18" r="2.5" fill="#FAC775"/>
      <circle cx="56" cy="32" r="1.8" fill="#FAC775" opacity="0.7"/>
      <circle cx="50" cy="10" r="1.5" fill="#FAC775" opacity="0.6"/>
    </svg>
  )
}

export function OwlIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Wings */}
      <ellipse cx="12" cy="50" rx="9" ry="13" fill="#A86820" transform="rotate(15 12 50)"/>
      <ellipse cx="52" cy="50" rx="9" ry="13" fill="#A86820" transform="rotate(-15 52 50)"/>
      {/* Body */}
      <ellipse cx="32" cy="52" rx="14" ry="13" fill="#C48530"/>
      {/* Head */}
      <circle cx="32" cy="26" r="22" fill="#D4922A"/>
      {/* Facial disc */}
      <ellipse cx="32" cy="28" rx="18" ry="16" fill="#E8A848"/>
      {/* Ear tufts */}
      <ellipse cx="19" cy="7" rx="5" ry="9" fill="#B07020" transform="rotate(-14 19 7)"/>
      <ellipse cx="45" cy="7" rx="5" ry="9" fill="#B07020" transform="rotate(14 45 7)"/>
      {/* Eye surrounds — forest green ties to brand */}
      <circle cx="22" cy="25" r="10" fill="#3B6D11"/>
      <circle cx="42" cy="25" r="10" fill="#3B6D11"/>
      {/* Irises — golden honey */}
      <circle cx="22" cy="25" r="7.5" fill="#FAC775"/>
      <circle cx="42" cy="25" r="7.5" fill="#FAC775"/>
      {/* Pupils */}
      <circle cx="22" cy="25" r="4" fill="#1A0E05"/>
      <circle cx="42" cy="25" r="4" fill="#1A0E05"/>
      {/* Eye highlights */}
      <circle cx="20.5" cy="23.5" r="1.5" fill="white"/>
      <circle cx="40.5" cy="23.5" r="1.5" fill="white"/>
      {/* Beak */}
      <path d="M28 33 L32 40 L36 33Z" fill="#E07820"/>
      {/* Belly feather hint */}
      <ellipse cx="32" cy="52" rx="8" ry="9" fill="#E8A848" opacity="0.55"/>
      {/* Feet */}
      <ellipse cx="25" cy="62" rx="5" ry="2.5" fill="#A06820"/>
      <ellipse cx="39" cy="62" rx="5" ry="2.5" fill="#A06820"/>
    </svg>
  )
}

export function SproutIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="44" r="12" fill="#3B6D11"/>
      <rect x="30" y="20" width="4" height="24" rx="2" fill="#3B6D11"/>
      <ellipse cx="22" cy="24" rx="10" ry="7" fill="#639922" transform="rotate(-20 22 24)"/>
      <ellipse cx="42" cy="20" rx="10" ry="7" fill="#97C459" transform="rotate(15 42 20)"/>
      <circle cx="32" cy="44" r="5" fill="#EAF3DE"/>
    </svg>
  )
}

export function AcornIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="42" rx="16" ry="12" fill="#BA7517"/>
      <ellipse cx="32" cy="42" rx="16" ry="5" fill="#854F0B"/>
      <ellipse cx="32" cy="26" rx="12" ry="14" fill="#FAC775"/>
      <rect x="29" y="12" width="6" height="10" rx="3" fill="#3B6D11"/>
      <ellipse cx="27" cy="13" rx="6" ry="4" fill="#639922" transform="rotate(-30 27 13)"/>
      <circle cx="27" cy="36" r="2" fill="#BA7517" opacity="0.4"/>
      <circle cx="37" cy="32" r="2.5" fill="#BA7517" opacity="0.3"/>
    </svg>
  )
}

export function MushroomIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="20" y="38" width="24" height="16" rx="4" fill="#F0997B"/>
      <ellipse cx="24" cy="38" rx="8" ry="10" fill="#FAECE7"/>
      <ellipse cx="32" cy="35" rx="10" ry="12" fill="#FAECE7"/>
      <ellipse cx="40" cy="38" rx="8" ry="10" fill="#FAECE7"/>
      <circle cx="28" cy="36" r="2" fill="#F0997B"/>
      <circle cx="36" cy="33" r="2" fill="#F0997B"/>
      <circle cx="22" cy="42" r="1.5" fill="#F0997B" opacity="0.5"/>
      <circle cx="42" cy="42" r="1.5" fill="#F0997B" opacity="0.5"/>
    </svg>
  )
}

export function LeafIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M32 52 C18 44 10 30 16 18 C20 10 30 8 36 14 C44 8 54 14 52 26 C50 38 44 48 32 52Z" fill="#639922"/>
      <path d="M32 52 C32 36 32 20 32 14" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M32 30 C26 26 20 28 18 24" stroke="#3B6D11" strokeWidth="1" strokeLinecap="round"/>
      <path d="M32 38 C38 34 44 36 46 32" stroke="#3B6D11" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

export function CaterpillarIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="14" cy="38" r="9" fill="#97C459"/>
      <circle cx="26" cy="34" r="9" fill="#639922"/>
      <circle cx="38" cy="34" r="9" fill="#97C459"/>
      <circle cx="50" cy="38" r="8" fill="#639922"/>
      <circle cx="26" cy="25" r="7" fill="#C0DD97"/>
      <circle cx="24" cy="23" r="2" fill="#27500A"/>
      <circle cx="24.5" cy="22.5" r="0.8" fill="white"/>
      <line x1="20" y1="20" x2="16" y2="14" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="24" y1="18" x2="22" y2="12" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function RaindropIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M32 14 C28 14 22 20 22 30 C22 40 26 50 32 52 C38 50 42 40 42 30 C42 20 36 14 32 14Z" fill="#9FE1CB"/>
      <ellipse cx="32" cy="28" rx="5" ry="3" fill="#1D9E75" opacity="0.4"/>
      <ellipse cx="32" cy="36" rx="4" ry="2" fill="#1D9E75" opacity="0.3"/>
      <circle cx="29" cy="22" r="2" fill="white" opacity="0.6"/>
    </svg>
  )
}

export function SunIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="10" fill="#FAC775"/>
      <line x1="32" y1="12" x2="32" y2="18" stroke="#FAC775" strokeWidth="3" strokeLinecap="round"/>
      <line x1="32" y1="46" x2="32" y2="52" stroke="#FAC775" strokeWidth="3" strokeLinecap="round"/>
      <line x1="12" y1="32" x2="18" y2="32" stroke="#FAC775" strokeWidth="3" strokeLinecap="round"/>
      <line x1="46" y1="32" x2="52" y2="32" stroke="#FAC775" strokeWidth="3" strokeLinecap="round"/>
      <line x1="18" y1="18" x2="22" y2="22" stroke="#FAC775" strokeWidth="3" strokeLinecap="round"/>
      <line x1="42" y1="42" x2="46" y2="46" stroke="#FAC775" strokeWidth="3" strokeLinecap="round"/>
      <line x1="46" y1="18" x2="42" y2="22" stroke="#FAC775" strokeWidth="3" strokeLinecap="round"/>
      <line x1="22" y1="42" x2="18" y2="46" stroke="#FAC775" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

export function SnailIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="38" cy="36" r="14" fill="#C0DD97"/>
      <path d="M24 36 C24 44 18 50 14 50 C10 50 8 46 10 42 C12 38 18 38 24 36Z" fill="#97C459"/>
      <circle cx="44" cy="30" r="5" fill="#EAF3DE"/>
      <circle cx="42" cy="28" r="2" fill="#27500A"/>
      <circle cx="42.5" cy="27.5" r="0.8" fill="white"/>
      <line x1="40" y1="22" x2="38" y2="16" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="44" y1="21" x2="44" y2="15" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function SquirrelIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Bushy tail */}
      <ellipse cx="46" cy="34" rx="13" ry="18" fill="#C48530" transform="rotate(-15 46 34)"/>
      <ellipse cx="46" cy="34" rx="9" ry="13" fill="#E8A848" transform="rotate(-15 46 34)"/>
      {/* Body */}
      <ellipse cx="28" cy="46" rx="12" ry="10" fill="#E8A848"/>
      {/* Belly */}
      <ellipse cx="27" cy="47" rx="7" ry="6" fill="#F4D090"/>
      {/* Head */}
      <circle cx="24" cy="30" r="11" fill="#E8A848"/>
      {/* Ears */}
      <circle cx="15" cy="21" r="5" fill="#C48530"/>
      <circle cx="15" cy="21" r="2.5" fill="#F4C880"/>
      <circle cx="29" cy="19" r="4" fill="#C48530"/>
      <circle cx="29" cy="19" r="2" fill="#F4C880"/>
      {/* Eye */}
      <circle cx="19" cy="28" r="2.5" fill="#1A0E05"/>
      <circle cx="18.5" cy="27.5" r="0.8" fill="white"/>
      {/* Nose */}
      <circle cx="13" cy="32" r="1.8" fill="#A06820"/>
      {/* Feet */}
      <ellipse cx="22" cy="55" rx="5" ry="3" fill="#C48530"/>
      <ellipse cx="34" cy="55" rx="5" ry="3" fill="#C48530"/>
      {/* Front paw */}
      <ellipse cx="17" cy="42" rx="4" ry="3" fill="#E8A848" transform="rotate(-30 17 42)"/>
    </svg>
  )
}

export function ChipmunkIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Body */}
      <ellipse cx="32" cy="46" rx="14" ry="12" fill="#D4922A"/>
      {/* Body stripes */}
      <rect x="29" y="36" width="2.5" height="18" rx="1" fill="#7A4A10" opacity="0.35"/>
      <rect x="33.5" y="36" width="2.5" height="18" rx="1" fill="#7A4A10" opacity="0.35"/>
      {/* Head */}
      <circle cx="32" cy="26" r="13" fill="#E8A840"/>
      {/* Puffy cheeks */}
      <circle cx="18" cy="30" r="7" fill="#F0BC60"/>
      <circle cx="46" cy="30" r="7" fill="#F0BC60"/>
      {/* Head stripes */}
      <rect x="29.5" y="14" width="2.5" height="14" rx="1" fill="#7A4A10" opacity="0.30"/>
      <rect x="33.5" y="14" width="2.5" height="14" rx="1" fill="#7A4A10" opacity="0.30"/>
      {/* Ears */}
      <circle cx="20" cy="15" r="5" fill="#C47828"/>
      <circle cx="20" cy="15" r="2.5" fill="#F4C880"/>
      <circle cx="44" cy="15" r="5" fill="#C47828"/>
      <circle cx="44" cy="15" r="2.5" fill="#F4C880"/>
      {/* Eyes */}
      <circle cx="24" cy="24" r="2.5" fill="#1A0E05"/>
      <circle cx="23.5" cy="23.5" r="0.8" fill="white"/>
      <circle cx="40" cy="24" r="2.5" fill="#1A0E05"/>
      <circle cx="39.5" cy="23.5" r="0.8" fill="white"/>
      {/* Nose */}
      <circle cx="32" cy="30" r="2" fill="#B86820"/>
      {/* Small tail */}
      <ellipse cx="32" cy="57" rx="7" ry="4" fill="#C47828"/>
    </svg>
  )
}

export function CapybaraIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Body — big barrel */}
      <rect x="6" y="34" width="52" height="20" rx="10" fill="#A88040"/>
      {/* Head — wide and boxy */}
      <rect x="12" y="16" width="40" height="26" rx="12" fill="#B89050"/>
      {/* Muzzle — flat wide snout */}
      <rect x="12" y="28" width="40" height="14" rx="8" fill="#9A7535"/>
      {/* Ears — small round on top */}
      <circle cx="18" cy="17" r="7" fill="#A88040"/>
      <circle cx="18" cy="17" r="4" fill="#C4A060"/>
      <circle cx="46" cy="17" r="7" fill="#A88040"/>
      <circle cx="46" cy="17" r="4" fill="#C4A060"/>
      {/* Eyes — calm small dots */}
      <circle cx="22" cy="24" r="3" fill="#1A0E05"/>
      <circle cx="21.4" cy="23.4" r="1" fill="white"/>
      <circle cx="42" cy="24" r="3" fill="#1A0E05"/>
      <circle cx="41.4" cy="23.4" r="1" fill="white"/>
      {/* Nostrils */}
      <circle cx="25" cy="36" r="2.2" fill="#7A5520" opacity="0.55"/>
      <circle cx="39" cy="36" r="2.2" fill="#7A5520" opacity="0.55"/>
      {/* Legs — four stubby */}
      <rect x="12" y="50" width="10" height="10" rx="5" fill="#9A7535"/>
      <rect x="26" y="50" width="10" height="10" rx="5" fill="#9A7535"/>
      <rect x="40" y="50" width="10" height="10" rx="5" fill="#9A7535"/>
      {/* Subtle smile */}
      <path d="M24 38 Q32 43 40 38" stroke="#7A5520" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
}