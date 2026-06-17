'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface HealthScoreRingProps {
  score: number;
  grade: string;
}

export function HealthScoreRing({ score, grade }: HealthScoreRingProps) {
  const data = [
    { value: score },
    { value: 100 - score },
  ];
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative mx-auto h-40 w-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={70}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-sm text-muted-foreground">Grade {grade}</span>
      </div>
    </div>
  );
}
