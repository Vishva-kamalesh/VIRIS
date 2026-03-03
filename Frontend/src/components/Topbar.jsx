import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../features/theme/themeSlice';
import { Sun, Moon, Bell } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Topbar() {
  const { t } = useTranslation();
  const { mode } = useSelector((s) => s.theme);
  const dispatch = useDispatch();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: 'var(--sidebar-width)',
        height: 'var(--topbar-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 28px',
        gap: 8,
        zIndex: 90,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button
          className="btn btn-ghost"
          onClick={() => setNotifOpen(!notifOpen)}
          style={{ position: 'relative' }}
        >
          <Bell size={19} />
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              background: 'var(--error)',
              borderRadius: '50%',
              border: '2px solid var(--bg-secondary)',
            }}
          />
        </button>

        {notifOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              width: 320,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: 16,
              zIndex: 100,
            }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>{t('topbar.notifications')}</h4>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              {t('topbar.noNotifications')}
            </div>
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <button
        className="btn btn-ghost"
        onClick={() => dispatch(toggleTheme())}
        title={mode === 'light' ? t('topbar.switchToDark') : t('topbar.switchToLight')}
      >
        {mode === 'light' ? <Moon size={19} /> : <Sun size={19} />}
      </button>
    </header>
  );
}
