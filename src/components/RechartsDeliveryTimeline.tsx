import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea as RechartsRefArea,
  Scatter
} from 'recharts';

const ReferenceArea = RechartsRefArea as any;
import { Shield } from 'lucide-react';

interface RechartsDeliveryTimelineProps {
  currentGA: number;
  estimatedDeliveryGA: number;
  deliveryWindowStr?: string;
  visits?: Array<{ gestationalAgeWeeks: number; visitNumber: number; growthPercentile?: number }>;
}

export const RechartsDeliveryTimeline: React.FC<RechartsDeliveryTimelineProps> = ({
  currentGA,
  estimatedDeliveryGA,
  deliveryWindowStr = '37w 4d – 39w 1d',
  visits = []
}) => {
  // Parse estimated window range or default to +/- 0.8 weeks around estimatedDeliveryGA
  let estMinGA = Math.max(20, estimatedDeliveryGA - 0.8);
  let estMaxGA = Math.min(42, estimatedDeliveryGA + 0.8);

  if (deliveryWindowStr && deliveryWindowStr.includes('–')) {
    const parts = deliveryWindowStr.split('–').map(s => s.trim());
    const parseGA = (str: string) => {
      const match = str.match(/(\d+)w\s*(\d+)?d?/);
      if (match) {
        const w = parseInt(match[1], 10);
        const d = match[2] ? parseInt(match[2], 10) : 0;
        return w + d / 7;
      }
      return null;
    };
    const minVal = parseGA(parts[0]);
    const maxVal = parseGA(parts[1]);
    if (minVal !== null) estMinGA = minVal;
    if (maxVal !== null) estMaxGA = maxVal;
  }

  // Format serial visit data points for Recharts Scatter plot on the timeline
  const timelineData = visits.map(v => ({
    ga: v.gestationalAgeWeeks,
    y: 1,
    label: `Visit ${v.visitNumber} (${v.gestationalAgeWeeks}w)`,
    growthPercentile: v.growthPercentile ?? 'N/A'
  }));

  // Add dummy point if visits empty
  if (timelineData.length === 0) {
    timelineData.push({ ga: currentGA, y: 1, label: `Current Visit (${currentGA}w)`, growthPercentile: 'N/A' });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Recharts Gestational Timeline Visual
          </h4>
          <p className="text-[11px] text-slate-500">
            Interactive GA axis plotting Current Visit vs. Model Estimated Delivery Window against 37–40w Term Reference
          </p>
        </div>
        <span className="text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-bold">
          Recharts Engine
        </span>
      </div>

      {/* Recharts Container */}
      <div className="h-44 w-full relative pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={timelineData}
            margin={{ top: 25, right: 20, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={true} horizontal={false} />
            
            <XAxis
              type="number"
              dataKey="ga"
              domain={[20, 42]}
              ticks={[20, 22, 24, 26, 28, 30, 32, 34, 36, 37, 38, 39, 40, 42]}
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
              tickFormatter={(val) => `${val}w`}
              unit="w"
            />
            
            <YAxis type="number" dataKey="y" domain={[0.5, 1.5]} hide />

            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1 border border-slate-700 font-sans">
                    <div className="font-bold text-teal-400">{data.label}</div>
                    <div>Gestational Age: <span className="font-mono text-white font-bold">{data.ga} weeks</span></div>
                    {data.growthPercentile !== 'N/A' && (
                      <div>Growth Percentile: <span className="font-mono text-teal-300 font-bold">{data.growthPercentile}%</span></div>
                    )}
                  </div>
                );
              }}
            />

            {/* DISTINCT COLOR-CODED BAR 1: 37–40 Week Term Reference Band */}
            <ReferenceArea
              x1={37}
              x2={40}
              y1={0.6}
              y2={1.4}
              style={{ fill: '#ccfbf1', stroke: '#0d9488', strokeWidth: 1.5, strokeDasharray: '2 2' }}
              label={{
                value: '37–40w Term Reference',
                position: 'insideTop',
                fill: '#0f766e',
                fontSize: 10,
                fontWeight: 800
              }}
            />

            {/* DISTINCT COLOR-CODED BAR 2: Model Estimated Delivery Window Band */}
            <ReferenceArea
              x1={estMinGA}
              x2={estMaxGA}
              y1={0.75}
              y2={1.25}
              style={{ fill: '#0d9488', fillOpacity: 0.85, stroke: '#0f766e', strokeWidth: 2 }}
              label={{
                value: `Est. Window: ${deliveryWindowStr}`,
                position: 'insideBottom',
                fill: '#ffffff',
                fontSize: 10,
                fontWeight: 900
              }}
            />

            {/* Current Gestational Age Reference Line */}
            <ReferenceLine
              x={currentGA}
              stroke="#0f172a"
              strokeWidth={3}
              label={{
                value: `Current: ${currentGA}w`,
                position: 'top',
                fill: '#0f172a',
                fontSize: 11,
                fontWeight: 900
              }}
            />

            {/* Estimated Delivery GA Reference Line */}
            <ReferenceLine
              x={estimatedDeliveryGA}
              stroke="#0f766e"
              strokeWidth={2}
              strokeDasharray="4 4"
            />

            {/* Serial Scan Scatter Points */}
            <Scatter
              name="Serial Scans"
              data={timelineData}
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth={2}
              r={6}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Recharts Legend Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-900 shrink-0" />
          <span className="text-slate-700 font-semibold">Current GA: <strong>{currentGA}w</strong></span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3 rounded-sm bg-teal-600 border border-teal-700 shrink-0" />
          <span className="text-slate-700 font-semibold">Est. Delivery Window: <strong>{deliveryWindowStr}</strong></span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3 rounded-sm bg-teal-100 border border-teal-500 shrink-0" />
          <span className="text-slate-700 font-semibold">37–40w Term Reference Bar</span>
        </div>
      </div>
    </div>
  );
};
