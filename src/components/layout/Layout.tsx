import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="flex">
        <Sidebar />
        <main className={cn(
          'flex-1 p-8 transition-all duration-300',
          'ml-20 group-hover/sidebar:ml-64'
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;