import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { ToastProvider } from "./contexts/ToastProvider";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Faults from "./pages/Faults";
import Docs from "./pages/Docs";
import Metrics from "./pages/Metrics";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        {/* Mobile & Tablet */}
        <div className="flex min-h-screen items-center justify-center bg-background px-6 lg:hidden">
          <div className="max-w-md text-center">
            <div className="mb-6 text-6xl">💻</div>

            <h1 className="text-3xl font-bold">
              Laptop Required
            </h1>

            <p className="mt-4 text-muted-foreground">
              This dashboard is currently optimized for laptops and desktop
              computers.
            </p>

            <p className="mt-2 text-muted-foreground">
              Please switch to a laptop or desktop to continue.
            </p>
          </div>
        </div>

        {/* Laptop/Desktop */}
        <div className="hidden lg:block">
          <BrowserRouter>
            <div className="flex min-h-screen flex-col">
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
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}