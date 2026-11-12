import React, { useEffect, useMemo, useState } from 'react';
import { useSolarSystem } from '../context/SystemContext';
import { registerForPushNotificationsAsync } from '../lib/notifications';

const fmt = (value, digits = 1) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '—';
const kw = (watts) => `${(Number(watts || 0) / 1000).toFixed(2)} kW`;

function Metric({ icon, label, value, detail, tone = '' }) {
  return <article className={`metric-card ${tone}`}><div className="metric-icon">{icon}</div><div className="metric-copy"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div></article>;
}

function BatteryGraphic({ capacity }) {
  const level = Math.max(0, Math.min(100, Number(capacity) || 0));
  return <div className="battery-visual"><div className="battery-cap" /><div className="battery-shell"><div className="battery-fill" style={{ height: `${level}%` }} /></div></div>;
}

function EnergyFlow({ reading, batteryStatus, batteryStatusClass }) {
  return <section className="panel flow-panel">
    <div className="panel-heading"><div><span className="heading-icon">⌁</span><div><h2>Energy flow</h2><p>Live power distribution in your system</p></div></div><span className="live-pill"><i /> System {reading ? 'reporting' : 'offline'}</span></div>
    <div className="flow-diagram">
      <div className="flow-sources">
        <div className="flow-node solar-node"><span className="flow-symbol">▤</span><div><small>Solar</small><strong>{kw(reading.pv_power)}</strong></div></div>
        <div className="flow-node battery-node"><span className="flow-symbol">▣</span><div><small>Battery</small><strong>{kw(reading.battery_current * reading.battery_voltage)}</strong><em className={batteryStatusClass}>{batteryStatus}</em></div></div>
      </div>
      <div className="flow-lines"><span className="line line-solar" /><span className="line line-battery" /></div>
      <div className="home-node"><div className="house-icon"><span /></div><strong>Home load</strong><b>{kw(reading.ac_power)}</b></div>
      <div className="grid-connector"><span className="line line-grid" /><div className="flow-node grid-node"><span className="flow-symbol">♜</span><div><small>Grid voltage</small><strong>{fmt(reading.grid_voltage)} V</strong></div></div></div>
    </div>
  </section>;
}

