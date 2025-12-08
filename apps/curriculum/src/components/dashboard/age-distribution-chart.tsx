/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrainingAnalytics } from "@/lib/hooks/useAnalytics";
import { cn } from "@/lib/utils";

interface AgeDistributionChartProps {
  data: TrainingAnalytics[];
  title?: string;
  className?: string;
}

export function AgeDistributionChart({
  data,
  title = "Age Distribution",
  className,
}: AgeDistributionChartProps) {
  // Aggregate age range data across all trainings
  const aggregatedData = data.reduce((acc, training) => {
    const { ageRangeCount } = training;
    
    // Add the age range counts to our accumulator
    Object.entries(ageRangeCount).forEach(([ageRange, count]) => {
      if (!acc[ageRange]) {
        acc[ageRange] = 0;
      }
      acc[ageRange] += count;
    });
    
    return acc;
  }, {} as Record<string, number>);
  
  // Define age range order for proper sorting
  const ageRangeOrder = ["<18", "18-25", "26-35", "36-45", "46+"];
  
  // Format the data for recharts
  const chartData = ageRangeOrder
    .filter(range => aggregatedData[range] > 0) // Only include age ranges with counts > 0
    .map(range => ({
      name: range,
      count: aggregatedData[range]
    }));
  
  // Calculate total for percentage
  const total = chartData.reduce((sum, item) => sum + item.count, 0);
  
  // Custom tooltip to make it prettier
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = ((value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border-2 border-gray-200 shadow-2xl rounded-xl backdrop-blur-md">
          <p className="font-bold text-sm text-gray-900">{`Age: ${label}`}</p>
          <p className="text-sm text-gray-700 mt-1 font-medium">{`${value} trainees (${percentage}%)`}</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Card className={cn("p-6 shadow-lg rounded-2xl overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50", className)}>
      <h3 className="text-lg font-bold mb-6 text-gray-900">{title}</h3>
      
      {chartData.length === 0 ? (
        <div className="h-64 w-full flex justify-center items-center text-gray-500">
          No age distribution data available
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 20,
              }}
            >
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1D4ED8" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#0A2342" stopOpacity={0.85}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" opacity={0.5} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }}
                axisLine={{ stroke: '#E5E5E5' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }}
                axisLine={{ stroke: '#E5E5E5' }}
                tickLine={false}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(29, 78, 216, 0.1)' }} />
              <Bar 
                dataKey="count" 
                name="Trainees" 
                fill="url(#colorGradient)" 
                radius={[8, 8, 0, 0]} 
                barSize={40}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
} 