// constant/maintenanceCategories.ts
import {
    FanIcon,
    KeyIcon,
    SunIcon,
    WrenchIcon,
    BoltIcon,
    CogIcon,
    HomeIcon,
    DoorClosedIcon,
    DoorOpenIcon,
    TvIcon,
    BugIcon,
    House ,
    HammerIcon,
    DropletIcon,
    SofaIcon,
    BuildingIcon,
} from "lucide-react";

export const MAINTENANCE_CATEGORIES = [
    { value: "HVAC", label: "HVAC", icon: FanIcon },
    { value: "Locks", label: "Locks", icon: KeyIcon },
    { value: "Heating", label: "Heating", icon: SunIcon },
    { value: "Plumbing", label: "Plumbing", icon: DropletIcon },
    { value: "Electrical", label: "Electrical", icon: BoltIcon },
    { value: "Air Conditioning Repair", label: "Air Conditioning Repair", icon: FanIcon },
    { value: "Interior", label: "Interior", icon: DoorClosedIcon },
    { value: "Exterior", label: "Exterior", icon: DoorOpenIcon },
    { value: "Appliances", label: "Appliances", icon: TvIcon },
    { value: "Pest Control", label: "Pest Control", icon: BugIcon },
    { value: "Windows & Doors", label: "Windows & Doors", icon: House  },
    { value: "Flooring", label: "Flooring", icon: HammerIcon },
    { value: "Roof & Ceiling", label: "Roof & Ceiling", icon: HomeIcon },
    { value: "Furniture", label: "Furniture", icon: SofaIcon },
    { value: "Structural", label: "Structural", icon: BuildingIcon },
    { value: "Other", label: "Other", icon: WrenchIcon }, // ✅ replaced ToolIcon
];
