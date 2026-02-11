
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Home, 
  History as HistoryIcon, 
  Info, 
  ChevronLeft,
  Hammer,
  User as UserIcon
} from 'lucide-react';

import Dashboard from './views/Dashboard';
import BeamMenuView from './views/BeamMenuView';
import ColumnMenuView from './views/ColumnMenuView';
import SlabMenuView from './views/SlabMenuView';
import ConcreteCalc from './views/ConcreteCalc';
import FormworkCalc from './views/FormworkCalc';
import SoffitCalc from './views/SoffitCalc';
import HistoryView from './views/HistoryView';
import AboutView from './views/AboutView';
import AuthView from './views/AuthView';
import ProfileView from './views/ProfileView';
import { useAuth } from './contexts/AuthContext';
import { useI18n } from './src/i18n/I18nContext';
import LanguageToggle from './components/LanguageToggle';

const Header: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();
  const path = location.pathname;
  const getTitle = () => {
    if (path === '/') return t('nav.dashboardTitle');
    if (path === '/beam') return t('flow.beamTitle');
    if (path === '/column') return t('flow.columnTitle');
    if (path === '/slab') return t('flow.slabTitle');
    if (path.endsWith('/konkrit')) return t('calc.concrete');
    if (path.endsWith('/kotak-acuan')) return t('calc.formwork');
    if (path.endsWith('/soffit-reinforcement')) return t('calc.soffit_reinforcement');
    if (path === '/history') return t('nav.historyTitle');
    if (path === '/about') return t('nav.aboutTitle');
    if (path === '/profile') return t('nav.profileTitle');
    return t('nav.appTitle');
  };

  const getBackPath = () => {
    if (path === '/' || path === '/login') return null;
    if (path.startsWith('/beam/')) return '/beam';
    if (path.startsWith('/column/')) return '/column';
    if (path.startsWith('/slab/')) return '/slab';
    if (path === '/beam' || path === '/column' || path === '/slab') return '/';
    return '/';
  };

  const backPath = getBackPath();
  const isHome = path === '/';
  const isAuth = path === '/login';

  return (
    <header className="sticky top-0 z-50 bg-blue-700 text-white px-4 py-4 shadow-md flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backPath && (
            <Link to={backPath} className="p-1 hover:bg-blue-600 rounded-full transition-colors">
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
          <Link to="/about" className="opacity-80 hover:opacity-100 transition-opacity" title={t('nav.aboutTooltip')}>
            <Info size={22} />
          </Link>
        </div>
      </div>
    </header>
  );
};

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useI18n();
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-3 px-2 safe-area-bottom z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-blue-600' : 'text-slate-400'}`}>
        <Home size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">{t('nav.home')}</span>
      </Link>
      <Link to="/history" className={`flex flex-col items-center gap-1 ${isActive('/history') ? 'text-blue-600' : 'text-slate-400'}`}>
        <HistoryIcon size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">{t('nav.history')}</span>
      </Link>
      <Link to="/about" className={`flex flex-col items-center gap-1 ${isActive('/about') ? 'text-blue-600' : 'text-slate-400'}`}>
        <Info size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">{t('nav.infoFaq')}</span>
      </Link>
      <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-blue-600' : 'text-slate-400'}`}>
        <UserIcon size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">{t('nav.profile')}</span>
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
              <Route path="/beam" element={<BeamMenuView />} />
              <Route
                path="/beam/konkrit"
                element={<ConcreteCalc entryType="beam" entryLabel={t('legacy.concrete.title')} outputKey="concrete_m3" />}
              />
              <Route
                path="/beam/kotak-acuan"
                element={<FormworkCalc entryType="beam" entryLabel={t('legacy.formwork.title')} outputKey="formwork_m2" />}
              />
              <Route path="/column" element={<ColumnMenuView />} />
              <Route
                path="/column/konkrit"
                element={<ConcreteCalc entryType="column" entryLabel={t('legacy.concrete.title')} outputKey="concrete_m3" />}
              />
              <Route
                path="/column/kotak-acuan"
                element={<FormworkCalc entryType="column" entryLabel={t('legacy.formwork.title')} outputKey="formwork_m2" />}
              />
              <Route path="/slab" element={<SlabMenuView />} />
              <Route
                path="/slab/konkrit"
                element={<ConcreteCalc entryType="slab" entryLabel={t('legacy.concrete.title')} outputKey="concrete_m3" />}
              />
              <Route
                path="/slab/kotak-acuan"
                element={<FormworkCalc entryType="slab" entryLabel={t('legacy.formwork.title')} outputKey="formwork_m2" />}
              />
              <Route
                path="/slab/soffit-reinforcement"
                element={<SoffitCalc />}
              />
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

