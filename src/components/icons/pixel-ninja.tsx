export function PixelNinja({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      shapeRendering="crispEdges"
    >
      {/* BMO-style console body */}
      <rect x="6" y="5" width="12" height="14" rx="1" fill="currentColor" />
      
      {/* Screen/face area (dark inner rectangle) */}
      <rect x="8" y="7" width="8" height="6" fill="#000000" opacity="0.2" />
      
      {/* BMO eyes (pixel dots) */}
      <rect x="9" y="9" width="2" height="2" fill="#ffffff" />
      <rect x="13" y="9" width="2" height="2" fill="#ffffff" />
      
      {/* BMO mouth (small line) */}
      <rect x="10" y="12" width="4" height="1" fill="#ffffff" opacity="0.7" />
      
      {/* Ninja headband */}
      <rect x="6" y="5" width="12" height="2" fill="currentColor" />
      <rect x="7" y="6" width="10" height="1" fill="#000000" opacity="0.3" />
      
      {/* Headband knot on side */}
      <rect x="4" y="5" width="2" height="2" fill="currentColor" />
      <rect x="3" y="6" width="1" height="2" fill="currentColor" />
      
      {/* Headband tails flowing */}
      <rect x="2" y="7" width="2" height="1" fill="currentColor" />
      <rect x="3" y="8" width="1" height="1" fill="currentColor" />
      
      {/* BMO button details on body */}
      <rect x="8" y="15" width="2" height="2" fill="#ffffff" opacity="0.4" />
      <rect x="11" y="15" width="3" height="1" fill="#ffffff" opacity="0.4" />
      <rect x="11" y="17" width="3" height="1" fill="#ffffff" opacity="0.4" />
      
      {/* BMO arms (small and blocky) */}
      <rect x="4" y="11" width="2" height="3" fill="currentColor" />
      <rect x="18" y="11" width="2" height="3" fill="currentColor" />
      
      {/* BMO legs */}
      <rect x="8" y="19" width="2" height="2" fill="currentColor" />
      <rect x="14" y="19" width="2" height="2" fill="currentColor" />
      
      {/* Small ninja mask detail */}
      <rect x="8" y="8" width="8" height="1" fill="#000000" opacity="0.15" />
    </svg>
  )
}
