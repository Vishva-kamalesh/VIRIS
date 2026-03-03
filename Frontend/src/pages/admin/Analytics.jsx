import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchViolations, fetchMonthlyStats } from '../../features/violations/violationsSlice';
import { FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import { useTranslation } from 'react-i18next';

const COLORS = ['#2563EB', '#0EA5E9', '#6366F1', '#F59E0B', '#EF4444', '#22C55E'];

export default function Analytics() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { list, monthly, loading } = useSelector((s) => s.violations);

  useEffect(() => {
    dispatch(fetchViolations());
    dispatch(fetchMonthlyStats());
  }, [dispatch]);

  const totalViolations = list.length;
  const paidCount = list.filter((v) => v.payment_status === 'PAID').length;

  const pieData = [
    { name: t('analytics.unpaid'), value: totalViolations - paidCount },
    { name: t('analytics.paid'), value: paidCount },
  ];

  const PIE_COLORS = ['#EF4444', '#22C55E'];

  const revenueData = monthly.map((m) => ({
    month: m.month,
    revenue: m.count * 1000,
    count: m.count,
  }));

  const vehicleCounts = {};
  list.forEach((v) => {
    if (v.vehicle_number) {
      vehicleCounts[v.vehicle_number] = (vehicleCounts[v.vehicle_number] || 0) + 1;
    }
  });
  const topVehicles = Object.entries(vehicleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v, c]) => ({ vehicle: v, count: c }));

  if (loading) {
    return <div className="page-loader"><div className="spinner" /><span>{t('analytics.loading')}</span></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('analytics.title')}</h1>
        <p>{t('analytics.subtitle')}</p>
      </div>

      <div className="charts-grid">
        {/* Monthly Revenue Area Chart */}
        <div className="card">
          <div className="card-header">
            <h3>{t('analytics.monthlyRevenue')}</h3>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><FileText size={40} /><h3>{t('analytics.noData')}</h3></div>
          )}
        </div>

        {/* Payment Status Pie */}
        <div className="card">
          <div className="card-header">
            <h3>{t('analytics.paymentStatus')}</h3>
          </div>
          {totalViolations > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><FileText size={40} /><h3>{t('analytics.noData')}</h3></div>
          )}
        </div>

        {/* Violations by Month Bar */}
        <div className="card">
          <div className="card-header">
            <h3>{t('analytics.violationsByMonth')}</h3>
          </div>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><FileText size={40} /><h3>{t('analytics.noData')}</h3></div>
          )}
        </div>

        {/* Repeat Offenders */}
        <div className="card">
          <div className="card-header">
            <h3>{t('analytics.repeatOffenders')}</h3>
          </div>
          {topVehicles.length > 0 ? (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('analytics.rank')}</th>
                    <th>{t('analytics.vehicleNumber')}</th>
                    <th>{t('analytics.violations')}</th>
                    <th>{t('analytics.totalFine')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topVehicles.map((v, i) => (
                    <tr key={v.vehicle}>
                      <td style={{ fontWeight: 700, color: i === 0 ? 'var(--error)' : 'var(--text-secondary)' }}>
                        {i + 1}
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.vehicle}</td>
                      <td><span className="badge badge-error">{v.count}</span></td>
                      <td style={{ fontWeight: 600 }}>₹{(v.count * 1000).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><FileText size={40} /><h3>{t('analytics.noData')}</h3></div>
          )}
        </div>
      </div>
    </>
  );
}
