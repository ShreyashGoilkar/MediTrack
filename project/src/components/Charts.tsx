interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  max?: number;
}

export function BarChart({ data, max }: BarChartProps) {
  const maxVal = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3 group">
          <div className="w-32 shrink-0 text-sm text-slate-600 text-right truncate">{d.label}</div>
          <div className="flex-1 h-7 bg-slate-50 rounded-lg overflow-hidden relative">
            <div
              className={`h-full rounded-lg ${d.color ?? 'bg-teal-500'} animate-fade-up group-hover:brightness-110 transition-all`}
              style={{ width: `${(d.value / maxVal) * 100}%`, animationDelay: `${i * 60}ms`, transformOrigin: 'left' }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-700">
              {d.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ data, size = 180 }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);
  let offset = 0;

  const segments = data.map((d) => {
    const fraction = total > 0 ? d.value / total : 0;
    const dash = fraction * circumference;
    const seg = { ...d, dash, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={radius}
            cy={radius}
            r={radius - strokeWidth / 2}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {total > 0 && segments.map((s, i) => (
            <circle
              key={i}
              cx={radius}
              cy={radius}
              r={radius - strokeWidth / 2}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeDashoffset={-s.offset}
              className="transition-all duration-700 ease-out hover:brightness-110"
              style={{ transitionDelay: `${i * 80}ms` }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900 animate-count">{total}</span>
          <span className="text-xs text-slate-500 mt-0.5">Total</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-sm animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
            <span className="h-3 w-3 rounded-sm transition-transform hover:scale-125" style={{ backgroundColor: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="ml-auto font-semibold text-slate-900">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
