import React, { useState } from 'react';
import './App.css';

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

  // Arrow function with async / await inside 
  const calculateChart = async () => {
    setLoading(true);
    setError(null);

    // Fetch data from API
    try {
      const response = await fetch('http://localhost:5001/api/chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(birthData)
      });

      const data = await response.json();

      if (data.success) {
        setChartData(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to API: ' + err.message);
    }

    setLoading(false)
  };

  // Returned data
  return (
    <div className='App'>
      <header>
        <h1>Astrology Calculator</h1>
      </header>

      <div className='container'>
        <div className='input-section'>
          <h2>Birth Information</h2>

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
                  <div key={houseNum} className='house-card'>
                    <strong>House {houseNum}</strong>
                    <span>{houseInfo.sign}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className='planets-section'>
              <h3>Planetary Positions</h3>
              <table>
                <thead>
                  <tr>
                    <th>Planet</th>
                    <th>Degree</th>
                    <th>Sign</th>
                    <th>Nakshatra</th>
                    <th>Pada</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.planets && Object.entries(chartData.planets).map(([planet, info]) => (
                    <tr key={planet}>
                      <td><strong>{planet}</strong></td>
                      <td>{info.degree.toFixed(2)}°</td>
                      <td>{info.sign} {info.degree_in_sign.toFixed(2)}°</td>
                      <td>{info.nakshatra}</td>
                      <td>{info.pada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;