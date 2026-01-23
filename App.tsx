
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Layers, 
  Maximize,
  Grid, 
  History as HistoryIcon, 
  Info, 
  ChevronLeft,
  Hammer,
  LogOut,
  User as UserIcon
} from 'lucide-react';

import Dashboard from './views/Dashboard';
import ConcreteCalc from './views/ConcreteCalc';
import FormworkCalc from './views/FormworkCalc';
import RebarCalc from './views/RebarCalc';
import HistoryView from './views/HistoryView';
import AboutView from './views/AboutView';
import AuthView from './views/AuthView';
import ProfileView from './views/ProfileView';
import { useAuth } from './contexts/AuthContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'ISQM Dashboard';
      case '/concrete': return 'Concrete Volume';
      case '/formwork': return 'Formwork Area';
      case '/rebar': return 'Rebar Quantity';
      case '/history': return 'Calculation History';
      case '/about': return 'About ISQM';
      case '/profile': return 'My Profile';
      default: return 'ISQM App';
    }
  };

  const isHome = location.pathname === '/';
  const isAuth = location.pathname === '/auth';

  return (
    <header className="sticky top-0 z-50 bg-blue-700 text-white px-4 py-4 shadow-md flex items-center justify-between">
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
        {user && !isAuth && (
          <Link to="/profile" className="opacity-80 hover:opacity-100 transition-opacity" title="My Profile">
            <UserIcon size={22} />
          </Link>
        )}
        {user && !isAuth && (
          <button
            onClick={signOut}
            className="opacity-80 hover:opacity-100 transition-opacity"
            title="Logout"
          >
            <LogOut size={22} />
          </button>
        )}
        <Link to="/about" className="opacity-80 hover:opacity-100 transition-opacity">
          <Info size={22} />
        </Link>
      </div>
    </header>
  );
};

const BottomNav: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-3 px-2 safe-area-bottom z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-blue-600' : 'text-slate-400'}`}>
        <Home size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Home</span>
      </Link>
      <Link to="/concrete" className={`flex flex-col items-center gap-1 ${isActive('/concrete') ? 'text-blue-600' : 'text-slate-400'}`}>
        <Layers size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Concrete</span>
      </Link>
      <Link to="/formwork" className={`flex flex-col items-center gap-1 ${isActive('/formwork') ? 'text-blue-600' : 'text-slate-400'}`}>
        <Maximize size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Formwork</span>
      </Link>
      <Link to="/rebar" className={`flex flex-col items-center gap-1 ${isActive('/rebar') ? 'text-blue-600' : 'text-slate-400'}`}>
        <Grid size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Rebar</span>
      </Link>
      <Link to="/history" className={`flex flex-col items-center gap-1 ${isActive('/history') ? 'text-blue-600' : 'text-slate-400'}`}>
        <HistoryIcon size={22} />
        <span className="text-[10px] font-medium uppercase tracking-wider">History</span>
      </Link>
    </nav>
  );
};

const App: React.FC = () => {
  const { session, isLoading } = useAuth();

  // While Supabase restores session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">
        Loading…
      </div>
    );
  }

  return (
    <HashRouter>
      {!session ? (
        <Routes>
          <Route path="*" element={<AuthView />} />
        </Routes>
      ) : (
        <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-slate-50 shadow-2xl">
          <Header />
          <main className="flex-1 pb-24 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/concrete" element={<ConcreteCalc />} />
              <Route path="/formwork" element={<FormworkCalc />} />
              <Route path="/rebar" element={<RebarCalc />} />
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
