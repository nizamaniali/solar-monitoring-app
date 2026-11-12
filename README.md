# SolarMonitor Web

Responsive React + Vite website for monitoring solar inverter readings and solar production. The interface follows the user-selected clean, light dashboard reference: white surfaces, restrained forest-green accents, thin borders, compact data cards, and a responsive navigation layout.

## Included
- Live inverter readings using Supabase Realtime
- Solar PV power, home/AC load, battery power and status, grid voltage
- Battery voltage, current, capacity, inverter temperature, AC output voltage and load percentage
- Daily solar production summary and the existing daily/weekly/monthly/yearly production views
- Recent inverter readings on the dashboard and a separate history page
- Switch between the primary and brother's Supabase projects
- Responsive desktop sidebar and mobile bottom navigation
- Appearance preference: Auto (system preference), Light, or Dark; saved in browser storage
- Browser notification registration retained

## Run locally
1. Install Node.js (LTS recommended).
2. Copy `.env.example` to `.env` and enter the public Supabase project URL and anon/publishable key(s).
3. Run `npm install`.
4. Run `npm run dev`.
5. Run `npm run build` for a production build.

## Supabase tables/views used
- `inverter_readings`
- `daily_solar_production`
- `weekly_solar_production`
- `monthly_solar_production`
- `yearly_solar_production`
- `push_tokens` (used by the existing browser notification registration)

The dashboard only displays metrics available from the existing schema. It does not fabricate household consumption, weather, CO₂ savings, or a battery history that is not present in the readings table.

## Environment variable safety
Use only the Supabase anon/publishable key intended for client-side use. Never expose a Supabase service-role key in a browser application. Configure appropriate Row Level Security policies in Supabase.
