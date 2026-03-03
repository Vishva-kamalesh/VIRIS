import { useState } from 'react';
import { useSelector } from 'react-redux';
import { citizenLookupAPI, payFineAPI } from '../../services/api';
import {
  Search, FileText, User, Mail, Shield, Hash, Car, AlertTriangle,
  CheckCircle2, Clock, CreditCard, DollarSign, Loader2, Info, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function CitizenPortal() {
  const { t } = useTranslation();
  const { user, email, role } = useSelector((s) => s.auth);

  // Search state
  const [challanNo, setChallanNo] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!challanNo.trim() && !vehicleNumber.trim()) {
      toast.error(t('citizenPortal.enterAtLeastOne'));
      return;
    }
    setSearching(true);
    setResult(null);
    try {
      const params = {};
      if (challanNo.trim()) params.challan_no = challanNo.trim();
      if (vehicleNumber.trim()) params.vehicle_number = vehicleNumber.trim();
      const res = await citizenLookupAPI(params);
      setResult(res.data);
      if (!res.data.found) {
        toast(t('citizenPortal.noViolationsFound'), { icon: '✅' });
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || t('citizenPortal.searchFailed'));
    }
    setSearching(false);
  };

  const handlePay = async (vNumber) => {
    setPayingId(vNumber);
    try {
      await payFineAPI(vNumber);
      toast.success(t('citizenPortal.paymentSuccess'));
      // Re-fetch results
      const params = {};
      if (challanNo.trim()) params.challan_no = challanNo.trim();
      if (vehicleNumber.trim()) params.vehicle_number = vehicleNumber.trim();
      const res = await citizenLookupAPI(params);
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || t('citizenPortal.paymentFailed'));
    }
    setPayingId(null);
  };

  // ── PDF Generation for Citizen Challan ─────────────────────────────
  const downloadChallanPDF = (v) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // ── Header Banner ──
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, 44, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('VIRIS — E-Challan', pageW / 2, 16, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Vision-Based Rider Safety Monitoring & E-Challan Management System', pageW / 2, 24, { align: 'center' });
    doc.text('Government of India  |  Traffic Enforcement Division', pageW / 2, 31, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Challan No: ${v.challan_no || 'N/A'}`, pageW / 2, 39, { align: 'center' });

    y = 54;

    // ── Violation Type Banner ──
    const isManual = v.source === 'manual';
    if (isManual) {
      doc.setFillColor(254, 226, 226);
      doc.roundedRect(margin, y, pageW - margin * 2, 10, 2, 2, 'F');
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('MANUALLY ISSUED BY TRAFFIC OFFICER', pageW / 2, y + 6.5, { align: 'center' });
      y += 14;
    } else {
      doc.setFillColor(219, 234, 254);
      doc.roundedRect(margin, y, pageW - margin * 2, 10, 2, 2, 'F');
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('AI DETECTED — AUTOMATED E-CHALLAN', pageW / 2, y + 6.5, { align: 'center' });
      y += 14;
    }

    // ── Section Title ──
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('VIOLATION DETAILS', margin, y);
    y += 2;
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    // ── Details Table ──
    const violationDate = v.violation_date
      ? new Date(v.violation_date).toLocaleString()
      : 'N/A';

    const rows = [
      ['Challan Number', v.challan_no || 'N/A'],
      ['Vehicle Number', v.vehicle_number || 'N/A'],
      ['Violation Type', v.reason || 'N/A'],
      ['Helmet Status', 'Not Detected'],
      ['Fine Amount', `Rs. ${v.fine_amount?.toLocaleString() || 0}`],
      ['Date & Time', violationDate],
      ['Source', isManual ? 'Manual — Police Officer' : 'AI Detection — VIRIS'],
      ['Payment Status', v.payment_status || 'UNPAID'],
    ];

    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y - 5, pageW - margin * 2, 10, 'F');
      }
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin + 4, y);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value), pageW / 2 + 10, y);
      y += 10;
    });

    y += 8;

    // ── Payment Notice ──
    if (v.payment_status === 'UNPAID') {
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(margin, y, pageW - margin * 2, 20, 3, 3, 'F');
      doc.setTextColor(180, 83, 9);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('⚠ NOTICE: Pay the fine within 30 days to avoid additional penalties.', pageW / 2, y + 7, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('Visit https://echallan.parivahan.gov.in or contact your nearest RTO.', pageW / 2, y + 14, { align: 'center' });
    } else {
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(margin, y, pageW - margin * 2, 12, 3, 3, 'F');
      doc.setTextColor(21, 128, 61);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('✓ FINE HAS BEEN PAID — NO FURTHER ACTION REQUIRED', pageW / 2, y + 8, { align: 'center' });
    }

    y += 28;

    // ── Footer ──
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text('This is a system-generated document. No signature is required.', pageW / 2, y, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()} by VIRIS E-Challan System`, pageW / 2, y + 4, { align: 'center' });
    doc.text(`Downloaded by Citizen: ${user || 'N/A'}`, pageW / 2, y + 8, { align: 'center' });

    doc.save(`E-Challan_${v.vehicle_number || 'UNKNOWN'}_${v.challan_no || 'NA'}.pdf`);
    toast.success(t('citizenPortal.pdfDownloaded'));
  };

  return (
    <>
      {/* ── Profile Card ── */}
      <div className="citizen-profile-card">
        <div className="profile-avatar">
          {(user || 'C')[0].toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>{user || 'Citizen'}</h2>
          <div className="profile-meta">
            <span><Mail size={14} /> {email || 'Not provided'}</span>
            <span><Shield size={14} /> {role === 'admin' ? t('login.govtOfficer') : t('login.citizen')}</span>
          </div>
        </div>
      </div>

      {/* ── Search Card ── */}
      <div className="card citizen-search-card">
        <div className="card-header">
          <h3><Search size={18} style={{ display: 'inline', marginRight: 8 }} />{t('citizenPortal.searchTitle')}</h3>
        </div>

        <div className="citizen-search-info">
          <Info size={16} />
          <span>{t('citizenPortal.searchHint')}</span>
        </div>

        <form onSubmit={handleSearch} className="citizen-search-form">
          <div className="citizen-search-fields">
            <div className="input-group">
              <label htmlFor="challan-input">
                <Hash size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
                {t('citizenPortal.challanNo')}
              </label>
              <input
                id="challan-input"
                className="input"
                type="text"
                placeholder={t('citizenPortal.challanPlaceholder')}
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value.toUpperCase())}
                style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
              />
            </div>

            <div className="search-or-divider">
              <span>{t('login.or')}</span>
            </div>

            <div className="input-group">
              <label htmlFor="vehicle-input">
                <Car size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
                {t('citizenPortal.vehicleNo')}
              </label>
              <input
                id="vehicle-input"
                className="input"
                type="text"
                placeholder={t('citizenPortal.vehiclePlaceholder')}
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary citizen-search-btn"
            disabled={searching}
          >
            {searching ? (
              <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('citizenPortal.searching')}</>
            ) : (
              <><Search size={18} /> {t('citizenPortal.searchBtn')}</>
            )}
          </button>
        </form>
      </div>

      {/* ── Search Results ── */}
      {result && (
        <div style={{ animation: 'slideUp 0.4s ease' }}>
          {result.found ? (
            <>
              {/* Summary Cards */}
              <div className="stats-grid" style={{ marginTop: 24 }}>
                <div className="stat-card red">
                  <div className="stat-icon red"><AlertTriangle size={22} /></div>
                  <div className="stat-info">
                    <h4>{t('citizenPortal.totalViolations')}</h4>
                    <div className="stat-value">{result.summary.total_violations}</div>
                  </div>
                </div>
                <div className="stat-card orange">
                  <div className="stat-icon orange"><Clock size={22} /></div>
                  <div className="stat-info">
                    <h4>{t('citizenPortal.unpaidFines')}</h4>
                    <div className="stat-value">₹{result.summary.total_unpaid?.toLocaleString()}</div>
                    <div className="stat-change down">{result.summary.unpaid_count} {t('citizenPortal.pending')}</div>
                  </div>
                </div>
                <div className="stat-card green">
                  <div className="stat-icon green"><CheckCircle2 size={22} /></div>
                  <div className="stat-info">
                    <h4>{t('citizenPortal.paidFines')}</h4>
                    <div className="stat-value">₹{result.summary.total_paid?.toLocaleString()}</div>
                    <div className="stat-change up">{result.summary.paid_count} {t('citizenPortal.cleared')}</div>
                  </div>
                </div>
                <div className="stat-card blue">
                  <div className="stat-icon blue"><DollarSign size={22} /></div>
                  <div className="stat-info">
                    <h4>{t('citizenPortal.totalFine')}</h4>
                    <div className="stat-value">₹{result.summary.total_fines?.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Violations Table */}
              <div className="table-container" style={{ marginTop: 20 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('citizenPortal.challanNo')}</th>
                      <th>{t('citizenPortal.vehicleNo')}</th>
                      <th>{t('citizenPortal.reason')}</th>
                      <th>{t('citizenPortal.fine')}</th>
                      <th>{t('citizenPortal.date')}</th>
                      <th>{t('citizenPortal.source')}</th>
                      <th>{t('citizenPortal.challanPdf')}</th>
                      <th>{t('citizenPortal.status')}</th>
                      <th>{t('citizenPortal.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.violations.map((v) => (
                      <tr key={v.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary)' }}>
                          {v.challan_no || '—'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.vehicle_number || '—'}</td>
                        <td>{v.reason || '—'}</td>
                        <td style={{ fontWeight: 700 }}>₹{v.fine_amount?.toLocaleString()}</td>
                        <td>{v.violation_date ? new Date(v.violation_date).toLocaleDateString() : '—'}</td>
                        <td>
                          <span className={`badge ${v.source === 'manual' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                            {v.source === 'manual' ? '👮 Manual' : '🤖 AI'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-pdf btn-sm"
                            onClick={() => downloadChallanPDF(v)}
                            title={t('citizenPortal.downloadPdf')}
                            style={{ gap: 5 }}
                          >
                            <Download size={13} />
                            PDF
                          </button>
                        </td>
                        <td>
                          <span className={`badge ${v.payment_status === 'PAID' ? 'badge-success' : 'badge-error'}`}>
                            {v.payment_status}
                          </span>
                        </td>
                        <td>
                          {v.payment_status === 'UNPAID' ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handlePay(v.vehicle_number)}
                              disabled={payingId === v.vehicle_number}
                              style={{ gap: 6 }}
                            >
                              {payingId === v.vehicle_number ? (
                                <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                              ) : (
                                <CreditCard size={14} />
                              )}
                              {t('citizenPortal.payNow')}
                            </button>
                          ) : (
                            <span style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: 500 }}>✓ {t('citizenPortal.paid')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="card" style={{ marginTop: 24 }}>
              <div className="empty-state">
                <CheckCircle2 size={48} />
                <h3>{t('citizenPortal.noChallanFound')}</h3>
                <p>{t('citizenPortal.noChallanMsg')}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
