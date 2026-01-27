
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Layers, 
  Maximize,
  Columns, 
  History as HistoryIcon, 
  Info, 
  ChevronLeft,
  Hammer,
  LogOut,
  User as UserIcon
} from 'lucide-react';

import Dashboard from './views/Dashboard';
import BeamView from './views/BeamView';
import ColumnView from './views/ColumnView';
import SlabView from './views/SlabView';
import HistoryView from './views/HistoryView';
import AboutView from './views/AboutView';
import AuthView from './views/AuthView';
import ProfileView from './views/ProfileView';
import { useAuth } from './contexts/AuthContext';
import { useI18n } from './src/i18n/I18nContext';
import LanguageToggle from './components/LanguageToggle';
import ConfirmDialog from './components/ConfirmDialog';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [logoutError, setLogoutError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const getTitle = () => {
    switch (location.pathname) {
      case '/': return t('nav.dashboardTitle');
      case '/beam': return t('nav.beamTitle');
      case '/column': return t('nav.columnTitle');
      case '/slab': return t('nav.slabTitle');
      case '/history': return t('nav.historyTitle');
      case '/about': return t('nav.aboutTitle');
      case '/profile': return t('nav.profileTitle');
      default: return t('nav.appTitle');
    }
  };

  const isHome = location.pathname === '/';
  const isAuth = location.pathname === '/login';

  const handleLogout = async () => {
    setLogoutError(false);
    try {
      setLogoutBusy(true);
      await logout();
      navigate('/login?logged_out=1', { replace: true });
    } catch (error) {
      setLogoutError(true);
    } finally {
      setLogoutBusy(false);
      setConfirmOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-blue-700 text-white px-4 py-4 shadow-md flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isHome && (
            <Link to="/" className="p-1 hover:bg-blue-600 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </Link>
          )}
          <div className="flex items-center gap-2">
            {isHome && <Hammer size={24} className="text-orange-400" />}
            <h1 className="text-xl font-bold tracking-tight">{getTitle()}</h1>
          </div>
        </div>
        <div className="flex gap-4">
          <LanguageToggle className="bg-blue-600/40" />
          {user && !isAuth && (
            <Link to="/profile" className="opacity-80 hover:opacity-100 transition-opacity" title={t('nav.profileTooltip')}>
              <UserIcon size={22} />
            </Link>
          )}
          {user && !isAuth && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="opacity-80 hover:opacity-100 transition-opacity"
              title={t('nav.logoutTooltip')}
            >
              <LogOut size={22} />
            </button>
          )}
          <Link to="/about" className="opacity-80 hover:opacity-100 transition-opacity" title={t('nav.aboutTooltip')}>
            <Info size={22} />
          </Link>
        </div>
      </div>
      {logoutError && (
        <div className="w-full rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
          {t('auth.logoutFailed')}
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title={t('auth.logoutTitle')}
        message={t('auth.logoutMessage')}
        cancelLabel={t('auth.logoutCancel')}
        confirmLabel={t('auth.logoutConfirm')}
        confirmDisabled={logoutBusy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
      />
    </header>
  );
};

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useI18n();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-3 px-2 safe-area-bottom z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-blue-600' : 'text-slate-400'}`}>
        <Home size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">{t('nav.home')}</span>
      </Link>
      <Link to="/column" className={`flex flex-col items-center gap-1 ${isActive('/column') ? 'text-blue-600' : 'text-slate-400'}`}>
        <Columns size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">{t('nav.column')}</span>
      </Link>
      <Link to="/beam" className={`flex flex-col items-center gap-1 ${isActive('/beam') ? 'text-blue-600' : 'text-slate-400'}`}>
        <Maximize size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">{t('nav.beam')}</span>
      </Link>
      <Link to="/slab" className={`flex flex-col items-center gap-1 ${isActive('/slab') ? 'text-blue-600' : 'text-slate-400'}`}>
        <Layers size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">{t('nav.slab')}</span>
      </Link>
      <Link to="/history" className={`flex flex-col items-center gap-1 ${isActive('/history') ? 'text-blue-600' : 'text-slate-400'}`}>
        <HistoryIcon size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">{t('nav.history')}</span>
      </Link>
    </nav>
  );
};

const App: React.FC = () => {
  const { session, isLoading } = useAuth();
  const { t } = useI18n();

  // While Supabase restores session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <HashRouter>
      {!session ? (
        <Routes>
          <Route path="/login" element={<AuthView />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-slate-50 shadow-2xl">
          <Header />
          <main className="flex-1 pb-24 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/beam" element={<BeamView />} />
              <Route path="/column" element={<ColumnView />} />
              <Route path="/slab" element={<SlabView />} />
              <Route path="/history" element={<HistoryView />} />
              <Route path="/about" element={<AboutView />} />
              <Route path="/profile" element={<ProfileView />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      )}
    </HashRouter>
  );
};

export default App;

