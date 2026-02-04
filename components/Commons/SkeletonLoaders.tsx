// components/Commons/SkeletonLoaders.tsx
// Reusable skeleton loading components

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <table className="min-w-full divide-y">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(5)].map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {[...Array(rows)].map((_, rowIdx) => (
            <tr key={rowIdx}>
              {[...Array(5)].map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2 pb-3 border-b border-gray-100">
            <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
          </div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 h-9 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-9 w-9 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LeaseCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
            </div>
            <div className="h-7 w-24 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="space-y-1">
              <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-10 w-10 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssetCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
            </div>
            <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-28 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-9 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-9 w-9 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-9 w-9 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScoreCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
            <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
