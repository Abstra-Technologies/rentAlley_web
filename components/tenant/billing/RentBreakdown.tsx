"use client";

import Accordion from "./Accordion";
import { Row } from "./Row";
import { formatCurrency } from "@/utils/formatter/formatters";

export default function RentBreakdown({
                                          bill,
                                          totals,
                                          lateFee,
                                          setBillingData,
                                      }) {
    return (
        <div className="p-4">
            <Accordion
                title="Rent Billing"
                open={bill.showRent}
                amount={totals.rentSubtotal}
                onToggle={() => {
                    bill.showRent = !bill.showRent;
                    setBillingData((prev) => [...prev]);
                }}
            >
                <Row label="Base Rent" value={formatCurrency(totals.baseRent)} />

                {bill.billingAdditionalCharges?.map((c, i) => (
                    <Row
                        key={i}
                        label={c.charge_type}
                        value={
                            c.charge_category === "discount"
                                ? `-${formatCurrency(c.amount)}`
                                : formatCurrency(c.amount)
                        }
                    />
                ))}

                {totals.advancePayment > 0 && (
                    <Row
                        label="Advance Payment"
                        value={`-${formatCurrency(totals.advancePayment)}`}
                    />
                )}

                {lateFee > 0 && <Row label="Late Fee" value={formatCurrency(lateFee)} />}

                {totals.clearedPdcTotal > 0 && (
                    <Row
                        label="Cleared PDC"
                        value={`-${formatCurrency(totals.clearedPdcTotal)}`}
                    />
                )}

                <Row strong label="Rent Subtotal" value={formatCurrency(totals.rentSubtotal)} />
            </Accordion>
        </div>
    );
}
