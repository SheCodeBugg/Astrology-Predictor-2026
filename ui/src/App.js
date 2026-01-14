import React, { useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';
import './App.css';

const API_BASE = 'http://localhost:5001';


function HouseCard({ houseNum, houseInfo }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      {/* House Card -Clickable */}
      <div 
        onClick={() => setIsOpen(true)}
        className="house-card"
        style={{cursor: 'pointer'}}
      >
        <strong>House {houseNum}</strong>
        <span>{houseInfo.sign}</span>
      </div>

      {/* Modal */}
      <Modal 
        open={isOpen} 
        onClose={() => setIsOpen(false)} 
        center
        classNames={{
          modal: 'customModal',
          closeButton: 'customCloseButton'
        }}
        styles={{
          modal: {
            maxWidth: '500px',
            padding: '30px',
            borderRadius: '10px'
          },
          closeButton: {
            top: '10px',
            right: '10px',
            maxWidth: '30px'
          }
        }}
      >
        <h2 style={{ marginBottom: '20px' }}>House {houseNum}</h2>
        <div style={{marginBottom: '15px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '5px' }}>Life Area</h3>
          <p>Information about this house's meaning...</p>
        </div>
      </Modal>
    </>
  );
}

function DashaTimeline({ chartData, birthData }) {
  const [mahadashas, setMahadashas] = useState([]);
  const [expandedDashas, setExpandedDashas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chartData|| !chartData.planets || !chartData.planets.Moon) return;

    const fetchMahadashas = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/dashas/mahadashas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birth_data: {
              year: birthData.year,
              month: birthData.month,
              day: birthData.day
            },
            moon_nakshatra_degree: chartData.planets.Moon.degree_in_nak,
            moon_nakshatra: chartData.planets.Moon.nakshatra
          })
        });
      
        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setMahadashas(data.mahadashas);
        }
      } catch (err) {
        console.error('Failed to fetch Mahadashas:', err);
        setError('Failed to fetch Mahadashas: ' + err.message);
      }
      setLoading(false);
    };

    fetchMahadashas();
  }, [chartData, birthData]);

    const toggleExpand = async (dashaId, level, dashaData) => {
      // If already expanded, just collapse
      if (expandedDashas[dashaId]) {
        setExpandedDashas(prev => ({ ...prev, [dashaId]: { ...prev[dashaId], expanded: false } }));
        return;
      }

      // Fetch sub-periods based on level
      let endpoint = '';
      let bodyObj = {};
      let childrenKey = '';

      if (level === 'Mahadasha') {
        endpoint = '/api/dashas/antardashas';
        childrenKey = 'antardashas';
        bodyObj = {
          birth_data: {
              year: birthData.year,
              month: birthData.month,
              day: birthData.day
            },
          moon_nakshatra_degree: chartData.planets.Moon.degree_in_nak,
          moon_nakshatra: chartData.planets.Moon.nakshatra,
          mahadasha_planet: dashaData.planet,
          start_date: dashaData.start_date,
          mahadasha_years: dashaData.years
        };
      } else if (level === 'antardasha') {
        endpoint = '/api/dashas/pratyantardashas';
        childrenKey = 'pratyantardashas'
        bodyObj = {
          birth_data: {
              year: birthData.year,
              month: birthData.month,
              day: birthData.day
            },
          moon_nakshatra_degree: chartData.planets.Moon.degree_in_nak,
          moon_nakshatra: chartData.planets.Moon.nakshatra,
          mahadasha_planet: dashaData.parent,
          antardasha_planet: dashaData.planet,
          start_date: dashaData.start_date,
          antardasha_years: dashaData.years
        };
      } else {

        return;
      }

      try {
        console.log('Calling endpoint:', endpoint);
        console.log('With body:', bodyObj);
      
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyObj)
        });

        const data = await response.json();

        console.log('Received data:', data);
        console.log('Children key:', childrenKey);
        console.log('Children data:', data[childrenKey]);

        if (data.error) {
          console.error('Error fetching sub_dashas:', data.error);
          return;
        }

        setExpandedDashas(prev => ({
          ...prev,
          [dashaId]: { expanded: true, children: data[childrenKey] }
        }));

        console.log('Updated expandedDashas for:', dashaId);
      } catch (err) {
        console.error('Failed to fetch sub-dashas:', err);
      }
    };

    const DashaPeriod = ({ dasha, level, indent = 0 }) => {
      const isExpanded = expandedDashas[dasha.id]?.expanded;
      const children = expandedDashas[dasha.id]?.children || [];
      const canExpand = level !== 'pratyantardasha'; // Stop at 3rd level

      if (isExpanded) {
        console.log(`Rendering ${level} - ${dasha.planet}:`, {
          isExpanded,
          childrenCount: children.length,
          children: children
        });
      }
      const displayLevel = level.charAt(0).toUpperCase() + level.slice(1);

      return (
        <div style={{ marginLeft: `${indent * 20}px` }}>
          <div 
            onClick={() => canExpand && toggleExpand(dasha.id, level, dasha)}
            style={{
              padding: '10px',
              margin: '5px 0',
              backgroundColor: getPlanetColor(dasha.planet),
              borderRadius: '5px',
              cursor: canExpand ? 'pointer' : 'default',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              {canExpand && <span>{isExpanded ? '▼' : '▶'}</span>}
              <strong> {dasha.planet}</strong>
              {level !== 'Mahadasha' && `(${dasha.parent})`}
            </div>
            <div style={{ fontSize: '0.9em' }}>
              {dasha.start_date} → {dasha.end_date}
              <span style={{ marginLeft: '10px', opacity: 0.8 }}>
                {dasha.years >= 1 
                  ? `${dasha.years} years` 
                  : dasha.months >= 1
                  ? `${dasha.months} months`
                  : `${dasha.days} days`
                }
              </span>
            </div>
          </div>

          {isExpanded && children.length > 0 && (
            <div>
              {children.map(child => (
                <DashaPeriod 
                  key={child.id} 
                  dasha={child} 
                  level={child.level}
                  indent={indent + 1}
                />
              ))}
            </div>
          )}
        </div>
      );
    };

    const getPlanetColor = (planet) => {
      const colors = {
        'Sun': '#FDB813',
        'Moon': '#C0C0C0',
        'Mars': '#CD5C5C',
        'Mercury': '#90EE90',
        'Jupiter': '#FFD700',
        'Venus': '#FFB6C1',
        'Saturn': '#4682B4',
        'Rahu': '#708090',
        'Ketu': '#A0522D'
      };
      return colors[planet] || '#E0E0E0';
    };

    if (loading) return <div>Loading Dashas...</div>;
    if (error) return <div className='error'>Error: {error}</div>;

    return (
      <div className="dasha-timeline">
        <h2>Vimshottari Dasha Timeline</h2>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {mahadashas && Array.isArray(mahadashas) && mahadashas.map(maha => (
            <DashaPeriod key={maha.id} dasha={maha} level="Mahadasha" />
          ))}
        </div>
      </div>
    );
}

function App() {
  // Function hook that lets us change the state of birthData
  const [birthData, setBirthData] = useState({
    year: 2000,
    month: 6,
    day: 16,
    hour: 1,
    mins: 11,
    secs: 0,
    lat: 33.03622,
    lon: -85.03133,
    tzoffset: -4.0,
    hsys: 'W'
  });

  // Fuctions 
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInputExpanded, setIsInputsExpanded] = useState(true);

  // Arrow function with async / await inside 
  const calculateChart = async () => {
    setLoading(true);
    setError(null);

    // Fetch data from API
    try {
      const response = await fetch(`${API_BASE}/api/chart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(birthData)
      });

      const data = await response.json();

      if (data.success) {
        setChartData(data);
        setIsInputsExpanded(false);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to API: ' + err.message);
    }
    setLoading(false)
  };

  // Reformat for collapse
  const formatDateTime = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = `${monthNames[birthData.month - 1]} ${birthData.day}, ${birthData.year}`;
    const time = `${String(birthData.hour).padStart(2, '0')}:${String(birthData.mins).padStart(2, '0')}:${String(birthData.secs).padStart(2, '0')}`;
    return `${date} at ${time}`;                    
  };

  const formatLocation = () => {
    const latDir = birthData.lat >= 0 ? 'N' : 'S';
    const lonDir = birthData.lon >= 0 ? 'E' : 'W';
    return `${Math.abs(birthData.lat).toFixed(4)}°${latDir}, ${Math.abs(birthData.lon).toFixed(4)}°${lonDir}`;
  };

  // Returned data
  return (
    <div className='App'>
      <header> <h1>Astrology Calculator</h1> </header>

      <div className='container'>
        <div className='input-section'>
          {!isInputExpanded && chartData ? (
            // Collapsed view - Summary card
            <div className='birth-summary-card'>
              <div className='birth-summary-content'>
                <h3>Birth Details</h3>
                <div className='birth-summary-info'>
                  <p><strong>Date & Time:</strong> {formatDateTime()}</p>
                  <p><strong>Location:</strong> {formatLocation()}</p>
                  <p><strong>Timezone:</strong> UTC{birthData.tzoffset >= 0 ? '+' : ''}{birthData.tzoffset}</p>
                </div>
              </div>
              <button
                className='edit-button'
                onClick={() => setIsInputsExpanded(true)}
              >
                ✏️ Edit
              </button>
            </div>
          ) : (
            // Expanded view - Full form
            <>
              <div className='input-header'>
                <h2>Birth Information</h2>
                {chartData && (
                  <button
                    className='collapse-button'
                    onClick={() => setIsInputsExpanded(false)}
                  >
                    ▲ Collapse
                  </button>
                )}
              </div>

          <div className='form-row'>
            <label>
              Year:
              <input
                type='number'
                value={birthData.year} // Display current value
                /* Event handler triggerd when input is changed. 
                Parse converts to number. ... 
                the spread operator copies the other elements in the library 
                */
                onChange={(e) => setBirthData({...birthData, year: parseInt(e.target.value)})} 
              />
            </label>

            <label>
              Month:
              <input
                type='number'
                min='1' max='12'
                value={birthData.month}
                onChange={(e) => setBirthData({...birthData, month: parseInt(e.target.value)})}
              />
            </label>

            <label>
              Day:
              <input
                type="number"
                min="1" max="31"
                value={birthData.day}
                onChange={(e) => setBirthData({...birthData, day: parseInt(e.target.value)})}
              />
            </label>
          </div>

          <div className='form-row'>
            <label>
              Hour (0-23):
              <input
                type='number'
                min='0' max='23'
                value={birthData.hour}
                onChange={(e) => setBirthData({...birthData, hour: parseInt(e.target.value)})}
              />
            </label>

            <label>
              Minutes:
              <input 
                type="number" 
                min="0" max="59"
                value={birthData.mins}
                onChange={(e) => setBirthData({...birthData, mins: parseInt(e.target.value)})}
              />
            </label>

            <label>
              Seconds:
              <input 
                type="number" 
                min="0" max="59"
                value={birthData.secs}
                onChange={(e) => setBirthData({...birthData, secs: parseInt(e.target.value)})}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Latitude:
              <input 
                type="number" 
                step="0.0001"
                value={birthData.lat}
                onChange={(e) => setBirthData({...birthData, lat: parseFloat(e.target.value)})}
              />
            </label>
            
            <label>
              Longitude:
              <input 
                type="number" 
                step="0.0001"
                value={birthData.lon}
                onChange={(e) => setBirthData({...birthData, lon: parseFloat(e.target.value)})}
              />
            </label>

            <label>
              Timezone Offset:
              <input 
                type="number"
                step="0.5"
                value={birthData.tzoffset}
                onChange={(e) => setBirthData({...birthData, tzoffset: parseFloat(e.target.value)})}
              />
            </label>
          </div>
            </>
          )}


          <button onClick={calculateChart} disabled={loading}> {/* if loading true but wont click */}
            {loading ? 'Calculating...' : 'Calculate Chart'} {/* ternary operator if true do a if false do b */}
          </button>

          {error && <div className='error'>{error}</div>} {/* If condition is true  → renders <Component /> */}
        </div>

        {chartData && chartData.success && (
          <div className='results-section'>
            <h2>Chart Results</h2>

            <div className='ascendant-box'>
              <h3>Ascendant</h3>
              <p>{chartData.ascendant?.toFixed(2)}°</p>
            </div>

            <div className='house-section'>
              <h3>Houses (Whole Sign System)</h3>
              <div className='houses-grid'>
                {/* check if data exists, convert objects into array then loops through it with .map to assign data to variables */}
                {chartData.houses && Object.entries(chartData.houses).map(([houseNum, houseInfo]) => (
                  <HouseCard key={houseNum} houseNum={houseNum} houseInfo={houseInfo} />
                ))}
              </div>
            </div>
            
            <div className='planets-section'>
              <h3>Planetary Positions</h3>
              <table>
                <thead>
                  <tr>
                    <th>Planet</th>
                    <th>Sign</th>
                    <th>Strength</th>
                    <th>Dignity</th>
                    <th>Nakshatra</th>
                    <th>Pada</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.planets && Object.entries(chartData.planets)
                    /* Finds index in my array, subtraction determins the order */
                    .sort(([planetA], [planetB]) => {
                      const order = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
                      return order.indexOf(planetA) - order.indexOf(planetB);
                    })

                    .map(([planet, info]) => (

                      <tr key={planet}>
                        <td><strong>{planet}</strong></td>
                        <td>{info.sign} {info.degree_in_sign.toFixed(2)}°</td>
                        <td>{info.strength_range}%</td>
                        <td>{info.dignity}</td>
                        <td>{info.nakshatra}</td>
                        <td>{info.pada}</td>
                      </tr>
                    ))
                  }
                </tbody>

              </table>
            </div>

            <div className='dasha-section'>
              <DashaTimeline chartData={chartData} birthData={birthData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;