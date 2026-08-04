import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ToastProvider } from './contexts/ToastProvider';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Faults from './pages/Faults';
import Docs from './pages/Docs';
import Metrics from './pages/Metrics';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 overflow-hidden p-4">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/faults" element={<Faults />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/metrics" element={<Metrics />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}