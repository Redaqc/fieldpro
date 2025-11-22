import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function StatsCard({ title, value, icon: Icon, iconColor, bgColor, trend }) {
  return (
    <Card className="relative overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
      <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-12 -translate-y-12 ${bgColor} rounded-full opacity-20`} />
      <CardHeader className="p-6 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <h3 className="text-3xl font-bold mt-2 text-slate-900">
              {value}
            </h3>
          </div>
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardHeader>
      {trend && (
        <CardContent className="p-6 pt-0">
          <div className="flex items-center text-sm text-slate-500">
            <span>{trend}</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}