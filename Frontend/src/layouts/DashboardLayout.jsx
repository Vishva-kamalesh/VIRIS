import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DashboardLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <Topbar />
      <main className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
