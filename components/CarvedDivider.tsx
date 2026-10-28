/**
 * The Carved Divider — the Temple's carving language as a quiet band
 * between sections: pomegranates and palm flourishes in fine gold
 * line-work (1 Kings 6–7), crowned by Jason on Oct 27, 2026 from three
 * hand-drawn variants ("Crown the top — pomegranate band").
 *
 * The artwork is carried faithfully from the crowned source file
 * (divider-motif-v1-pomegranate.svg, 1200×64 viewBox): one shared
 * pomegranate drawing — round fruit, three-point crown calyx, three
 * seed dots, two small leaves — repeated along a broken gold rule,
 * with flourish sprays between and a larger medallion pomegranate
 * (1.28×) at the center. The source file's solid preview backdrop is
 * not carried; the band is transparent and rests on the page ground.
 *
 * Pure decoration: aria-hidden, no text, no title, never focusable.
 * It replaces the plain vine-divider above the homepage book grid;
 * other vine-divider instances are untouched for now.
 */
export default function CarvedDivider({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`mx-auto w-full max-w-3xl ${className}`}
    >
      <svg
        viewBox="0 0 1200 64"
        className="h-auto w-full"
        style={{ opacity: 0.85 }}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <g
            id="pom"
            stroke="#d9a441"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M-4,-12 C-9,-16 -13.5,-15.5 -15.5,-11 C-11.5,-8.5 -6.5,-9 -4,-12 Z" />
            <path d="M4,-12 C9,-16 13.5,-15.5 15.5,-11 C11.5,-8.5 6.5,-9 4,-12 Z" />
            <path d="M-4.5,-11 L-5.5,-16.5 L-2.2,-13.6 L0,-17.5 L2.2,-13.6 L5.5,-16.5 L4.5,-11" />
            <path d="M-4.5,-11 C-9.5,-10 -12,-5 -12,1 C-12,8 -6.5,13 0,13 C6.5,13 12,8 12,1 C12,-5 9.5,-10 4.5,-11" />
            <circle cx="-3.5" cy="3" r="1.15" fill="#d9a441" stroke="none" />
            <circle cx="0.8" cy="5.8" r="1.15" fill="#d9a441" stroke="none" />
            <circle cx="3.8" cy="2.2" r="1.15" fill="#d9a441" stroke="none" />
          </g>
          <g
            id="flourishL"
            stroke="#d9a441"
            fill="none"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M0,0 Q-13,-13 -29,-14" />
            <path d="M-8.1,-6.7 q-1.5,-6 -5.5,-9.5" />
            <path d="M-15.2,-10.6 q0,-6.5 -3,-10.5" />
            <path d="M-22.7,-13.1 q1.5,-5 0,-9.5" />
            <path d="M-9.5,-7 q-3.5,4 -8,4.5" />
            <path d="M-17,-11 q-2.5,4.5 -7,5.5" />
          </g>
          <g id="flourish">
            <use href="#flourishL" />
            <use href="#flourishL" transform="scale(-1,1)" />
            <path
              d="M0,0 C-2.2,-4 -2.2,-8.5 0,-12.5 C2.2,-8.5 2.2,-4 0,0 Z"
              stroke="#d9a441"
              fill="none"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <g
            id="frondL"
            stroke="#d9a441"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M0,0 Q-64,-30 -146,-26" />
            <path d="M-26.3,-10.6 q-5,-10 -13,-13" />
            <path d="M-54.1,-18.6 q-3,-11 -10,-15" />
            <path d="M-83.3,-23.8 q0,-9 -5,-12" />
            <path d="M-113.9,-26.2 q3,-8 0,-13" />
            <path d="M-137.9,-26.3 q6,-5 7,-11" />
            <path d="M-26.3,-10.6 q-7,4 -15,4" />
            <path d="M-54.1,-18.6 q-6,6 -14,7" />
            <path d="M-83.3,-23.8 q-4,6 -11,8" />
            <path d="M-113.9,-26.2 q-2,5 -8,7" />
          </g>
          <g
            id="shortfrondL"
            stroke="#d9a441"
            fill="none"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M0,0 Q-52,-14 -84,-10" />
            <path d="M-29.4,-6.8 q-2,-6 -7,-8" />
            <path d="M-55.2,-10.3 q0,-6 -3,-9" />
            <path d="M-74,-10.8 q1,-4 0,-8" />
            <path d="M-29.4,-6.8 q-4,3 -9,3" />
            <path d="M-55.2,-10.3 q-3,4 -8,5" />
          </g>
        </defs>
        <line x1="36" y1="32" x2="168" y2="32" stroke="#d9a441" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="200" y1="32" x2="240" y2="32" stroke="#d9a441" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="308" y1="32" x2="360" y2="32" stroke="#d9a441" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="392" y1="32" x2="442" y2="32" stroke="#d9a441" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="510" y1="32" x2="578" y2="32" stroke="#d9a441" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="622" y1="32" x2="690" y2="32" stroke="#d9a441" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="758" y1="32" x2="808" y2="32" stroke="#d9a441" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="840" y1="32" x2="892" y2="32" stroke="#d9a441" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="960" y1="32" x2="1000" y2="32" stroke="#d9a441" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="1032" y1="32" x2="1164" y2="32" stroke="#d9a441" strokeWidth="1.5" strokeLinecap="round" />
        <use href="#pom" transform="translate(184,32)" />
        <use href="#pom" transform="translate(376,32)" />
        <use href="#pom" transform="translate(824,32)" />
        <use href="#pom" transform="translate(1016,32)" />
        <use href="#flourish" transform="translate(274,32)" />
        <use href="#flourish" transform="translate(476,32)" />
        <use href="#flourish" transform="translate(724,32)" />
        <use href="#flourish" transform="translate(926,32)" />
        <use href="#pom" transform="translate(600,32) scale(1.28)" />
      </svg>
    </div>
  );
}
