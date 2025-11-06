// constants/importantDates.ts

export interface ImportantDate {
    date: string; // ISO date format (YYYY-MM-DD)
    title: string;
    description?: string;
    type: "tax" | "reminder" | "deadline";
    color: string; // Tailwind-compatible background color
    icon?: string; // optional lucide icon name
}

export const IMPORTANT_DATES: ImportantDate[] = [
    {
        date: "2025-04-15",
        title: "Annual Income Tax Filing",
        description: "Deadline for filing annual ITR (Form 1701 or 1701A).",
        type: "tax",
        color: "bg-red-500",
        icon: "AlertTriangle",
    },
    {
        date: "2025-01-20",
        title: "Quarterly Percentage Tax (Q4)",
        description: "Due date for Q4 percentage tax filing.",
        type: "tax",
        color: "bg-amber-500",
        icon: "Calendar",
    },
    {
        date: "2025-07-20",
        title: "Quarterly Percentage Tax (Q2)",
        description: "File Q2 BIR percentage tax before this date.",
        type: "tax",
        color: "bg-yellow-500",
    },
    {
        date: "2025-10-20",
        title: "Quarterly Percentage Tax (Q3)",
        description: "Submit your Q3 percentage tax return.",
        type: "tax",
        color: "bg-orange-500",
    },
    {
        date: "2025-12-31",
        title: "Year-End Book Closing Reminder",
        description: "Prepare accounting records for year-end submission.",
        type: "reminder",
        color: "bg-blue-500",
    },
];
