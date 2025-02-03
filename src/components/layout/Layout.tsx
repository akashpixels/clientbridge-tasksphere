import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="flex">
        <Sidebar />
        <main className={cn(
          'flex-1 transition-all duration-300 ease-in-out',
          'pl-20 group-hover/sidebar:pl-64'
        )}>
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;