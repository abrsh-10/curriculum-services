import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrainingAnalytics } from "@/lib/hooks/useAnalytics";
import { cn } from "@/lib/utils";

interface TrainingCompletionChartProps {
  data: TrainingAnalytics[];
  title?: string;
  className?: string;
  limit?: number;
}

export function TrainingCompletionChart({
  data,
  title = "Training Completion Status",
  className,
  limit = 5,
}: TrainingCompletionChartProps) {
  // Sort data by total trainee count (descending)
  const sortedData = [...data]
    .filter(item => item.totalTraineeCount > 0)
    .sort((a, b) => b.totalTraineeCount - a.totalTraineeCount)
    .slice(0, limit);
  
  // Format the data for recharts
  const chartData = sortedData.map(training => {
    const completed = training.completedTraineeCount;
    const inProgress = training.totalTraineeCount - training.completedTraineeCount;
    
    return {
      name: training.trainingName.length > 15 
        ? `${training.trainingName.substring(0, 15)}...` 
        : training.trainingName,
      fullName: training.trainingName,
      completed,
      inProgress,
      total: training.totalTraineeCount,
    };
  });
  
  // Custom tooltip for prettier display
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const training = chartData.find(item => item.name === label);
      
      const fullName = (training?.fullName ?? label) ?? "";
      const truncatedName = fullName.length > 40 
        ? `${fullName.substring(0, 40)}...` 
        : fullName;
      
      return (
        <div className="bg-white p-4 border-2 border-gray-200 shadow-2xl rounded-xl max-w-xs">
          <p className="font-bold text-sm text-gray-900 mb-2 break-words">
            {truncatedName}
          </p>
          <div className="mt-2 space-y-1.5">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                <p className="text-sm font-medium text-gray-800">
                  {`${entry.name}: ${entry.value}`}
                </p>
              </div>
            ))}
            <p className="text-sm font-semibold text-gray-900 border-t-2 border-gray-200 pt-2 mt-2">
              {`Total: ${training?.total} trainees`}
            </p>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Card className={cn("p-6 shadow-lg rounded-2xl overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50", className)}>
      <h3 className="text-lg font-bold mb-14 text-gray-900">{title}</h3>
      
      {chartData.length === 0 ? (
        <div className="h-64 w-full flex justify-center items-center text-gray-500">
          No trainee completion data available
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
              layout="vertical"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                horizontal={true} 
                vertical={false} 
                stroke="#E5E5E5"
                opacity={0.5}
              />
              <XAxis 
                type="number" 
                tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }}
                axisLine={{ stroke: '#E5E5E5' }}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                axisLine={{ stroke: '#E5E5E5' }}
                tickLine={false}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(29, 78, 216, 0.08)' }}
              />
              <Legend 
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingTop: '15px' }}
              />
              <Bar 
                dataKey="completed" 
                name="Completed" 
                stackId="a" 
                fill="#B6FF5D" 
                radius={[0, 0, 0, 0]} 
                isAnimationActive={false}
              />
              <Bar 
                dataKey="inProgress" 
                name="In Progress" 
                stackId="a" 
                fill="#1D4ED8" 
                radius={[0, 8, 8, 0]} 
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
} 