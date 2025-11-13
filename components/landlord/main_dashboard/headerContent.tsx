import SendTenantInviteModal from "../properties/sendInvite";

export default function HeaderContent({
  greeting,
  displayName,
  landlordId,
}: {
  greeting: string;
  displayName: string;
  landlordId?: number;
}) {
  return (
    <div
      className="
        absolute inset-0 
        flex flex-col sm:flex-row sm:items-center sm:justify-between 
        px-3 sm:px-5 lg:px-4 
        py-4 
        text-white 
        z-10
      "
    >
      {/* Text */}
      <div className="text-left space-y-1">
        <h2
          className="
            font-semibold tracking-tight drop-shadow-sm
            text-xl               /* mobile default */
            sm:text-2xl           /* ≥640px */
            lg:text-3xl           /* ≥1024px */
            [font-size:clamp(1.2rem,4vw,1.85rem)]  /* slimmer clamp */
          "
        >
          {greeting}, {displayName}
        </h2>

        <p className="text-xs sm:text-sm text-gray-200 leading-snug">
          <span className="hidden sm:inline">
            Simplifying property management, empowering landlords.
          </span>
          <span className="sm:hidden">Welcome to your dashboard</span>
        </p>
      </div>

      {/* Invite button */}
      <div className="mt-3 sm:mt-0">
        <SendTenantInviteModal landlord_id={landlordId} />
      </div>
    </div>
  );
}
