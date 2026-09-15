import fs from 'fs';
import { execSync } from 'child_process';

const svgLogo = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1050 460" width="1050" height="460">
  <defs>
    <!-- Soft authentic drop shadow matching the brand reference -->
    <filter id="text-shadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="1" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.25" />
    </filter>
    <filter id="traveler-shadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="1" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.20" />
    </filter>
  </defs>

  <!-- Clean Canvas Background -->
  <rect width="100%" height="100%" fill="#ffffff"/>

  <!-- Three Overlapping Solid Colored Circles (Sky Blue, Coral Red, Purple) -->
  <!-- 1. Left Circle: Bright Sky Cyan Blue -->
  <circle cx="215" cy="230" r="185" fill="#00A4E4" />

  <!-- 2. Middle Circle: Warm Coral Red -->
  <circle cx="495" cy="230" r="185" fill="#FA4936" />

  <!-- 3. Right Circle: Vibrant Royal Purple -->
  <circle cx="775" cy="230" r="185" fill="#9333EA" />

  <!-- Registered Trademark (R) in top right -->
  <g transform="translate(970, 48)">
    <circle cx="0" cy="0" r="22" fill="none" stroke="#0F172A" stroke-width="4.5"/>
    <text x="0" y="8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="900" fill="#0F172A" text-anchor="middle">R</text>
  </g>

  <!-- Traveler Pictogram (Wheeled Suitcase Trolley + Walking Person in Left Blue Circle) -->
  <g filter="url(#traveler-shadow)">
    <!-- Traveler Head -->
    <circle cx="115" cy="115" r="13" fill="#ffffff" />
    
    <!-- Torso -->
    <path d="M 115 128 L 108 190" stroke="#ffffff" stroke-width="7" stroke-linecap="round" fill="none" />
    
    <!-- Left Arm pulling luggage trolley handle -->
    <path d="M 112 142 L 78 152" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" fill="none" />
    
    <!-- Right Arm swinging gently -->
    <path d="M 112 142 L 126 172" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" fill="none" />
    
    <!-- Left Leg stepping forward -->
    <path d="M 108 190 L 92 254" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round" fill="none" />
    
    <!-- Right Leg stepping back -->
    <path d="M 108 190 L 128 250" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round" fill="none" />

    <!-- Wheeled Suitcase Trolley (tilted back) -->
    <g transform="translate(56, 202) rotate(-14)">
      <!-- Luggage bag body -->
      <rect x="-18" y="0" width="36" height="52" rx="7" fill="#ffffff" />
      <!-- Luggage details -->
      <line x1="-12" y1="18" x2="12" y2="18" stroke="#00A4E4" stroke-width="1.5" opacity="0.3"/>
      <!-- Trolley pull handle extending up to traveler hand -->
      <path d="M -7 0 L -7 -52 M 7 0 L 7 -52 M -9 -52 L 9 -52" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <!-- Small wheels at base -->
      <circle cx="-11" cy="54" r="3.5" fill="#ffffff" />
      <circle cx="11" cy="54" r="3.5" fill="#ffffff" />
    </g>
  </g>

  <!-- Main Cursive Brand Typography: 'Trip My Tour' -->
  <g font-family="'Pacifico', cursive" font-size="168px" fill="#ffffff" filter="url(#text-shadow)">
    <!-- 'Trip' spanning Blue and beginning of Red -->
    <text x="32" y="278">Trip</text>

    <!-- 'My' centered on Red circle -->
    <text x="355" y="278">My</text>

    <!-- 'Tour' centered on Purple circle -->
    <text x="650" y="278">Tour</text>
  </g>
</svg>
`;

// Save SVG vector file
fs.writeFileSync('public/logo.svg', svgLogo);
console.log('Successfully written public/logo.svg');

// Convert SVG to high-res PNG (1200x525)
try {
  execSync('rsvg-convert -w 1200 public/logo.svg -o public/logo.png');
  console.log('Successfully rendered public/logo.png (1200x525)');
} catch (e) {
  console.error('rsvg-convert error:', e.message);
}

// Also create a square icon version for browser tab favicon and mobile touch icon
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#ffffff"/>
  <g transform="translate(256, 256) scale(0.46) translate(-525, -230)">
    <!-- Overlapping Circles -->
    <circle cx="215" cy="230" r="185" fill="#00A4E4" />
    <circle cx="495" cy="230" r="185" fill="#FA4936" />
    <circle cx="775" cy="230" r="185" fill="#9333EA" />

    <!-- Traveler -->
    <circle cx="115" cy="115" r="13" fill="#ffffff" />
    <path d="M 115 128 L 108 190" stroke="#ffffff" stroke-width="7" stroke-linecap="round" fill="none" />
    <path d="M 112 142 L 78 152" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" fill="none" />
    <path d="M 112 142 L 126 172" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" fill="none" />
    <path d="M 108 190 L 92 254" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round" fill="none" />
    <path d="M 108 190 L 128 250" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round" fill="none" />
    <g transform="translate(56, 202) rotate(-14)">
      <rect x="-18" y="0" width="36" height="52" rx="7" fill="#ffffff" />
      <path d="M -7 0 L -7 -52 M 7 0 L 7 -52 M -9 -52 L 9 -52" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <circle cx="-11" cy="54" r="3.5" fill="#ffffff" />
      <circle cx="11" cy="54" r="3.5" fill="#ffffff" />
    </g>

    <!-- Typography -->
    <g font-family="'Pacifico', cursive" font-size="168px" fill="#ffffff">
      <text x="32" y="278">Trip</text>
      <text x="355" y="278">My</text>
      <text x="650" y="278">Tour</text>
    </g>
  </g>
</svg>
`;

fs.writeFileSync('public/favicon.svg', svgIcon);
try {
  execSync('rsvg-convert -w 192 public/favicon.svg -o public/favicon.png');
  console.log('Successfully rendered public/favicon.png (192x192)');
} catch (e) {
  console.error('favicon render error:', e.message);
}
