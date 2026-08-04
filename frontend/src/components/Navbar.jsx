import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Zap, Bell, BookOpen, Map, BarChart2, RefreshCw, Sun, Moon } from 'lucide-react';
import { useToast } from '../contexts/ToastProvider';
import { useTheme } from '../contexts/ThemeProvider';

export default function Navbar() {
  const location = useLocation();
  const [counts, setCounts] = useState({ poles: 0, dts: 0, feeders: 0 });
  const [isResetting, setIsResetting] = useState(false);
  
  // Consume context hooks
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await axios.get('/api/network');
        const data = res.data;
        
        const uniqueDTs = new Set(data.map(p => p.dt_id)).size;
        const uniqueFeeders = new Set(data.map(p => p.feeder_id)).size;
        
        setCounts({
          poles: data.length,
          dts: uniqueDTs,
          feeders: uniqueFeeders
        });
      } catch (err) {
        console.error("Failed to fetch network counts for Navbar", err);
      }
    };
    
    fetchCounts();
  }, []);

  const handleReset = async () => {
    if (!window.confirm("WARNING: This will instantly clear all tickets and restore power to the entire grid. Proceed?")) return;
    
    setIsResetting(true);
    addToast('Initiating grid reset protocol...', 'info', 2000);
    
    try {
      await axios.post('/api/simulator/reset');
      addToast('Grid successfully restored to baseline state.', 'success');
      
      setTimeout(() => {
        setIsResetting(false);
        window.location.reload(); 
      }, 800);
    } catch (err) {
      console.error("Failed to reset grid", err);
      addToast('Failed to reset the grid. Check backend logs.', 'error');
      setIsResetting(false);
    }
  };

  const isActive = (path) => location.pathname === path 
    ? 'text-text-primary bg-background-active' 
    : 'text-text-secondary hover:text-text-primary hover:bg-background-hover';

  return (
    <header className="flex items-center justify-between bg-background-secondary p-4 border-b border-border shadow-md z-50 transition-colors duration-300">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Zap className="text-warning" size={32} />
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">KSPDB Console</h1>
      </div>
      
      {/* Global Asset Metrics */}
      <div className="hidden md:flex items-center gap-6 bg-background-primary border border-border px-6 py-2 rounded-full transition-colors duration-300">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted font-bold uppercase tracking-wider">Feeders</span>
          <span className="font-mono text-text-primary bg-background-secondary border border-border px-2 py-0.5 rounded">{counts.feeders}</span>
        </div>
        <div className="w-px h-4 bg-border"></div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted font-bold uppercase tracking-wider">Transformers</span>
          <span className="font-mono text-text-primary bg-background-secondary border border-border px-2 py-0.5 rounded">{counts.dts}</span>
        </div>
        <div className="w-px h-4 bg-border"></div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted font-bold uppercase tracking-wider">Poles</span>
          <span className="font-mono text-text-primary bg-background-secondary border border-border px-2 py-0.5 rounded">{counts.poles}</span>
        </div>
      </div>
      
      {/* Navigation & Controls */}
      <nav className="flex items-center gap-4">
        
        {/* Reset Button */}
        <button 
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-2 px-4 py-2 mr-2 bg-background-primary hover:bg-background-hover text-error border border-error/50 rounded-lg transition font-medium disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={18} className={isResetting ? 'animate-spin' : ''} />
          <span className="hidden lg:inline">Reset Grid</span>
        </button>

        <div className="w-px h-6 bg-border"></div>

        <Link to="/" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isActive('/')}`}>
          <Map size={20} /> <span className="font-medium hidden lg:inline">Grid</span>
        </Link>
        <Link to="/metrics" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isActive('/metrics')}`}>
          <BarChart2 size={20} /> <span className="font-medium hidden lg:inline">Metrics</span>
        </Link>
        <Link to="/docs" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isActive('/docs')}`}>
          <BookOpen size={20} /> <span className="font-medium hidden lg:inline">Docs</span>
        </Link>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-hover transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {/* The Big Notification Button */}
        <Link to="/faults" className={`relative flex items-center justify-center p-3 rounded-full ml-2 transition-all shadow-sm ${
          location.pathname === '/faults' ? 'bg-background-active text-error border border-border' : 'bg-background-primary border border-transparent text-text-secondary hover:bg-background-hover hover:border-border'
        }`}>
          <Bell size={24} className={location.pathname !== '/faults' ? 'animate-[wiggle_1s_ease-in-out_infinite] text-warning' : ''} />
          <span className="absolute top-2 right-2 w-3 h-3 bg-error border-2 border-background-secondary rounded-full animate-pulse"></span>
        </Link>
      </nav>
    </header>
  );
}