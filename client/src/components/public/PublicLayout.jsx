import { Outlet } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';

export const PublicLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-app">
      <PublicNavbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};
