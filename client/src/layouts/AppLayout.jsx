import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopNav from '../components/layout/TopNav';

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-[#0d1117] overflow-hidden">

      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
