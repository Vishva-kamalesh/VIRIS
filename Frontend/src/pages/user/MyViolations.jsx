import { useEffect, useState } from 'react';
import { getViolationsAPI, payFineAPI } from '../../services/api';
import { Eye, Clock, CreditCard, AlertTriangle, CheckCircle2, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function MyViolations() {
  const { t } = useTranslation();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const fetchData = async () => {
    try {
      const res = await getViolationsAPI();
      setViolations(res.data);
    } catch {
      toast.error(t('myViolations.loadError'));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handlePay = async (vehicleNumber) => {
    setPayingId(vehicleNumber);
    try {
      await payFineAPI(vehicleNumber);
      toast.success(t('myViolations.paySuccess'));
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('myViolations.payFailed'));
    }
    setPayingId(null);
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner" /><span>{t('myViolations.loading')}</span></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('myViolations.title')}</h1>
        <p>{t('myViolations.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card red">
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
          <div className="stat-info">
            <h4>{t('myViolations.totalViolations')}</h4>
            <div className="stat-value">{violations.length}</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><Clock size={22} /></div>
          <div className="stat-info">
            <h4>{t('myViolations.unpaidFines')}</h4>
            <div className="stat-value">{violations.filter((v) => v.payment_status === 'UNPAID').length}</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><CheckCircle2 size={22} /></div>
          <div className="stat-info">
            <h4>{t('myViolations.paidFines')}</h4>
            <div className="stat-value">{violations.filter((v) => v.payment_status === 'PAID').length}</div>
          </div>
        </div>
      </div>

      {/* Violation Cards */}
      {violations.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FileText size={48} />
            <h3>{t('myViolations.noViolations')}</h3>
            <p>{t('myViolations.allClear')}</p>
          </div>
        </div>
      ) : (
        <div className="citizen-violations-grid">
          {violations.map((v) => (
            <div className="violation-card" key={v.id || v._id}>
              <div className="violation-card-header">
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>
                  {v.vehicle_number || '—'}
                </span>
                <span className={`badge ${v.payment_status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                  {v.payment_status}
                </span>
              </div>

              <div className="violation-card-body">
                <div className="info-row">
                  <span className="label">{t('myViolations.reason')}</span>
                  <span className="value">{v.reason || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t('myViolations.fineAmount')}</span>
                  <span className="value" style={{ color: 'var(--error)', fontWeight: 700 }}>₹{v.fine_amount?.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t('myViolations.date')}</span>
                  <span className="value">{v.violation_date ? new Date(v.violation_date).toLocaleDateString() : '—'}</span>
                </div>
              </div>

              {v.payment_status === 'UNPAID' && (
                <div className="violation-card-footer">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handlePay(v.vehicle_number)}
                    disabled={payingId === v.vehicle_number}
                    style={{ gap: 6 }}
                  >
                    {payingId === v.vehicle_number ? (
                      <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <CreditCard size={15} />
                    )}
                    {t('myViolations.payFine')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
