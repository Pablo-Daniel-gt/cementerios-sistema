import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export const Layout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main className="flex-grow-1 p-4 bg-light overflow-auto" style={{ maxHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
