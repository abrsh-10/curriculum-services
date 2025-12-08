import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface SessionMetricsItem {
  name: string;
  value: number;
  color: string;
}

interface SessionMetricsChartProps {
  data: SessionMetricsItem[];
  title?: string;
  className?: string;
}

export function SessionMetricsChart({
  data,
  title = "Session Metrics Overview",
  className,
}: SessionMetricsChartProps) {
  // Filter out items with zero value
  const chartData = data.filter(item => item.value > 0);
  
  // Calculate total for percentage
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Custom rendering for labels to make them prettier
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    // Position the text directly at the center of the arc rather than offset
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5; // Center between inner and outer radius
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Only show percentages for segments that are large enough
    if (percent < 0.05) return null;

    return (
      <g>
        {/* Add a subtle shadow/background to make text more readable */}
        <text
          x={x}
          y={y}
          fill="rgba(0,0,0,0.25)"
          fontSize={12}
          fontWeight="500"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <text
          x={x}
          y={y}
          fill="#fff"
          fontSize={12}
          fontWeight="500"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    );
  };

  // Custom legend to make it prettier
  const renderColorfulLegendText = (value: string) => {
    const item = chartData.find(item => item.name === value);
    const count = item?.value || 0;
    const percentage = total ? ((count / total) * 100).toFixed(0) : 0;
    
    return (
      <span className="text-sm">
        {`${value}: ${count} (${percentage}%)`}
      </span>
    );
  };
  
  return (
    <Card className={cn("p-6 shadow-lg rounded-2xl overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50", className)}>
      <h3 className="text-lg font-bold mb-6 text-gray-900">{title}</h3>
      
      {chartData.length === 0 ? (
        <div className="h-80 w-full flex justify-center items-center text-gray-500">
          No session metrics data available
        </div>
      ) : (
        <div className="h-80 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                fill="#8884d8"
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderCustomizedLabel}
                stroke="#fff"
                strokeWidth={3}
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    style={{ 
                      filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15))',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </Pie>
              <text 
                x="50%" 
                y="45%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-3xl font-bold fill-gray-900"
              >
                {total}
              </text>
              <text 
                x="50%" 
                y="55%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-sm font-medium fill-gray-500"
              >
                Total Sessions
              </text>
              <Tooltip
                formatter={(value: number) => [`${value} sessions`, 'Count']}
                contentStyle={{ 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)', 
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  fontWeight: '600'
                }}
                labelStyle={{
                  color: '#111827',
                  fontWeight: 'bold'
                }}
              />
              <Legend 
                formatter={renderColorfulLegendText}
                iconSize={10}
                iconType="circle"
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '15px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
} 