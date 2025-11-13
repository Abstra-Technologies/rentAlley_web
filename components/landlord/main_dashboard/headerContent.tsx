import Clock from "./Clock";
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
        flex flex-col sm:flex-row 
        sm:items-center sm:justify-between 
        px-3 sm:px-5 lg:px-4 
        py-4 
        text-white 
        z-10
      "
    >
      {/* Left: Greeting + Subtext */}
      <div className="text-left space-y-1">
        <h2
          className="
            font-semibold tracking-tight drop-shadow-sm
            text-xl
            sm:text-2xl
            lg:text-3xl
            [font-size:clamp(1.2rem,4vw,1.85rem)]
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

      {/* Right: Clock + Invite Tenant Button */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-0">
        
        {/* Dynamic Clock */}
        <Clock />
      </div>
    </div>
  );
}
