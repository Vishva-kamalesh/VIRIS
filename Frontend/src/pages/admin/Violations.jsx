import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchViolations } from '../../features/violations/violationsSlice';
import { payFineAPI, sendSmsAPI } from '../../services/api';
import { Search, Download, Filter, ChevronLeft, ChevronRight, FileText, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 10;

export default function ViolationsPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.violations);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => { dispatch(fetchViolations()); }, [dispatch]);

  const filtered = useMemo(() => {
    let data = [...list];
    if (search.trim()) {
      data = data.filter((v) =>
        (v.vehicle_number || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      data = data.filter((v) => v.payment_status === statusFilter);
    }
    return data;
  }, [list, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePay = async (vehicleNumber) => {
    setPayingId(vehicleNumber);
    try {
      await payFineAPI(vehicleNumber);
      toast.success(t('violations.paymentSuccess'));
      dispatch(fetchViolations());
    } catch (err) {
      toast.error(err.response?.data?.detail || t('violations.paymentFailed'));
    }
    setPayingId(null);
  };

  const [sendingSmsId, setSendingSmsId] = useState(null);
  const handleSendSms = async (violationId) => {
    setSendingSmsId(violationId);
    try {
      await sendSmsAPI(violationId);
      toast.success(t('violations.smsSent'));
    } catch (err) {
      toast.error(err.response?.data?.detail || t('violations.smsFailed'));
    }
    setSendingSmsId(null);
  };

  const exportCSV = () => {
    const headers = [
      t('violations.vehicleNumber'),
      t('violations.reason'),
      t('violations.fine'),
      t('violations.date'),
      t('violations.status'),
    ];
    const rows = filtered.map((v) => [
      v.vehicle_number || '',
      v.reason || '',
      v.fine_amount || 0,
      v.violation_date ? new Date(v.violation_date).toLocaleDateString() : '',
      v.payment_status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `violations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success(t('violations.csvExported'));
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner" /><span>{t('violations.loading')}</span></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('violations.title')}</h1>
        <p>{t('violations.subtitle')}</p>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-bar">
          <Search size={17} />
          <input
            placeholder={t('violations.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="toolbar-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              className="input"
              style={{ padding: '8px 12px', fontSize: '0.82rem' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">{t('violations.allStatus')}</option>
              <option value="PAID">{t('violations.paid')}</option>
              <option value="UNPAID">{t('violations.unpaid')}</option>
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
            <Download size={15} /> {t('violations.exportCsv')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('violations.vehicleNumber')}</th>
              <th>{t('violations.reason')}</th>
              <th>{t('violations.fine')}</th>
              <th>{t('violations.date')}</th>
              <th>{t('violations.status')}</th>
              <th>{t('violations.action')}</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><FileText size={40} /><h3>{t('violations.noViolationsFound')}</h3><p>{t('violations.adjustFilter')}</p></div></td></tr>
            ) : (
              paged.map((v) => (
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
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {v.payment_status === 'UNPAID' ? (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handlePay(v.vehicle_number)}
                          disabled={payingId === v.vehicle_number}
                        >
                          {payingId === v.vehicle_number ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : t('violations.markPaid')}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', alignSelf: 'center' }}>{t('violations.completed')}</span>
                      )}
                      
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Send SMS Alert"
                        onClick={() => handleSendSms(v.id || v._id)}
                        disabled={sendingSmsId === (v.id || v._id)}
                      >
                        {sendingSmsId === (v.id || v._id) ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <span>{t('violations.showing')} {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} {t('violations.of')} {filtered.length}</span>
            <div className="pagination-buttons">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
