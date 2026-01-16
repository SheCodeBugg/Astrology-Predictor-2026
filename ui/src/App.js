import React, { useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';
import './App.css';
import NorthIndianChart from './chart.js';
import HouseCard from './houses.js';
import DashaTimeline from './dashas.js';

const API_BASE = 'http://localhost:5001'; 

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
          <div className={!isInputExpanded && chartData ? 'input-section-collapsed' : 'input-section'}>
            {!isInputExpanded && chartData ? (
            // Collapsed view - Summary card
            <div className='birth-summary-card'>
              <div className='birth-summary-content'>
                <h3>📅</h3>
                <div className='birth-summary-info'>
                  <p>{formatDateTime()}</p>
                  <p>•</p>
                  <p>{formatLocation()}</p>
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

            <button onClick={calculateChart} disabled={loading}> {/* if loading true but wont click */}
            {loading ? 'Calculating...' : 'Calculate Chart'} {/* ternary operator if true do a if false do b */}
          </button>

          </div>
            </>
          )}

          {error && <div className='error'>{error}</div>} {/* If condition is true  → renders <Component /> */}
        </div>

        {chartData && chartData.success && (
          <div className='results-section'>
            <h2>Chart Results</h2>

            <div className='flex'>
              <div className='ascendant-box'>
                <p>{chartData.houses[1].sign} Ascendant</p>
              </div>
            </div>

            <div className='house-section'>
              
              <NorthIndianChart chartData={chartData} />

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