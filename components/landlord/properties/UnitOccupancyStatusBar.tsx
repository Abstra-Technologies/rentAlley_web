"use client";

interface Props {
    status?: string;
    hasPendingLease?: boolean;
}

export default function LandlordUnitStatusBanner({ status, hasPendingLease }: Props) {
    const normalized = status?.toLowerCase();

    let label = "Unoccupied";
    let styles = "bg-red-100 text-red-800";

    if (normalized === "occupied") {
        label = "Occupied";
        styles = "bg-green-100 text-green-800";
    } else if (hasPendingLease) {
        label = "Pending Lease";
        styles = "bg-amber-100 text-amber-800";
    }

    return (
        <div className="absolute top-3 right-3">
      <span
          className={`px-3 py-1 text-xs font-semibold rounded-full shadow-md ${styles}`}
      >
        {label}
      </span>
        </div>
    );
}
