
import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavigationItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const NavigationItem = ({ to, icon, children }: NavigationItemProps) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            isActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )
        }
      >
        <span className="flex-shrink-0 w-5 h-5">{icon}</span>
        <span>{children}</span>
      </NavLink>
    </li>
  );
};

export default NavigationItem;
