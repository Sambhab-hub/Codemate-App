import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopNav from '../components/layout/TopNav';

/**
 * AppLayout — the main authenticated shell.
 *
 * STRUCTURE:
 * ┌────────────────────────────────────────────────┐
 * │  Sidebar (fixed, 240px) │  TopNav              │
 * │                         ├──────────────────────│
 * │   Navigation links      │  Page content        │
 * │                         │  (scrollable)        │
 * └────────────────────────────────────────────────┘
 *
 * <Outlet /> renders the current page inside the main area.
 */
const AppLayout = () => {
  return (
    <div className="flex h-screen bg-[#0d1117] overflow-hidden">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Right side: topnav + scrollable page content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
