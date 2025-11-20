import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient = "from-blue-500 to-blue-600",
  onClick 
}) {
  return (
    <Card className={`relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br ${gradient}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-white/90 text-sm font-medium mb-1">{title}</p>
            <p className="text-white text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-white/80 text-xs mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        
        {onClick && (
          <div className="flex items-center gap-1 text-white/90 text-xs font-medium hover:text-white transition-colors">
            <span>More info</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        )}

        {/* Decorative circle */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
      </CardContent>
    </Card>
  );
}