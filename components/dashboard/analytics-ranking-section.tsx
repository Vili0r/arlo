interface AnalyticsRankingRow {
  key: string;
  label: string;
  value: number;
  detail?: string;
}

interface AnalyticsRankingSectionProps {
  title: string;
  description: string;
  rows: AnalyticsRankingRow[];
  emptyTitle: string;
  emptyDescription: string;
  valueLabel?: string;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function AnalyticsRankingSection({
  title,
  description,
  rows,
  emptyTitle,
  emptyDescription,
  valueLabel = "events",
}: AnalyticsRankingSectionProps) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xs text-white/45">{description}</p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/55">
          {rows.length} rows
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-8 text-center">
          <p className="text-sm font-medium text-white">{emptyTitle}</p>
          <p className="mt-1 text-xs text-white/50">{emptyDescription}</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-white/70">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm text-white/85">
                      {row.label}
                    </div>
                    {row.detail ? (
                      <div className="truncate text-[11px] uppercase tracking-[0.14em] text-white/35">
                        {row.detail}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-white">
                  {formatNumber(row.value)}
                </div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                  {valueLabel}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
