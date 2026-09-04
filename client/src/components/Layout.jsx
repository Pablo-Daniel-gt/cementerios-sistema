import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export const Layout = () => {
  return (
    <div className="d-flex flex-column vh-100 overflow-hidden">
      <Navbar />
      <div className="d-flex flex-grow-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        <Sidebar />
        <main className="flex-grow-1 p-4 bg-light overflow-auto h-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
