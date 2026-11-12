import React, { useEffect, useState } from 'react';
import { useSolarSystem } from '../context/SystemContext';

export default function History() {
  const { activeSupabase, selectedSystem, isSystemLoaded } = useSolarSystem();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSystemLoaded) return;
    let mounted = true;
    setLoading(true); setError(null);
    activeSupabase.from('inverter_readings').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data, error: dbError }) => {
        if (!mounted) return;
        if (dbError) setError(dbError.message);
        else setRows(data || []);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [activeSupabase, selectedSystem, isSystemLoaded]);

  return <div className="screen-container">
    <div className="page-heading"><div><div className="eyebrow">SYSTEM DATA</div><h1>Reading history</h1><p>Recent measurements received from your inverter.</p></div></div>
    <section className="panel history-page-panel">
      <div className="panel-heading"><div><span className="heading-icon">◷</span><div><h2>Inverter readings</h2><p>Showing the latest 100 records</p></div></div><span className="table-count">{rows.length} records</span></div>
      {loading ? <div className="loading-inline"><div className="spinner" />Loading readings…</div> : error ? <div className="empty-state"><p>{error}</p></div> : rows.length === 0 ? <div className="empty-state"><h3>No readings yet</h3><p>New inverter readings will appear here.</p></div> :
        <div className="table-wrap"><table className="readings-table history-table"><thead><tr><th>Date & time</th><th>PV power</th><th>Battery voltage</th><th>Battery current</th><th>Capacity</th><th>AC power</th><th>Grid voltage</th><th>Load</th><th>Temperature</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString('en-PK')}</td><td>{(Number(row.pv_power) / 1000).toFixed(2)} kW</td><td>{Number(row.battery_voltage).toFixed(1)} V</td><td>{Number(row.battery_current).toFixed(1)} A</td><td>{Number(row.battery_capacity).toFixed(0)}%</td><td>{(Number(row.ac_power) / 1000).toFixed(2)} kW</td><td>{Number(row.grid_voltage).toFixed(1)} V</td><td>{Number(row.load_percent).toFixed(0)}%</td><td>{Number(row.inverter_temperature).toFixed(1)} °C</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
