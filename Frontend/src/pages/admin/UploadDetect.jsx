import { useState, useRef, useEffect, useCallback } from 'react';
import { uploadImageAPI, vehicleLookupAPI, manualFineAPI, sendSmsAPI, detectPlateAPI } from '../../services/api';
import Webcam from 'react-webcam';
import {
  Upload as UploadIcon,
  Image,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  FileImage,
  Download,
  Search,
  Car,
  ClipboardList,
  AlertCircle,
  Send,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// ── Dummy vehicle SVG as base64 (used when no real image available) ──────────
const DUMMY_VEHICLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220">
  <rect width="400" height="220" fill="#F1F5F9"/>
  <rect x="60" y="80" width="280" height="90" rx="18" fill="#CBD5E1"/>
  <rect x="90" y="62" width="220" height="70" rx="12" fill="#94A3B8"/>
  <rect x="110" y="70" width="80" height="50" rx="6" fill="#BAE6FD"/>
  <rect x="210" y="70" width="80" height="50" rx="6" fill="#BAE6FD"/>
  <circle cx="110" cy="170" r="28" fill="#334155"/>
  <circle cx="110" cy="170" r="16" fill="#64748B"/>
  <circle cx="290" cy="170" r="28" fill="#334155"/>
  <circle cx="290" cy="170" r="16" fill="#64748B"/>
  <rect x="60" y="120" width="40" height="25" rx="4" fill="#FEF08A"/>
  <rect x="300" y="120" width="40" height="25" rx="4" fill="#FEF08A"/>
  <text x="200" y="210" text-anchor="middle" font-family="Arial" font-size="11" fill="#94A3B8">VIRIS — Vehicle Reference Image</text>
</svg>`;

const svgToDataUrl = () =>
  'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(DUMMY_VEHICLE_SVG)));

export default function UploadDetect() {
  const { t } = useTranslation();

  // ── AI Detection state ───────────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  // ── Manual Fine state ────────────────────────────────────────────────────
  const [searchPlate, setSearchPlate] = useState('');
  const [searching, setSearching]   = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [vehicleFound, setVehicleFound] = useState(false);
  const [fineReason, setFineReason]   = useState('No Helmet');
  const [fineAmount, setFineAmount]   = useState(1000);
  const [issuingFine, setIssuingFine] = useState(false);
  const [issuedFine, setIssuedFine]   = useState(null);

  const [sendingSmsId, setSendingSmsId] = useState(null);
  
  // ── Camera Scanner state ────────────────────────────────────────────────
  const [showCamera, setShowCamera] = useState(false);
  const [capturing, setCapturing]   = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const webcamRef = useRef(null);

  const handleCameraCapture = useCallback(async (silent = false) => {
    if (!webcamRef.current || capturing) return;
    setCapturing(true);
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });

      const detectRes = await detectPlateAPI(file);
      if (detectRes.data.success) {
        setSearchPlate(detectRes.data.plateNumber);
        setShowCamera(false);
        toast.success(t('upload.plateDetected', { plate: detectRes.data.plateNumber }));
        
        const plate = detectRes.data.plateNumber;
        setSearching(true);
        const lookupRes = await vehicleLookupAPI(plate);
        setVehicleFound(lookupRes.data.found);
        setVehicleInfo(lookupRes.data);
        setSearching(false);
      } else if (!silent) {
        toast.error("Could not detect number plate. Please try again.");
      }
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.detail || "Camera detection failed");
    } finally {
      setCapturing(false);
    }
  }, [capturing, vehicleInfo, t]);

  // ── Live Scan Logic ──────────────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (showCamera && !vehicleInfo) {
      interval = setInterval(() => {
        handleCameraCapture(true);
      }, 1800); // Scan every 1.8 seconds for more responsive feel
    }
    return () => clearInterval(interval);
  }, [showCamera, vehicleInfo, handleCameraCapture]);

  const handleManualSms = async (id) => {
    if (!id) return;
    setSendingSmsId(id);
    try {
      await sendSmsAPI(id);
      toast.success(t('violations.smsSent'));
    } catch (err) {
      toast.error(err.response?.data?.detail || t('violations.smsFailed'));
    }
    setSendingSmsId(null);
  };

  // ── AI Detection handlers ────────────────────────────────────────────────
  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await uploadImageAPI(file);
      setResult(res.data);
      if (res.data.violationDetected) {
        toast.error('⚠️ ' + t('upload.violationDetected') + '!');
      } else {
        toast.success('✅ ' + t('upload.noViolation'));
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Detection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  // ── Manual Fine handlers ─────────────────────────────────────────────────
  const handleVehicleLookup = async () => {
    const plate = searchPlate.trim().toUpperCase().replace(/\s+/g, '');
    if (!plate) { toast.error(t('upload.enterVehicle')); return; }
    setSearching(true);
    setVehicleInfo(null);
    setIssuedFine(null);
    try {
      const res = await vehicleLookupAPI(plate);
      setVehicleFound(res.data.found);
      setVehicleInfo(res.data);
    } catch {
      toast.error(t('upload.lookupError'));
    } finally {
      setSearching(false);
    }
  };

  const handleIssueFine = async () => {
    const plate = searchPlate.trim().toUpperCase().replace(/\s+/g, '');
    if (!plate) { toast.error(t('upload.enterVehicle')); return; }
    setIssuingFine(true);
    try {
      const res = await manualFineAPI({
        vehicle_number: plate,
        reason: fineReason,
        fine_amount: Number(fineAmount),
      });
      setIssuedFine(res.data);
      toast.success(`Fine of ₹${fineAmount} issued to ${plate}!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to issue fine');
    } finally {
      setIssuingFine(false);
    }
  };

  // ── PDF generation ────────────────────────────────────────────────────
  const downloadPDF = async (res = result, imgSrc = preview, isManual = false) => {
    if (!res) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, 42, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('VIRIS — E-Challan', pageW / 2, 16, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Vision-Based Rider Safety Monitoring & E-Challan Management System', pageW / 2, 24, { align: 'center' });
    doc.text('Government of India  |  Traffic Enforcement Division', pageW / 2, 30, { align: 'center' });

    const challanNo = (isManual ? 'MAN-' : 'VRS-') + Date.now().toString(36).toUpperCase();
    doc.setFontSize(8);
    doc.text(`Challan No: ${challanNo}`, pageW / 2, 37, { align: 'center' });

    y = 52;

    // Vehicle image
    try {
      let imgData;
      if (imgSrc) {
        imgData = await toBase64(imgSrc);
      } else {
        imgData = svgToDataUrl();
      }
      const imgW = pageW - margin * 2;
      const imgH = 75;
      doc.addImage(imgData, imgSrc ? 'JPEG' : 'SVG', margin, y, imgW, imgH);
      y += imgH + 8;
    } catch { /* skip */ }

    if (isManual) {
      doc.setFillColor(254, 226, 226);
      doc.roundedRect(margin, y, pageW - margin * 2, 10, 2, 2, 'F');
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('MANUALLY ISSUED BY TRAFFIC OFFICER', pageW / 2, y + 6.5, { align: 'center' });
      y += 14;
    }

    // Details table
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('VIOLATION DETAILS', margin, y);
    y += 2;
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    const vehicleNum = isManual
      ? searchPlate.trim().toUpperCase().replace(/\s+/g, '')
      : (res.vehicleNumber || 'N/A');

    const rows = [
      ['Vehicle Number', vehicleNum],
      ['Violation Type', isManual ? fineReason : (res.reason || 'N/A')],
      ['Helmet Status', 'Not Detected'],
      ['Fine Amount', `Rs. ${(isManual ? fineAmount : res.fineAmount)?.toLocaleString() || 0}`],
      ['Date & Time', new Date().toLocaleString()],
      ['Source', isManual ? 'Manual — Police Officer' : 'AI Detection — VIRIS'],
      ['Payment Status', 'UNPAID'],
      ['Challan Number', challanNo],
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

    y += 6;

    // Notice
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, y, pageW - margin * 2, 18, 3, 3, 'F');
    doc.setTextColor(180, 83, 9);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTICE: Pay the fine within 30 days to avoid additional penalties.', pageW / 2, y + 7, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Visit https://echallan.parivahan.gov.in or contact your nearest RTO.', pageW / 2, y + 13, { align: 'center' });

    y += 26;

    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text('This is a system-generated document. No signature is required.', pageW / 2, y, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()} by VIRIS E-Challan System`, pageW / 2, y + 4, { align: 'center' });

    doc.save(`E-Challan_${vehicleNum}_${challanNo}.pdf`);
    toast.success('E-Challan PDF downloaded!');
  };

  const toBase64 = (url) =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = url;
    });

  return (
    <>
      <div className="page-header">
        <h1>{t('upload.title')}</h1>
        <p>{t('upload.subtitle')}</p>
      </div>

      {/* ── AI Detection Section ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 1fr' : '1fr', gap: 24, maxWidth: 900, marginBottom: 32 }}>
        <div className="card">
          <div className="card-header">
            <h3>{t('upload.aiDetect')}</h3>
            {file && (
              <button className="btn btn-ghost btn-sm" onClick={resetAll}>
                <X size={16} /> {t('upload.clear')}
              </button>
            )}
          </div>

          {!preview ? (
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className="upload-icon"><UploadIcon size={24} /></div>
              <h4>{t('upload.dropHere')}</h4>
              <p>{t('upload.supports')}</p>
              <input ref={inputRef} type="file" accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div>
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16 }}>
                <img src={preview} alt="Preview" style={{ width: '100%', height: 280, objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <FileImage size={16} /> {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleUpload} disabled={loading}>
                {loading ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('upload.analyzing')}</> : <><Image size={18} /> {t('upload.runDetection')}</>}
              </button>
            </div>
          )}
        </div>

        {result && (
          <div className="card" style={{ animation: 'slideUp 0.4s ease' }}>
            <div className="card-header"><h3>{t('upload.detectionResult')}</h3></div>
            <div className="detection-result">
              <div className={`detection-result-header ${result.violationDetected ? 'violation' : 'safe'}`}>
                {result.violationDetected ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                {result.violationDetected ? t('upload.violationDetected') : t('upload.noViolation')}
              </div>
              <div className="detection-result-body">
                <div className="result-item"><span className="label">{t('upload.helmetStatus')}</span><span className="value">{result.violationDetected ? t('upload.notDetected') : t('upload.detected')}</span></div>
                <div className="result-item"><span className="label">{t('upload.vehicleNumber')}</span><span className="value" style={{ fontFamily: 'monospace' }}>{result.vehicleNumber || '—'}</span></div>
                <div className="result-item"><span className="label">{t('upload.fineAmount')}</span><span className="value" style={{ color: result.fineAmount > 0 ? 'var(--error)' : 'var(--success)' }}>₹{result.fineAmount?.toLocaleString() || 0}</span></div>
                <div className="result-item"><span className="label">{t('upload.reason')}</span><span className="value">{result.reason || 'None'}</span></div>
                <div className="result-item"><span className="label">{t('upload.dateTime')}</span><span className="value">{result.date ? new Date(result.date).toLocaleString() : '—'}</span></div>
                <div className="result-item"><span className="label">{t('dashboard.status')}</span><span className="badge badge-warning">{t('upload.statusPending')}</span></div>
              </div>
            </div>
            {result.violationDetected && (
              <>
                <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#B45309' }}>
                  {t('upload.challlanGenerated')}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => downloadPDF(result, preview, false)}>
                    <Download size={18} /> {t('upload.downloadPdf')}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, gap: 8 }} 
                    onClick={() => handleManualSms(result.id)}
                    disabled={sendingSmsId === result.id}
                  >
                    {sendingSmsId === result.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><Send size={18} /> {t('upload.sendSms')}</>}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Manual Fine Section ───────────────────────────────────────── */}
      <div className="card" style={{ maxWidth: 900 }}>
        <div className="card-header">
          <h3><ClipboardList size={18} style={{ display: 'inline', marginRight: 8 }} />{t('upload.manualFine')}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className={`btn btn-sm ${showCamera ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setShowCamera(!showCamera)}
              >
                <Camera size={16} /> {showCamera ? t('upload.hideCamera') : t('upload.scanViaCamera')}
              </button>
              <span className="badge badge-info">{t('upload.officerOnly')}</span>
          </div>
        </div>

        {/* Camera Scanner View */}
        {showCamera && (
          <div style={{ marginBottom: 20, animation: 'fadeIn 0.3s ease' }}>
            <div className="scanner-container">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ 
                  width: { ideal: 1280 }, 
                  height: { ideal: 720 }, 
                  facingMode: "user" 
                }}
                onUserMedia={() => setCameraError(null)}
                onUserMediaError={(err) => {
                  console.error("Camera Error:", err);
                  setCameraError(err.toString());
                  toast.error("Camera access failed. Check permissions.");
                }}
                style={{ width: '100%', display: 'block' }}
              />
              <div className="scanner-overlay">
                <div className="scanner-reticle">
                  <span />
                  <div className="scanner-line" />
                </div>
                <div className="scanner-hint">Align number plate within the frame</div>
              </div>
              
              {cameraError && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', color: 'white', padding: 20, textAlign: 'center' }}>
                  <AlertCircle size={40} color="var(--error)" style={{ marginBottom: 12 }} />
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Camera Blocked or Not Found</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Please ensure camera permissions are granted in your browser and no other app is using it.</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--primary-light)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                <RefreshCw size={18} style={{ animation: 'spin 2s linear infinite' }} />
                <span>Live Scanning Active—Show Number Plate to Camera</span>
              </div>
              <button className="btn btn-ghost" onClick={() => setShowCamera(false)}>{t('upload.cancel')}</button>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input
            className="input"
            style={{ flex: 1, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            placeholder={t('upload.vehiclePlaceholder')}
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleVehicleLookup()}
          />
          <button className="btn btn-secondary" onClick={handleVehicleLookup} disabled={searching} style={{ minWidth: 110 }}>
            {searching ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><Search size={16} /> {t('upload.lookup')}</>}
          </button>
        </div>

        {/* Vehicle info */}
        {vehicleInfo !== null && (
          <div style={{ marginBottom: 20, animation: 'slideUp 0.3s ease' }}>
            {vehicleFound ? (
              <div style={{ background: 'var(--success-bg, #F0FDF4)', border: '1px solid #86EFAC', borderRadius: 'var(--radius-md)', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#15803D', fontWeight: 600 }}>
                  <Car size={18} /> {t('upload.vehicleFound')} — {vehicleInfo.records.length} {t('upload.records')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {vehicleInfo.records.slice(0, 3).map((r) => (
                    <div key={r.id} style={{ background: 'white', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: 4, fontFamily: 'monospace' }}>{r.vehicle_number}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{r.reason}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <span style={{ fontWeight: 600 }}>₹{r.fine_amount?.toLocaleString()}</span>
                        <span className={`badge ${r.payment_status === 'PAID' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>{r.payment_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 'var(--radius-md)', color: '#92400E' }}>
                <AlertCircle size={18} />
                <div>
                  <div style={{ fontWeight: 600 }}>{t('upload.noRecordsFound')}</div>
                  <div style={{ fontSize: '0.82rem', marginTop: 2 }}>{t('upload.noRecordsMsg', { plate: searchPlate })}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Issue Fine form */}
        {vehicleInfo !== null && !issuedFine && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <h4 style={{ marginBottom: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{t('upload.issueFine')} <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{searchPlate}</span></h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div className="input-group">
                <label>{t('upload.violationReason')}</label>
                <select className="input" value={fineReason} onChange={(e) => setFineReason(e.target.value)}>
                  <option>{t('upload.noHelmet')}</option>
                  <option>{t('upload.tripleRiding')}</option>
                  <option>{t('upload.recklessDriving')}</option>
                  <option>{t('upload.signalViolation')}</option>
                  <option>{t('upload.overspeeding')}</option>
                  <option>{t('upload.wrongLane')}</option>
                  <option>{t('upload.noLicense')}</option>
                  <option>{t('upload.other')}</option>
                </select>
              </div>
              <div className="input-group">
                <label>{t('upload.fineAmountLabel')}</label>
                <input className="input" type="number" min="100" step="100"
                  value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleIssueFine} disabled={issuingFine}>
                {issuingFine ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> {t('upload.issuing')}</> : t('upload.issueFineBtn')}
              </button>
            </div>
          </div>
        )}

        {/* Success — fine issued */}
        {issuedFine && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', marginBottom: 14 }}>
              <AlertTriangle size={18} color="#DC2626" />
              <div>
                <div style={{ fontWeight: 700, color: '#DC2626' }}>{t('upload.fineIssuedSuccess')}</div>
                <div style={{ fontSize: '0.82rem', color: '#7F1D1D', marginTop: 2 }}>
                  Vehicle <b>{issuedFine.vehicle_number}</b> — ₹{issuedFine.fine_amount?.toLocaleString()} for <b>{issuedFine.reason}</b>
                </div>
              </div>
            </div>

            {/* Dummy vehicle image preview */}
            <div style={{ marginBottom: 14, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', background: '#F8FAFC' }}>
              <img src={svgToDataUrl()} alt="Vehicle Reference" style={{ width: '100%', height: 160, objectFit: 'contain', padding: 12 }} />
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', paddingBottom: 8 }}>{t('upload.refVehicleImage')}</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => downloadPDF(issuedFine, null, true)}>
                <Download size={16} /> {t('upload.downloadPdf')}
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, gap: 8 }} 
                onClick={() => handleManualSms(issuedFine.id)}
                disabled={sendingSmsId === issuedFine.id}
              >
                {sendingSmsId === issuedFine.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><Send size={16} /> {t('upload.sendSms')}</>}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setIssuedFine(null); setVehicleInfo(null); setSearchPlate(''); }}>
                {t('upload.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
