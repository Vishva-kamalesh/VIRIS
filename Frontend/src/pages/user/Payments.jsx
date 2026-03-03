import { useEffect, useState } from 'react';
import { getViolationsAPI } from '../../services/api';
import { CreditCard, CheckCircle2, DollarSign, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function Payments() {
  const { t } = useTranslation();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getViolationsAPI();
        setViolations(res.data.filter((v) => v.payment_status === 'PAID'));
      } catch {
        toast.error(t('payments.loadError'));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalPaid = violations.reduce((s, v) => s + (v.fine_amount || 0), 0);

  if (loading) {
    return <div className="page-loader"><div className="spinner" /><span>{t('payments.loading')}</span></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('payments.title')}</h1>
        <p>{t('payments.subtitle')}</p>
      </div>

      {/* Summary */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon green"><DollarSign size={22} /></div>
          <div className="stat-info">
            <h4>{t('payments.totalPaid')}</h4>
            <div className="stat-value">₹{totalPaid.toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><CheckCircle2 size={22} /></div>
          <div className="stat-info">
            <h4>{t('payments.transactions')}</h4>
            <div className="stat-value">{violations.length}</div>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      {violations.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CreditCard size={48} />
            <h3>{t('payments.noPayments')}</h3>
            <p>{t('payments.paymentAppear')}</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('payments.vehicleNumber')}</th>
                <th>{t('payments.reason')}</th>
                <th>{t('payments.amountPaid')}</th>
                <th>{t('payments.violationDate')}</th>
                <th>{t('payments.status')}</th>
              </tr>
            </thead>
            <tbody>
              {violations.map((v) => (
                <tr key={v.id || v._id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.vehicle_number || '—'}</td>
                  <td>{v.reason || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{v.fine_amount?.toLocaleString()}</td>
                  <td>{v.violation_date ? new Date(v.violation_date).toLocaleDateString() : '—'}</td>
                  <td><span className="badge badge-success">PAID</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
