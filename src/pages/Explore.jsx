import React from 'react';
import { useSolarSystem } from '../context/SystemContext';

export default function Explore() {
  const { selectedSystem, setSelectedSystem, isSystemLoaded } =
    useSolarSystem();

  return (
    <div className="screen-container">
      <div className="screen-content">
        <h1 className="page-title">Explore</h1>
        <p className="page-subtitle" style={{ marginBottom: 25 }}>
          Solar system information
        </p>

        <div className="card-box">
          <h2 className="card-box-title">Select Solar System</h2>
          <p className="card-box-text">
            Choose which inverter you want to monitor.
          </p>

          <button
            type="button"
            className={`system-option ${
              selectedSystem === 'mine' ? 'system-option--selected' : ''
            }`}
            disabled={!isSystemLoaded}
            onClick={() => setSelectedSystem('mine')}
          >
            <div className="system-option-text">
              <p className="system-option-title">My Solar System</p>
              <p className="system-option-subtitle">
                My inverter and readings
              </p>
            </div>
            <span className="system-option-check">
              {selectedSystem === 'mine' ? '✓' : ''}
            </span>
          </button>

          <button
            type="button"
            className={`system-option ${
              selectedSystem === 'brother' ? 'system-option--selected' : ''
            }`}
            disabled={!isSystemLoaded}
            onClick={() => setSelectedSystem('brother')}
          >
            <div className="system-option-text">
              <p className="system-option-title">Brother's Solar System</p>
              <p className="system-option-subtitle">
                Brother's inverter and readings
              </p>
            </div>
            <span className="system-option-check">
              {selectedSystem === 'brother' ? '✓' : ''}
            </span>
          </button>

          {!isSystemLoaded && (
            <p className="card-box-text" style={{ marginTop: 12 }}>
              Loading saved selection...
            </p>
          )}
        </div>

        <div className="card-box">
          <h2 className="card-box-title">Monitoring Only</h2>
          <p className="card-box-text">
            This app is for monitoring the solar inverter. No inverter settings
            can be changed remotely.
          </p>
        </div>
      </div>
    </div>
  );
}
