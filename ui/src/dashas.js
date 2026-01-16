import React, { useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import './App.css';
import './App.js';

const API_BASE = 'http://localhost:5001'; 

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

export default DashaTimeline;