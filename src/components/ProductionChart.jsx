import React from 'react';

export function getChartLabel(dateString, period) {
  const date = new Date(`${dateString}T00:00:00`);

  if (period === 'daily') {
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
    });
  }

  if (period === 'weekly') {
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
    });
  }

  if (period === 'monthly') {
    return date.toLocaleDateString('en-PK', {
      month: 'short',
    });
  }

  return date.getFullYear().toString();
}

export default function ProductionChart({ data, period }) {
  const width = 330;
  const height = 230;

  const chartLeft = 40;
  const chartRight = 315;
  const chartTop = 25;
  const chartBottom = 185;

  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const maxValue = Math.max(...data.map((item) => item.solar_kwh), 0) || 1;
  const barWidth = Math.min(30, chartWidth / Math.max(data.length, 1) - 15);

  return (
    <div className="chart-container">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ maxWidth: '520px', overflow: 'visible' }}
      >
        <line
          x1={chartLeft}
          y1={chartTop}
          x2={chartLeft}
          y2={chartBottom}
          stroke="#dddddd"
          strokeWidth="1"
        />
        <line
          x1={chartLeft}
          y1={chartBottom}
          x2={chartRight}
          y2={chartBottom}
          stroke="#dddddd"
          strokeWidth="1"
        />
        <line
          x1={chartLeft}
          y1={chartTop}
          x2={chartRight}
          y2={chartTop}
          stroke="#eeeeee"
          strokeWidth="1"
        />
        <line
          x1={chartLeft}
          y1={chartTop + chartHeight / 2}
          x2={chartRight}
          y2={chartTop + chartHeight / 2}
          stroke="#eeeeee"
          strokeWidth="1"
        />

        {data.map((item, index) => {
          const value = item.solar_kwh;
          const barHeight = (value / maxValue) * chartHeight;
          const spacing = chartWidth / data.length;
          const x = chartLeft + spacing * index + (spacing - barWidth) / 2;
          const y = chartBottom - barHeight;
          const label = getChartLabel(item.date, period);

          return (
            <g key={`${item.date}-${index}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 0)}
                rx="5"
                fill="#f5b700"
              />
              <text
                x={x + barWidth / 2}
                y={Math.max(y - 7, 12)}
                fontSize="10"
                fill="#555555"
                textAnchor="middle"
              >
                {value.toFixed(1)}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartBottom + 20}
                fontSize="11"
                fill="#777777"
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="chart-unit">Energy produced (kWh)</p>
    </div>
  );
}
