import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="flex">
        <Sidebar />
        <div className={cn(
          'flex-1 ml-20 transition-[margin-left] duration-300 ease-in-out',
          'group-hover/sidebar:ml-64'
        )}>
          <main className="p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;