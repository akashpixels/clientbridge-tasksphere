
import { BarChart3, FileText, Home, Layers, Users } from "lucide-react";
import NavigationItem from "./NavigationItem";

interface SidebarNavigationProps {
  isOpen: boolean;
}

const SidebarNavigation = ({ isOpen }: SidebarNavigationProps) => {
  return (
    <nav className="mt-2 space-y-1">
      <ul className={`space-y-1 ${!isOpen && 'flex flex-col items-center'}`}>
        <NavigationItem to="/" icon={<Home />}>
          {isOpen ? 'Dashboard' : ''}
        </NavigationItem>
        <NavigationItem to="/projects" icon={<Layers />}>
          {isOpen ? 'Projects' : ''}
        </NavigationItem>
        <NavigationItem to="/tasks" icon={<FileText />}>
          {isOpen ? 'Tasks' : ''}
        </NavigationItem>
        <NavigationItem to="/clients" icon={<Users />}>
          {isOpen ? 'Clients' : ''}
        </NavigationItem>
        <NavigationItem to="/test-subscription" icon={<BarChart3 />}>
          {isOpen ? 'Test Subscription' : ''}
        </NavigationItem>
      </ul>
    </nav>
  );
};

export default SidebarNavigation;