function MiniTrend({ values }) {
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 300},${90 - (Math.max(0, Math.min(100, Number(value) || 0)) / 100) * 78}`).join(' ');
  return <svg className="mini-trend" viewBox="0 0 300 100" role="img" aria-label="Battery capacity trend"><line x1="0" y1="90" x2="300" y2="90" /><polyline points={points} /></svg>;
}

export default function Home() {
  const { activeSupabase, selectedSystem, isSystemLoaded, setSelectedSystem } = useSolarSystem();
  const [reading, setReading] = useState(null);
  const [recent, setRecent] = useState([]);
  const [batteryHistory, setBatteryHistory] = useState([]);
  const [todayEnergy, setTodayEnergy] = useState(null);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!isSystemLoaded) return;
    let mounted = true;
    setReading(null); setRecent([]); setBatteryHistory([]); setError(null); setIsOnline(false);
    registerForPushNotificationsAsync();

    async function loadDashboard() {
      const [latestResult, recentResult, energyResult] = await Promise.all([
        activeSupabase.from('inverter_readings').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        activeSupabase.from('inverter_readings').select('*').order('created_at', { ascending: false }).limit(8),
        activeSupabase.from('daily_solar_production').select('day, solar_kwh').order('day', { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (!mounted) return;
      if (latestResult.error) { setError(latestResult.error.message); return; }
      if (latestResult.data) {
        setReading(latestResult.data);
        const age = Date.now() - new Date(latestResult.data.created_at).getTime();
        setIsOnline(age < 2 * 60 * 1000);
      }
      setRecent(recentResult.data || []);
      setBatteryHistory((recentResult.data || []).slice().reverse().map((item) => Number(item.battery_capacity)));
      if (energyResult.data) setTodayEnergy(Number(energyResult.data.solar_kwh));
    }

    loadDashboard();
    const channel = activeSupabase.channel(`dashboard-readings-${selectedSystem}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inverter_readings' }, (payload) => {
        if (!mounted) return;
        const item = payload.new;
        setReading(item);
        setIsOnline(Date.now() - new Date(item.created_at).getTime() < 120000);
        setRecent((current) => [item, ...current].slice(0, 8));
        setBatteryHistory((current) => [...current, Number(item.battery_capacity)].slice(-12));
        setError(null);
      }).subscribe();

    const interval = setInterval(() => {
      setReading((current) => {
        if (current) setIsOnline(Date.now() - new Date(current.created_at).getTime() < 120000);
        return current;
      });
    }, 10000);
    return () => { mounted = false; activeSupabase.removeChannel(channel); clearInterval(interval); };
  }, [activeSupabase, selectedSystem, isSystemLoaded]);

  const batteryCurrent = Number(reading?.battery_current || 0);
  const batteryStatus = batteryCurrent > 0.5 ? 'Charging' : batteryCurrent < -0.5 ? 'Discharging' : 'Idle';
  const batteryClass = batteryStatus === 'Charging' ? 'status-charging' : batteryStatus === 'Discharging' ? 'status-discharging' : 'status-idle';
  const dateLabel = useMemo(() => new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()), []);

  if (!reading && !error) return <div className="screen-container"><div className="loading-state"><div className="spinner" /><h2>Connecting to your inverter</h2><p>{isSystemLoaded ? 'Waiting for the latest reading…' : 'Loading saved system…'}</p></div></div>;
  if (error) return <div className="screen-container"><div className="empty-state"><h2>Unable to load dashboard</h2><p>{error}</p></div></div>;

  return <div className="screen-container dashboard-screen">
    <div className="page-heading">
      <div><div className="eyebrow">{dateLabel}</div><h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}</h1><p>Here's your solar system overview.</p></div>
      <div className="heading-actions">
        <label className="system-select"><span>▤</span><select value={selectedSystem} onChange={(event) => setSelectedSystem(event.target.value)}><option value="mine">My Solar System</option><option value="brother">Brother's Solar System</option></select></label>
        <span className={`connection-status ${isOnline ? 'is-online' : 'is-offline'}`}><i />{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>

    <section className="metrics-grid">
      <Metric icon="▤" label="Solar power" value={kw(reading.pv_power)} detail={`${fmt(reading.pv_power, 0)} W · Live`} tone="metric-solar" />
      <Metric icon="⌂" label="Home load" value={kw(reading.ac_power)} detail={`${fmt(reading.load_percent, 0)}% inverter load`} />
      <Metric icon="♜" label="Grid voltage" value={`${fmt(reading.grid_voltage)} V`} detail="Grid connection" />
      <Metric icon="▣" label="Battery power" value={`${batteryCurrent > 0 ? '+' : ''}${fmt((batteryCurrent * Number(reading.battery_voltage || 0)) / 1000, 2)} kW`} detail={batteryStatus} tone="metric-battery" />
    </section>

    <div className="dashboard-grid">
      <EnergyFlow reading={reading} batteryStatus={batteryStatus} batteryStatusClass={batteryClass} />
      <section className="panel battery-panel">
        <div className="panel-heading"><div><span className="heading-icon">▣</span><div><h2>Battery</h2><p>State of charge</p></div></div><span className={`status-tag ${batteryClass}`}>{batteryStatus}</span></div>
        <div className="battery-content"><BatteryGraphic capacity={reading.battery_capacity} /><div className="battery-details"><strong className="battery-big">{fmt(reading.battery_capacity, 0)}<small>%</small></strong><dl><div><dt>Voltage</dt><dd>{fmt(reading.battery_voltage)} V</dd></div><div><dt>Current</dt><dd>{fmt(reading.battery_current)} A</dd></div><div><dt>Capacity</dt><dd>{fmt(reading.battery_capacity, 0)}%</dd></div></dl></div></div>
        <div className="battery-chart"><div className="subsection-label">Recent charge level</div><MiniTrend values={batteryHistory.length ? batteryHistory : [Number(reading.battery_capacity)]} /></div>
      </section>
      <section className="panel inverter-panel">
        <div className="panel-heading"><div><span className="heading-icon">▣</span><div><h2>Inverter</h2><p>Electrical readings</p></div></div><span className={`status-tag ${isOnline ? 'status-charging' : 'status-discharging'}`}>{isOnline ? 'Online' : 'Offline'}</span></div>
        <dl className="reading-list"><div><dt>AC output voltage</dt><dd>{fmt(reading.ac_output_voltage)} V</dd></div><div><dt>Grid voltage</dt><dd>{fmt(reading.grid_voltage)} V</dd></div><div><dt>Temperature</dt><dd>{fmt(reading.inverter_temperature)} °C</dd></div><div><dt>Load</dt><dd>{fmt(reading.load_percent, 0)}%</dd></div><div><dt>AC power</dt><dd>{kw(reading.ac_power)}</dd></div></dl>
      </section>
      <section className="panel today-panel">
        <div className="panel-heading"><div><span className="heading-icon">ϟ</span><div><h2>Solar production</h2><p>Latest daily total</p></div></div></div>
        <strong className="today-value">{todayEnergy === null ? '—' : `${todayEnergy.toFixed(2)} kWh`}</strong>
        <span className="today-caption">{todayEnergy === null ? 'Daily summary is not available yet' : 'Latest recorded production day'}</span>
      </section>
      <section className="panel readings-panel">
        <div className="panel-heading"><div><span className="heading-icon">▤</span><div><h2>Recent readings</h2><p>Latest inverter updates</p></div></div><span className="table-count">{recent.length} records</span></div>
        <div className="table-wrap"><table className="readings-table"><thead><tr><th>Time</th><th>PV power</th><th>AC power</th><th>Battery</th><th>Voltage</th><th>Load</th><th>Temperature</th></tr></thead><tbody>{recent.map((item) => <tr key={item.id}><td>{new Date(item.created_at).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })}</td><td>{kw(item.pv_power)}</td><td>{kw(item.ac_power)}</td><td>{fmt(item.battery_capacity, 0)}%</td><td>{fmt(item.battery_voltage)} V</td><td>{fmt(item.load_percent, 0)}%</td><td>{fmt(item.inverter_temperature)} °C</td></tr>)}</tbody></table></div>
        <div className="last-updated">Last reading received {new Date(reading.created_at).toLocaleString('en-PK')}</div>
      </section>
    </div>
  </div>;
}
