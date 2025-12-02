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
                {waterEnabled && (
                    <Row label="Water Bill" value={formatCurrency(totals.waterAmt)} />
                )}

                {elecEnabled && (
                    <Row label="Electricity Bill" value={formatCurrency(totals.elecAmt)} />
                )}

                <Row
                    strong
                    label="Utility Subtotal"
                    value={formatCurrency(totals.utilitySubtotal)}
                />

                <MeterReadingList meterReadings={meterReadings} bill={bill} />
            </Accordion>
        </div>
    );
}
