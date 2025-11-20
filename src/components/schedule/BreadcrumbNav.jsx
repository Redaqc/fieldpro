import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function BreadcrumbNav({ items }) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-4">
      <Link 
        to={createPageUrl('Dashboard')} 
        className="text-slate-600 hover:text-slate-900 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          {item.url ? (
            <Link 
              to={item.url} 
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}