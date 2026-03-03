import { Shield, Info, Activity, Database, Layout, Cpu } from 'lucide-react';
import blueprintImg from '../../assets/login_banner.png';

export default function AboutSystem() {
  return (
    <div className="about-system-page">
      <div className="page-header">
        <h1>System Architecture & Vision</h1>
        <p>Detailed overview of the Vision-Based Rider Safety Monitoring System.</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 30 }}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity className="text-secondary" /> 
            Sentinel AI Integrated Blueprint
          </h3>
        </div>
        <img 
          src={blueprintImg} 
          alt="System Blueprint" 
          style={{ width: '100%', display: 'block' }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="stat-icon blue" style={{ marginBottom: 16 }}>
            <Cpu size={24} />
          </div>
          <h3 style={{ marginBottom: 12 }}>Neural Engine</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Deep learning models optimized for real-time helmet detection and multi-class vehicle identification 
            running on high-performance inference servers.
          </p>
        </div>

        <div className="card">
          <div className="stat-icon green" style={{ marginBottom: 16 }}>
            <Shield size={24} />
          </div>
          <h3 style={{ marginBottom: 12 }}>Sentinel OCR</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Advanced Optical Character Recognition engine capable of reading standard and mirrored number plates 
            with 99%+ accuracy in varied lighting conditions.
          </p>
        </div>

        <div className="card">
          <div className="stat-icon orange" style={{ marginBottom: 16 }}>
            <Database size={24} />
          </div>
          <h3 style={{ marginBottom: 12 }}>Data Ecosystem</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            A distributed MongoDB architecture storing violations, vehicle history, and real-time analytics 
            for comprehensive law enforcement oversight.
          </p>
        </div>
      </div>
    </div>
  );
}
