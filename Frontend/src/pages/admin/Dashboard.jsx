import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchViolations, fetchMonthlyStats } from '../../features/violations/violationsSlice';
import {
  AlertTriangle,
  DollarSign,
  Clock,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  FileText,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';

const PIE_COLORS = ['#EF4444', '#22C55E'];

function AnimatedNumber({ value, prefix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = Number(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    let start = 0;
    const duration = 800;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}</span>;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { list, monthly, loading } = useSelector((s) => s.violations);

  useEffect(() => {
    dispatch(fetchViolations());
    dispatch(fetchMonthlyStats());
  }, [dispatch]);

  const totalViolations = list.length;
  const paidCount = list.filter((v) => v.payment_status === 'PAID').length;
  const unpaidCount = totalViolations - paidCount;
  const totalRevenue = list.filter((v) => v.payment_status === 'PAID').reduce((s, v) => s + (v.fine_amount || 0), 0);
  const complianceRate = totalViolations > 0 ? Math.round((paidCount / totalViolations) * 100) : 0;

  const pieData = [
    { name: t('dashboard.noHelmet'), value: totalViolations },
    { name: t('dashboard.compliant'), value: Math.max(0, paidCount) },
  ];

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span>{t('dashboard.loading')}</span>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('dashboard.title')}</h1>
        <p>{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card red">
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
          <div className="stat-info">
            <h4>{t('dashboard.totalViolations')}</h4>
            <div className="stat-value"><AnimatedNumber value={totalViolations} /></div>
            <div className="stat-change down"><TrendingUp size={14} /> {t('dashboard.allTimeRecords')}</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green"><DollarSign size={22} /></div>
          <div className="stat-info">
            <h4>{t('dashboard.revenueCollected')}</h4>
            <div className="stat-value"><AnimatedNumber value={totalRevenue} prefix="₹" /></div>
            <div className="stat-change up"><TrendingUp size={14} /> {t('dashboard.fromPaidFines')}</div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon orange"><Clock size={22} /></div>
          <div className="stat-info">
            <h4>{t('dashboard.pendingFines')}</h4>
            <div className="stat-value"><AnimatedNumber value={unpaidCount} /></div>
            <div className="stat-change down"><TrendingDown size={14} /> {t('dashboard.awaitingPayment')}</div>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon blue"><ShieldCheck size={22} /></div>
          <div className="stat-info">
            <h4>{t('dashboard.complianceRate')}</h4>
            <div className="stat-value">{complianceRate}%</div>
            <div className="stat-change up"><TrendingUp size={14} /> {t('dashboard.finesPaidRatio')}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Monthly Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3>{t('dashboard.monthlyViolations')}</h3>
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
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><FileText size={40} /><h3>{t('dashboard.noData')}</h3></div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3>{t('dashboard.violationStatus')}</h3>
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
            <div className="empty-state"><FileText size={40} /><h3>{t('dashboard.noData')}</h3></div>
          )}
        </div>
      </div>

      {/* Recent Violations Table */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3>{t('dashboard.recentViolations')}</h3>
          <span className="badge badge-info">{totalViolations} {t('dashboard.total')}</span>
        </div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('dashboard.vehicleNumber')}</th>
                <th>{t('dashboard.reason')}</th>
                <th>{t('dashboard.fine')}</th>
                <th>{t('dashboard.date')}</th>
                <th>{t('dashboard.status')}</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{t('dashboard.noViolationsYet')}</td></tr>
              ) : (
                list.slice(0, 10).map((v) => (
                  <tr key={v.id || v._id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.vehicle_number || '—'}</td>
                    <td>{v.reason || '—'}</td>
                    <td style={{ fontWeight: 600 }}>₹{v.fine_amount?.toLocaleString()}</td>
                    <td>{v.violation_date ? new Date(v.violation_date).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`badge ${v.payment_status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                        {v.payment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
