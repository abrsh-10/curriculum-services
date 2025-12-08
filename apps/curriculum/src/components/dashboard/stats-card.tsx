import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  description,
  className,
  icon,
  trend,
}: StatsCardProps) {
  return (
    <Card className={cn("p-6 shadow-lg border-0 h-full bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300 group", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-2.5 flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 group-hover:text-[#1D4ED8] transition-colors">{value}</h3>
          {description && (
            <p className="text-sm text-gray-600 font-medium">{description}</p>
          )}
          {trend && (
            <div className="flex items-center mt-3 pt-2 border-t border-gray-200">
              <span
                className={cn(
                  "text-sm font-bold px-2 py-0.5 rounded-md",
                  trend.positive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                )}
              >
                {trend.positive ? "+" : "-"}{trend.value}
              </span>
              <span className="ml-2 text-xs text-gray-500 font-medium">
                since last month
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#0A2342] shadow-md group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
} 