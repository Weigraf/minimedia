'use client'
import { useRef } from 'react'

function BackpackLoader() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <style>{`
        @keyframes tt-book-fly {
          0%   { transform: translate(-62px, 0) scale(1); opacity: 0; }
          12%  { opacity: 1; }
          44%  { transform: translate(0, 0) scale(1); opacity: 1; }
          68%  { transform: translate(0, 0) scale(0.05); opacity: 0; }
          100% { transform: translate(-62px, 0) scale(1); opacity: 0; }
        }
        .tt-book {
          animation: tt-book-fly 2.4s ease-in-out infinite backwards;
          transform-box: fill-box;
          transform-origin: center;
        }
        .tt-book-b { animation-delay: 0.8s; }
        .tt-book-c { animation-delay: 1.6s; }
      `}</style>

      {/* Left strap */}
      <path d="M27 28 Q18 42 18 72" stroke="#9A6010" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Right strap */}
      <path d="M53 28 Q62 42 62 72" stroke="#9A6010" strokeWidth="5" strokeLinecap="round" fill="none"/>

      {/* Bag body */}
      <rect x="19" y="24" width="42" height="50" rx="9" fill="#C48530"/>

      {/* Top flap */}
      <rect x="19" y="13" width="42" height="19" rx="8" fill="#BA7517"/>

      {/* Flap stitching */}
      <path d="M23 29 L57 29" stroke="#8A5010" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round"/>

      {/* Handle loop */}
      <path d="M30 13 Q40 5 50 13" stroke="#8A5010" strokeWidth="3" strokeLinecap="round" fill="none"/>

      {/* Body crease */}
      <rect x="19" y="43" width="42" height="2" rx="1" fill="#9A6010" opacity="0.2"/>

      {/* Front pocket */}
      <rect x="25" y="46" width="30" height="20" rx="5" fill="#A86820"/>
      <line x1="33" y1="56" x2="47" y2="56" stroke="#8A5010" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Book 1 — forest green */}
      <g className="tt-book">
        <rect x="27" y="13" width="26" height="15" rx="2.5" fill="#4D8A18"/>
        <rect x="27" y="13" width="4.5" height="15" rx="1.5" fill="#3B6D11"/>
        <rect x="34" y="17" width="12" height="2.5" rx="1" fill="#EAF3DE" opacity="0.7"/>
        <rect x="34" y="21" width="8" height="2" rx="1" fill="#EAF3DE" opacity="0.45"/>
      </g>
      {/* Book 2 — amber */}
      <g className="tt-book tt-book-b">
        <rect x="27" y="13" width="26" height="15" rx="2.5" fill="#FAC775"/>
        <rect x="27" y="13" width="4.5" height="15" rx="1.5" fill="#BA7517"/>
        <rect x="34" y="17" width="12" height="2.5" rx="1" fill="white" opacity="0.7"/>
        <rect x="34" y="21" width="8" height="2" rx="1" fill="white" opacity="0.45"/>
      </g>
      {/* Book 3 — lavender */}
      <g className="tt-book tt-book-c">
        <rect x="27" y="13" width="26" height="15" rx="2.5" fill="#A888CC"/>
        <rect x="27" y="13" width="4.5" height="15" rx="1.5" fill="#7A60A0"/>
        <rect x="34" y="17" width="12" height="2.5" rx="1" fill="white" opacity="0.7"/>
        <rect x="34" y="21" width="8" height="2" rx="1" fill="white" opacity="0.45"/>
      </g>
    </svg>
  )
}

function BentoLoader() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <style>{`
        @keyframes tt-bento-pop {
          0%   { transform: scale(0); opacity: 0; }
          14%  { transform: scale(1.2); opacity: 1; }
          22%  { transform: scale(1); opacity: 1; }
          72%  { transform: scale(1); opacity: 1; }
          86%  { transform: scale(0.1); opacity: 0; }
          100% { transform: scale(0); opacity: 0; }
        }
        .tt-bite {
          animation: tt-bento-pop 2.8s ease-in-out infinite backwards;
          transform-box: fill-box;
          transform-origin: center;
        }
        .tt-bite-2 { animation-delay: 0.5s; }
        .tt-bite-3 { animation-delay: 1.0s; }
        .tt-bite-4 { animation-delay: 1.5s; }
      `}</style>

      {/* Box body */}
      <rect x="8" y="14" width="64" height="60" rx="10" fill="#C48530"/>
      {/* Lid bar */}
      <rect x="8" y="14" width="64" height="9" rx="7" fill="#BA7517"/>
      {/* Inner tray */}
      <rect x="11" y="26" width="58" height="45" rx="7" fill="#F5E8D0"/>
      {/* Horizontal divider */}
      <rect x="11" y="47" width="58" height="3" rx="1.5" fill="#C48530"/>
      {/* Vertical divider */}
      <rect x="38.5" y="26" width="3" height="45" rx="1.5" fill="#C48530"/>
      {/* Lid clasp */}
      <rect x="33" y="11" width="14" height="6" rx="3" fill="#9A6010"/>

      {/* TL: Broccoli */}
      <g className="tt-bite">
        <rect x="23" y="37" width="4" height="7" rx="1" fill="#3B6D11"/>
        <circle cx="25" cy="32" r="7" fill="#4D8A18"/>
        <circle cx="20.5" cy="35.5" r="4" fill="#4D8A18"/>
        <circle cx="29.5" cy="35.5" r="4" fill="#4D8A18"/>
        <circle cx="25" cy="30.5" r="1.5" fill="#639922" opacity="0.7"/>
        <circle cx="21.5" cy="34" r="1" fill="#639922" opacity="0.5"/>
      </g>

      {/* TR: Onigiri */}
      <g className="tt-bite tt-bite-2">
        <path d="M48 42 Q56 24 64 42 Z" fill="#F0EDE0"/>
        <rect x="51" y="33" width="10" height="7" rx="1" fill="#1C1C0A" opacity="0.4"/>
        <circle cx="56" cy="30" r="1.5" fill="#DDD0B0" opacity="0.7"/>
        <circle cx="60.5" cy="29.5" r="1" fill="#DDD0B0" opacity="0.5"/>
      </g>

      {/* BL: Carrot */}
      <g className="tt-bite tt-bite-3">
        <path d="M19.5 59 Q18 67 25 69 Q32 67 30.5 59 Z" fill="#E87020"/>
        <rect x="23" y="57" width="4" height="4" rx="1" fill="#D06010" opacity="0.4"/>
        <path d="M21.5 59 Q20 53 23 50" stroke="#3B6D11" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M25 58 Q25.5 53 28 50.5" stroke="#3B6D11" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M28 59 Q30 54 31.5 52" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </g>

      {/* BR: Cherries */}
      <g className="tt-bite tt-bite-4">
        <path d="M52 56 Q56 51 60 56" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <circle cx="51" cy="62" r="5.5" fill="#C02828"/>
        <circle cx="59" cy="62" r="5.5" fill="#D03434"/>
        <circle cx="49.5" cy="60" r="1.5" fill="white" opacity="0.45"/>
        <circle cx="57.5" cy="60" r="1.5" fill="white" opacity="0.45"/>
      </g>
    </svg>
  )
}

export default function PageLoader({ message = 'Loading…' }) {
  const isBackpack = useRef(Math.random() < 0.5).current
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '16px' }}>
      {isBackpack ? <BackpackLoader /> : <BentoLoader />}
      <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9375rem' }}>{message}</p>
    </div>
  )
}
