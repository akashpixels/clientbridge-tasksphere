import { Home, Folders, Users, CheckSquare, Users2, Beaker } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import NavigationItem from "./NavigationItem";

const SidebarNavigation = () => {

  return (
    <nav className="flex flex-col flex-1 px-4 py-4">
      <ul className="flex flex-col gap-1">
        <NavigationItem to="/" icon={<Home />}>Dashboard</NavigationItem>
        <NavigationItem to="/projects" icon={<Folders />}>Projects</NavigationItem>
        <NavigationItem to="/clients" icon={<Users />}>Clients</NavigationItem>
        <NavigationItem to="/tasks" icon={<CheckSquare />}>Tasks</NavigationItem>
        <NavigationItem to="/team" icon={<Users2 />}>Team</NavigationItem>
        
        {/* Add test subscription link */}
        <li className="mt-4 pt-4 border-t border-border">
          <NavigationItem to="/test-subscription" icon={<Beaker className="h-4 w-4" />}>
            <span className="flex items-center gap-2">
              Test Subscription
              <span className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded">Debug</span>
            </span>
          </NavigationItem>
        </li>
      </ul>
    </nav>
  );
};

export default SidebarNavigation;
