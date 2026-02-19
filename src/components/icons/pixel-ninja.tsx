export function PixelNinja({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      shapeRendering="crispEdges"
    >
      {/* Ninja head/bandana - pixel art style */}
      <rect x="8" y="4" width="8" height="2" fill="currentColor" />
      <rect x="6" y="6" width="12" height="2" fill="currentColor" />
      <rect x="6" y="8" width="12" height="4" fill="currentColor" />
      
      {/* Eyes (white slits) */}
      <rect x="8" y="9" width="3" height="1" fill="#ffffff" />
      <rect x="13" y="9" width="3" height="1" fill="#ffffff" />
      
      {/* Bandana knot/tails flowing back */}
      <rect x="4" y="5" width="2" height="2" fill="currentColor" />
      <rect x="2" y="6" width="2" height="2" fill="currentColor" />
      
      {/* Body */}
      <rect x="7" y="12" width="10" height="6" fill="currentColor" />
      
      {/* Belt/sash */}
      <rect x="7" y="14" width="10" height="2" fill="#ffffff" opacity="0.3" />
      
      {/* Arms */}
      <rect x="4" y="13" width="3" height="4" fill="currentColor" />
      <rect x="17" y="13" width="3" height="4" fill="currentColor" />
      
      {/* Legs/feet */}
      <rect x="7" y="18" width="3" height="3" fill="currentColor" />
      <rect x="14" y="18" width="3" height="3" fill="currentColor" />
      
      {/* Ninja star/shuriken detail on chest */}
      <rect x="11" y="15" width="2" height="2" fill="#ffffff" opacity="0.5" />
    </svg>
  )
}
