import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  CreditCard,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Eye,
  Home,
  Info,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Sidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const { role, user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/admin/upload', icon: Upload, label: t('sidebar.uploadDetect') },
    { to: '/admin/violations', icon: FileText, label: t('sidebar.violations') },
    { to: '/admin/analytics', icon: BarChart3, label: t('sidebar.analytics') },
  ];

  const userLinks = [
    { to: '/user/portal', icon: Home, label: t('sidebar.citizenPortal') },
    { to: '/user/my-violations', icon: Eye, label: t('sidebar.myViolations') },
    { to: '/user/payments', icon: CreditCard, label: t('sidebar.payments') },
  ];

  const links = role === 'admin' ? adminLinks : userLinks;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside
      className="sidebar"
      style={{
        width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        background: 'var(--sidebar-bg)',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-base)',
        zIndex: 100,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '20px 12px' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          minHeight: 'var(--topbar-height)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Shield size={20} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
              VIRIS
            </div>
            <div style={{ color: '#64748B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('sidebar.echallanSystem')}
            </div>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!collapsed && (
          <div style={{ padding: '8px 12px', fontSize: '0.68rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            {role === 'admin' ? t('sidebar.administration') : t('sidebar.myAccount')}
          </div>
        )}
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: collapsed ? '11px 0' : '11px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
              background: isActive ? 'var(--sidebar-active)' : 'transparent',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              transition: 'all var(--transition-fast)',
              textDecoration: 'none',
            })}
          >
            <link.icon size={19} />
            {!collapsed && link.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 12,
            padding: '10px 14px',
            border: 'none',
            background: 'transparent',
            color: 'var(--sidebar-text)',
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.target.style.background = 'var(--sidebar-hover)')}
          onMouseLeave={(e) => (e.target.style.background = 'transparent')}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && t('sidebar.collapse')}
        </button>

        {/* User + Logout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '10px 0' : '10px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            marginTop: 4,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {(user || 'U')[0].toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#E2E8F0', fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user || 'User'}
              </div>
              <div style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'capitalize' }}>
                {role}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              title={t('common.logout')}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 'var(--radius-sm)',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#EF4444')}
              onMouseLeave={(e) => (e.target.style.color = '#94A3B8')}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
