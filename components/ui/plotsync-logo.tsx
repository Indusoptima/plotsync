interface PlotSyncLogoProps {
  size?: number
  className?: string
}

export function PlotSyncLogo({ size = 32, className = "" }: PlotSyncLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer frame - representing building outline */}
      <rect 
        x="2" 
        y="2" 
        width="28" 
        height="28" 
        rx="4" 
        stroke="url(#gradient)" 
        strokeWidth="2" 
        fill="none" 
      />
      
      {/* Vertical divider - center line */}
      <line 
        x1="16" 
        y1="6" 
        x2="16" 
        y2="26" 
        stroke="url(#gradient)" 
        strokeWidth="1.5" 
      />
      
      {/* Horizontal dividers - floor plan sections */}
      <line 
        x1="6" 
        y1="12" 
        x2="26" 
        y2="12" 
        stroke="url(#gradient)" 
        strokeWidth="1.5" 
      />
      <line 
        x1="6" 
        y1="20" 
        x2="26" 
        y2="20" 
        stroke="url(#gradient)" 
        strokeWidth="1.5" 
      />
      
      {/* Room indicators - small squares in grid sections */}
      <rect 
        x="8" 
        y="8" 
        width="2" 
        height="2" 
        fill="url(#gradient)" 
        rx="0.5" 
      />
      <rect 
        x="20" 
        y="8" 
        width="2" 
        height="2" 
        fill="url(#gradient)" 
        rx="0.5" 
      />
      <rect 
        x="8" 
        y="15" 
        width="2" 
        height="2" 
        fill="url(#gradient)" 
        rx="0.5" 
      />
      <rect 
        x="20" 
        y="15" 
        width="2" 
        height="2" 
        fill="url(#gradient)" 
        rx="0.5" 
      />
      <rect 
        x="8" 
        y="22" 
        width="2" 
        height="2" 
        fill="url(#gradient)" 
        rx="0.5" 
      />
      <rect 
        x="20" 
        y="22" 
        width="2" 
        height="2" 
        fill="url(#gradient)" 
        rx="0.5" 
      />
      
      {/* Gradient definition */}
      <defs>
        <linearGradient 
          id="gradient" 
          x1="2" 
          y1="2" 
          x2="30" 
          y2="30" 
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  )
}
