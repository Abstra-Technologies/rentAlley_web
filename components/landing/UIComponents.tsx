import { Home } from "lucide-react";

export function SectionBadge({
  icon: Icon,
  text,
}: {
  icon: any;
  text: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-2 rounded-full mb-4 border border-blue-100">
      <Icon className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
        {text}
      </span>
    </div>
  );
}

export function LoadingSpinner({ color = "blue" }: { color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-20 h-20 mb-4">
        <div
          className={`absolute inset-0 border-4 border-${color}-100 rounded-full`}
        ></div>
        <div
          className={`absolute inset-0 border-4 border-${color}-600 border-t-transparent rounded-full animate-spin`}
        ></div>
      </div>
      <p className="text-gray-600 font-medium">Loading amazing properties...</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-3xl border-2 border-dashed border-gray-300 p-16 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Home className="w-12 h-12 text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 text-lg">{description}</p>
    </div>
  );
}
