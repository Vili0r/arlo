import { type TopPagesOutput } from "@/lib/tinybird";

interface TopPagesSectionProps {
  pages: TopPagesOutput[];
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

function formatViews(views: TopPagesOutput["views"]) {
  const formatter = new Intl.NumberFormat("en-US");

  if (typeof views === "bigint") {
    return formatter.format(views);
  }

  return formatter.format(Number(views));
}

export function TopPagesSection({
  pages,
  title = "Top Pages",
  description = "Tinybird page views from the last 7 days.",
  emptyTitle = "Waiting for page views",
  emptyDescription = "Open a few pages in the app and this list will start filling in.",
}: TopPagesSectionProps) {
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-white/45">{description}</p>
        </div>
        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
          Live
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
        {pages.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-medium text-white">{emptyTitle}</p>
            <p className="mt-1 text-xs text-white/50">{emptyDescription}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {pages.map((page, index) => (
              <div
                key={page.pathname}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-white/70">
                      {index + 1}
                    </span>
                    <code className="truncate rounded bg-black/20 px-2 py-1 text-xs text-white/85">
                      {page.pathname}
                    </code>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {formatViews(page.views)}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                    views
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
