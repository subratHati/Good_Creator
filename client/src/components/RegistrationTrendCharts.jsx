import { useState, useEffect, useCallback, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getRegistrationTrend } from '../api/analytics';

const RANGES = [
  { key: 'all', label: 'All time' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'last_3_months', label: 'Last 3 months' },
];

const GRANULARITIES = [
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
];

const formatAxisDate = (dateStr, granularity) => {
  const d = new Date(dateStr);
  if (granularity === 'month') return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const CustomTooltip = ({ active, payload, label, granularity, color }) => {
  if (!active || !payload || !payload.length) return null;
  const d = new Date(label);
  const dateLabel = granularity === 'month'
    ? d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : granularity === 'week'
      ? `Week of ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="bg-white rounded-xl px-3 py-2" style={{ border: '1.5px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <div className="text-xs font-bold" style={{ color: '#101828' }}>{dateLabel}</div>
      <div className="text-xs font-black mt-0.5" style={{ color }}>{payload[0].value} new signup{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
};

const TrendChart = memo(({ title, color, points, loading, granularity }) => (
  <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E7EB' }}>
    <div className="text-sm font-black mb-4" style={{ color: '#101828' }}>{title}</div>
    {loading ? (
      <div className="flex items-center justify-center" style={{ height: '240px' }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: color }} />
      </div>
    ) : points.length === 0 ? (
      <div className="flex items-center justify-center text-xs" style={{ height: '240px', color: '#9CA3AF' }}>
        No registrations in this range.
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={points} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => formatAxisDate(d, granularity)}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip granularity={granularity} color={color} />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 2, fill: color }}
            activeDot={{ r: 5, fill: color, stroke: 'white', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )}
  </div>
));

const RegistrationTrendCharts = () => {
  const [range, setRange] = useState('last_3_months');
  const [granularity, setGranularity] = useState('day');
  const [creatorPoints, setCreatorPoints] = useState([]);
  const [brandPoints, setBrandPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBoth = useCallback(async () => {
    setLoading(true);
    try {
      const [creatorRes, brandRes] = await Promise.all([
        getRegistrationTrend({ role: 'creator', range, granularity }),
        getRegistrationTrend({ role: 'brand', range, granularity }),
      ]);
      setCreatorPoints(creatorRes.data.points || []);
      setBrandPoints(brandRes.data.points || []);
    } catch {
      setCreatorPoints([]);
      setBrandPoints([]);
    } finally {
      setLoading(false);
    }
  }, [range, granularity]);

  useEffect(() => { fetchBoth(); }, [fetchBoth]);

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: '#9CA3AF' }}>Range</span>
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className="px-3 py-1.5 rounded-full text-xs font-bold border"
            style={{
              borderColor: range === r.key ? '#155DFC' : '#E5E7EB',
              backgroundColor: range === r.key ? '#EFF6FF' : 'white',
              color: range === r.key ? '#155DFC' : '#6B7280',
            }}
          >
            {r.label}
          </button>
        ))}
        <span className="text-xs font-bold uppercase tracking-wider ml-3 mr-1" style={{ color: '#9CA3AF' }}>Group by</span>
        {GRANULARITIES.map((g) => (
          <button
            key={g.key}
            onClick={() => setGranularity(g.key)}
            className="px-3 py-1.5 rounded-full text-xs font-bold border"
            style={{
              borderColor: granularity === g.key ? '#155DFC' : '#E5E7EB',
              backgroundColor: granularity === g.key ? '#EFF6FF' : 'white',
              color: granularity === g.key ? '#155DFC' : '#6B7280',
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TrendChart title="🎨 Creator Registrations" color="#155DFC" points={creatorPoints} loading={loading} granularity={granularity} />
        <TrendChart title="🏢 Brand Registrations" color="#F59E0B" points={brandPoints} loading={loading} granularity={granularity} />
      </div>
    </div>
  );
};

export default RegistrationTrendCharts;
