import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className={cn(
        'ml-20 lg:ml-64 p-8 transition-all duration-300',
        'animate-fadeIn'
      )}>
        {children}
      </main>
    </div>
  );
};

export default Layout;