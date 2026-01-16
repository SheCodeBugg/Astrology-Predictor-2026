import React from 'react';

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Position each sign in the diamond chart - matching the image layout
const SIGN_POSITIONS = {
  Capricorn:   { x: 200, y: 80, house: 10 },   // Top center
  Aquarius:    { x: 100, y: 80, house: 11 },   // Top left
  Pisces:      { x: 50, y: 140, house: 12 },   // Left top
  Aries:       { x: 50, y: 260, house: 1 },    // Left bottom
  Taurus:      { x: 100, y: 320, house: 2 },   // Bottom left
  Gemini:      { x: 200, y: 320, house: 3 },   // Bottom center
  Cancer:      { x: 300, y: 320, house: 4 },   // Bottom right
  Leo:         { x: 350, y: 260, house: 5 },   // Right bottom
  Virgo:       { x: 350, y: 140, house: 6 },   // Right top
  Libra:       { x: 300, y: 80, house: 7 },    // Top right
  Scorpio:     { x: 350, y: 80, house: 8 },    // Far top right
  Sagittarius: { x: 300, y: 50, house: 9 }     // Top right corner
};

const NorthIndianChart = ({ 
  chartData = null,
  size = 450
}) => {
  // Get ascendant sign from chartData
  const ascendantSign = chartData?.houses?.[1]?.sign || "Aries";
  
  // Calculate house number for each sign based on ascendant
  const getHouseForSign = (sign) => {
    const ascIndex = SIGNS.indexOf(ascendantSign);
    const signIndex = SIGNS.indexOf(sign);
    return ((signIndex - ascIndex + 12) % 12) + 1;
  };

  // Group planets by their sign
  const planetsBySign = {};
  if (chartData?.planets) {
    Object.entries(chartData.planets).forEach(([planetName, planetInfo]) => {
      const sign = planetInfo.sign;
      if (!planetsBySign[sign]) {
        planetsBySign[sign] = [];
      }
      planetsBySign[sign].push(planetName);
    });
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
      <svg 
        viewBox='0 0 400 400'
        width={size}
        height={size}
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* Outer square rotated 45 degrees (diamond) */}
        <polygon
          points='200,20 380,200 200,380 20,200'
          fill='white'
          stroke='#222'
          strokeWidth='2'
        />

        {/* Inner cross - creates the basic 4 quadrants */}
        <line x1="200" y1="10" x2="200" y2="390" stroke="#222" strokeWidth="2" />
        <line x1="10" y1="200" x2="390" y2="200" stroke="#222" strokeWidth="2" />

        {/* Top left to bottom right diagonal */}
        <line x1="10" y1="200" x2="200" y2="10" stroke="#222" strokeWidth="2" />
        <line x1="200" y1="390" x2="390" y2="200" stroke="#222" strokeWidth="2" />
        
        {/* Top right to bottom left diagonal */}
        <line x1="200" y1="10" x2="390" y2="200" stroke="#222" strokeWidth="2" />
        <line x1="10" y1="200" x2="200" y2="390" stroke="#222" strokeWidth="2" />

        {/* Additional lines to create the 12 houses */}
        {/* Top section dividers */}
        <line x1="105" y1="105" x2="200" y2="10" stroke="#222" strokeWidth="2" />
        <line x1="295" y1="105" x2="200" y2="10" stroke="#222" strokeWidth="2" />
        
        {/* Bottom section dividers */}
        <line x1="105" y1="295" x2="200" y2="390" stroke="#222" strokeWidth="2" />
        <line x1="295" y1="295" x2="200" y2="390" stroke="#222" strokeWidth="2" />
        
        {/* Left section dividers */}
        <line x1="10" y1="200" x2="105" y2="105" stroke="#222" strokeWidth="2" />
        <line x1="10" y1="200" x2="105" y2="295" stroke="#222" strokeWidth="2" />
        
        {/* Right section dividers */}
        <line x1="390" y1="200" x2="295" y2="105" stroke="#222" strokeWidth="2" />
        <line x1="390" y1="200" x2="295" y2="295" stroke="#222" strokeWidth="2" />

        {/* Render each house with sign name, house number, and planets */}
        {SIGNS.map((sign) => {
          const pos = SIGN_POSITIONS[sign];
          const houseNum = getHouseForSign(sign);
          const planets = planetsBySign[sign] || [];
          const isAscendant = houseNum === 1;

          return (
            <g key={sign}>
              {/* Ascendant highlight background */}
              {isAscendant && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r='50'
                  fill='#667eea'
                  opacity='0.12'
                />
              )}

              {/* Sign name */}
              <text
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                fontSize="10"
                fontWeight="500"
                fill="#555"
              >
                {sign} Sign
              </text>

              {/* House number */}
              <text
                x={pos.x}
                y={pos.y + 6}
                textAnchor="middle"
                fontSize="16"
                fontWeight={isAscendant ? "700" : "600"}
                fill={isAscendant ? "#667eea" : "#888"}
              >
                {houseNum}
              </text>

              {/* Planets in this sign */}
              {planets.map((planet, i) => (
                <text
                  key={planet}
                  x={pos.x}
                  y={pos.y + 22 + i * 14}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#2563eb"
                >
                  {planet}
                </text>
              ))}
            </g>
          );
        })}

        {/* Center "Ascendant" label */}
        <text
          x="200"
          y="12"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#667eea"
        >
          Ascendant
        </text>
      </svg>
    </div>
  );
};

// Demo component with sample data
const Demo = () => {
  const [sampleData] = React.useState({
    houses: {
      1: { sign: "Capricorn" },
      2: { sign: "Aquarius" },
      3: { sign: "Pisces" }
    },
    planets: {
      Sun: { sign: "Gemini", degree_in_sign: 25.4 },
      Moon: { sign: "Sagittarius", degree_in_sign: 12.8 },
      Mars: { sign: "Leo", degree_in_sign: 8.2 },
      Mercury: { sign: "Gemini", degree_in_sign: 18.5 },
      Jupiter: { sign: "Pisces", degree_in_sign: 22.1 },
      Venus: { sign: "Taurus", degree_in_sign: 15.3 },
      Saturn: { sign: "Aquarius", degree_in_sign: 9.7 },
      Rahu: { sign: "Aries", degree_in_sign: 3.2 },
      Ketu: { sign: "Libra", degree_in_sign: 3.2 }
    }
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>North Indian Vedic Chart</h2>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '20px' }}>
        Sample chart with Capricorn Ascendant
      </p>
      <NorthIndianChart chartData={sampleData} />
      
      <div style={{ marginTop: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px' }}>Integration Instructions:</h3>
        <ol style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li>Import this component: <code>import NorthIndianChart from './chart.js';</code></li>
          <li>Pass your chartData prop: <code>&lt;NorthIndianChart chartData={'{chartData}'} /&gt;</code></li>
          <li>The chart will automatically read the ascendant from <code>chartData.houses[1].sign</code></li>
          <li>Planets will be placed in their respective signs based on <code>chartData.planets</code></li>
        </ol>
      </div>
    </div>
  );
};

export default Demo;