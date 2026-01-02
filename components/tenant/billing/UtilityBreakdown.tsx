"use client";

import Accordion from "./Accordion";
import { Row } from "./Row";
import MeterReadingList from "./MeterReadingList";
import { formatCurrency } from "@/utils/formatter/formatters";

export default function UtilityBreakdown({
                                             bill,
                                             totals,
                                             meterReadings,
                                             setBillingData,
                                         }) {
    const waterEnabled = bill.utilities?.water?.enabled;
    const elecEnabled = bill.utilities?.electricity?.enabled;

    if (!waterEnabled && !elecEnabled) return null;

    console.log("utility ui page meter readings:", meterReadings);
    console.log("billing utility totals:", {
        water: bill.utilities?.water?.total,
        electricity: bill.utilities?.electricity?.total,
    });

    return (
        <div className="p-4">
            <Accordion
                title="Utility Billing"
                open={bill.showUtility}
                amount={totals.utilitySubtotal}
                onToggle={() => {
                    bill.showUtility = !bill.showUtility;
                    setBillingData((prev) => [...prev]);
                }}
            >
                {/* ---------------- WATER ---------------- */}
                {waterEnabled && (
                    <Row
                        label="Water Bill"
                        value={formatCurrency(totals.waterAmt)}
                    />
                )}

                {/* ---------------- ELECTRICITY ---------------- */}
                {elecEnabled && (
                    <Row
                        label="Electricity Bill"
                        value={formatCurrency(totals.elecAmt)}
                    />
                )}

                {/* ---------------- SUBTOTAL ---------------- */}
                <Row
                    strong
                    label="Utility Subtotal"
                    value={formatCurrency(totals.utilitySubtotal)}
                />

                {/* ---------------- INFO NOTE (OPTION 1 UX) ---------------- */}
                {(totals.waterAmt === 0 || totals.elecAmt === 0) &&
                    meterReadings?.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                            Meter readings are recorded, but utility charges
                            have not yet been finalized for this billing period.
                        </div>
                    )}

                {/* ---------------- METER READINGS (DISPLAY ONLY) ---------------- */}
                <MeterReadingList
                    meterReadings={meterReadings}
                    bill={bill}
                />
            </Accordion>
        </div>
    );
}
