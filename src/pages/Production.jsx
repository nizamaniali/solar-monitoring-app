import React, { useEffect, useRef, useState } from 'react';
import { useSolarSystem } from '../context/SystemContext';
import ProductionChart from '../components/ProductionChart';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

function getLatestLabel(period) {
  if (period === 'daily') return "TODAY'S SOLAR PRODUCTION";
  if (period === 'weekly') return 'THIS WEEK';
  if (period === 'monthly') return 'THIS MONTH';
  return 'THIS YEAR';
}

function getChartTitle(period) {
  if (period === 'daily') return 'Last 7 Days';
  if (period === 'weekly') return 'Last 7 Weeks';
  if (period === 'monthly') return 'Last 7 Months';
  return 'Yearly Production';
}

function getHistoryTitle(period) {
  if (period === 'daily') return 'Daily Production';
  if (period === 'weekly') return 'Weekly Production';
  if (period === 'monthly') return 'Monthly Production';
  return 'Yearly Production';
}

function formatPeriodDate(dateString, period) {
  const date = new Date(`${dateString}T00:00:00`);

  if (period === 'daily') {
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  if (period === 'weekly') {
    return `Week of ${date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }

  if (period === 'monthly') {
    return date.toLocaleDateString('en-PK', {
      month: 'long',
      year: 'numeric',
    });
  }

  return date.getFullYear().toString();
}

function getDayName(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('en-PK', {
    weekday: 'long',
  });
}

export default function Production() {
  const { activeSupabase, selectedSystem, isSystemLoaded } = useSolarSystem();
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dragStartX = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);

  async function getProduction(selectedPeriod) {
    setLoading(true);
    setError(null);

    let table = '';
    let dateColumn = '';

    if (selectedPeriod === 'daily') {
      table = 'daily_solar_production';
      dateColumn = 'day';
    } else if (selectedPeriod === 'weekly') {
      table = 'weekly_solar_production';
      dateColumn = 'week_start';
    } else if (selectedPeriod === 'monthly') {
      table = 'monthly_solar_production';
      dateColumn = 'month';
    } else if (selectedPeriod === 'yearly') {
      table = 'yearly_solar_production';
      dateColumn = 'year';
    }

    const { data: rows, error: dbError } = await activeSupabase
      .from(table)
      .select(`${dateColumn}, solar_kwh`)
      .order(dateColumn, { ascending: false })
      .limit(30);

    if (dbError) {
      console.log('Production error:', dbError);
      setError(dbError.message);
      setLoading(false);
      return;
    }

    const formattedData = (rows || []).map((item) => ({
      date: item[dateColumn],
      solar_kwh: Number(item.solar_kwh),
    }));

    setData(formattedData);
    setLoading(false);
  }

  useEffect(() => {
    if (!isSystemLoaded) return;
    getProduction(period);
  }, [period, activeSupabase, selectedSystem, isSystemLoaded]);

  const handlePointerDown = (e) => {
    dragStartX.current = e.clientX ?? (e.touches && e.touches[0]?.clientX);
  };

  const handlePointerMove = (e) => {
    if (dragStartX.current === null) return;
    const currentX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    if (typeof currentX !== 'number') return;
    const dx = currentX - dragStartX.current;
    const idx = PERIODS.indexOf(period);
    if ((idx === 0 && dx > 0) || (idx === PERIODS.length - 1 && dx < 0)) {
      setDragOffset(dx * 0.25);
    } else {
      setDragOffset(dx);
    }
  };

  const handlePointerUp = () => {
    if (dragStartX.current === null) return;
    const idx = PERIODS.indexOf(period);
    if (dragOffset < -60 && idx < PERIODS.length - 1) {
      setPeriod(PERIODS[idx + 1]);
    } else if (dragOffset > 60 && idx > 0) {
      setPeriod(PERIODS[idx - 1]);
    }
    dragStartX.current = null;
    setDragOffset(0);
  };

  const latest = data.length > 0 ? data[0] : null;

  return (
    <div className="screen-container">
      <div className="screen-content">
        <div className="header-block">
          <h1 className="page-title">Production</h1>
          <p className="page-subtitle">Solar energy generation</p>
        </div>

        <div className="period-selector">
          <PeriodButton
            title="Daily"
            active={period === 'daily'}
            onClick={() => setPeriod('daily')}
          />
          <PeriodButton
            title="Weekly"
            active={period === 'weekly'}
            onClick={() => setPeriod('weekly')}
          />
          <PeriodButton
            title="Monthly"
            active={period === 'monthly'}
            onClick={() => setPeriod('monthly')}
          />
          <PeriodButton
            title="Yearly"
            active={period === 'yearly'}
            onClick={() => setPeriod('yearly')}
          />
        </div>

        {loading && (
          <div className="center-box">
            <div className="spinner" />
            <p className="loading-subtext">Loading production...</p>
          </div>
        )}

        {error && (
          <div className="error-card">
            <h3 className="error-card-title">Unable to load production</h3>
            <p className="error-text">{error}</p>
          </div>
        )}

        {!loading && !error && latest && (
          <>
            <div className="today-card">
              <p className="card-label-block">☀️ {getLatestLabel(period)}</p>

              <div className="energy-row">
                <span className="main-value">
                  {latest.solar_kwh.toFixed(2)}
                </span>
                <span className="energy-unit">kWh</span>
              </div>

              <p className="date-text">
                {formatPeriodDate(latest.date, period)}
              </p>
            </div>

            <div
              className="chart-card"
              style={{
                transform: `translateX(${dragOffset}px)`,
                transition: dragStartX.current === null ? 'transform 0.2s ease' : 'none',
                cursor: 'grab',
                userSelect: 'none',
              }}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            >
              <h2 className="section-title">{getChartTitle(period)}</h2>

              <ProductionChart
                data={[...data].slice(0, 7).reverse()}
                period={period}
              />
            </div>

            <h2 className="history-title">{getHistoryTitle(period)}</h2>

            <div className="history-card">
              {data.map((item, index) => (
                <div key={`${item.date}-${index}`} className="history-row">
                  <div>
                    <p className="history-date">
                      {formatPeriodDate(item.date, period)}
                    </p>
                    {period === 'daily' && (
                      <p className="history-day">{getDayName(item.date)}</p>
                    )}
                  </div>

                  <p className="history-value">
                    {item.solar_kwh.toFixed(2)} kWh
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="empty-card">
            <h3 className="empty-title">No production data yet</h3>
            <p className="empty-text">
              Solar production history will appear here once your database has
              recorded production.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PeriodButton({ title, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`period-button ${active ? 'period-button--active' : ''}`}
    >
      {title}
    </button>
  );
}
