import React from 'react';
import './chart.css';
import './App.js'

const NorthIndianChart = ({ chartData }) => {
  if (!chartData || !chartData.houses || !chartData.planets) {
    return <div>No chart data available</div>;
  }

  // Get planets in each house
  const getPlanetsInHouse = (houseNum) => {
    const planetsInHouse = [];
    if (!chartData.planets) return planetsInHouse;
    
    Object.entries(chartData.planets).forEach(([planetName, planetInfo]) => {
      if (planetInfo.house === houseNum) {
        planetsInHouse.push(planetName);
      }
    });
    return planetsInHouse;
  };

  // Get the zodiac number for a sign (1=Aries, 2=Taurus, etc.)
  const getZodiacNumber = (sign) => {
    const zodiacSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    return zodiacSigns.indexOf(sign) + 1;
  };

  // Define exact positions for each house (top, left percentages)
  const housePositions = {
    1: { top: '30%', left: '42%', width: '16%', height: '16%' },     // Center (Ascendant)
    2: { top: '12%', left: '18%', width: '22%', height: '22%' },     // Right side, upper
    3: { top: '20%', left: '8%', width: '22%', height: '22%' },     // Right side, lower
    4: { top: '40%', left: '20%', width: '22%', height: '22%' },     // Bottom-right
    5: { top: '60%', left: '5%', width: '22%', height: '22%' },     // Bottom center
    6: { top: '70%', left: '20%', width: '22%', height: '22%' },     // Bottom-left
    7: { top: '52%', left: '40%', width: '22%', height: '22%' },     // Left side, lower
    8: { top: '70%', left: '60%', width: '22%', height: '22%' },     // Left side, upper
    9: { top: '60%', left: '70%', width: '22%', height: '22%' },      // Top-left area
    10: { top: '40%', left: '55%', width: '22%', height: '22%' },     // Top-right area
    11: { top: '18%', left: '72%', width: '22%', height: '22%' },     // Top-right corner
    12: { top: '8%', left: '60%', width: '22%', height: '22%' }       // Top-left corner
  };

  const HouseBox = ({ houseNum }) => {
    const houseInfo = chartData.houses[houseNum];
    const planets = getPlanetsInHouse(houseNum);
    const position = housePositions[houseNum];
    const zodiacNum = getZodiacNumber(houseInfo.sign);

    return (
      <div 
        className="house-box-absolute"
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height
        }}
      >
        <div className="house-number">{zodiacNum}</div>
        <div className="house-sign-name">{houseInfo.sign}</div>
        {planets.length > 0 && (
          <div className="planet-list">
            {planets.map((planet, idx) => (
              <span key={idx} className="planet-badge">{planet}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="north-indian-chart-container">
      <svg className="chart-diamond" viewBox="0 0 600 600">
        {/* Draw the outer square */}
        <rect 
          x="50" 
          y="50" 
          width="500" 
          height="500" 
          fill="white" 
          stroke="#333" 
          strokeWidth="2"
        />
        {/* Draw the main diagonal lines (creating the diamond) */}
        <line x1="50" y1="50" x2="550" y2="550" stroke="#333" strokeWidth="2" />
        <line x1="550" y1="50" x2="50" y2="550" stroke="#333" strokeWidth="2" />
        
        {/* Draw the inner diamond (connecting midpoints of outer diamond sides) */}
        <line x1="300" y1="50" x2="550" y2="300" stroke="#333" strokeWidth="1" />
        <line x1="550" y1="300" x2="300" y2="550" stroke="#333" strokeWidth="1" />
        <line x1="300" y1="550" x2="50" y2="300" stroke="#333" strokeWidth="1" />
        <line x1="50" y1="300" x2="300" y2="50" stroke="#333" strokeWidth="1" />
      </svg>
      
      <div className="houses-overlay">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
          <HouseBox key={num} houseNum={num} />
        ))}
        
      </div>
    </div>
  );
};

export default NorthIndianChart;