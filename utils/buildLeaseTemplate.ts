import { PAYMENT_METHODS } from "@/constant/paymentMethods";
import { EXTRA_EXPENSES } from "@/constant/extraExpenses";
import { PENALTY_TYPES } from "@/constant/penaltyTypes";
import { MAINTENANCE_CHARGES } from "@/constant/maintenanceCharges";
import { USE_OF_PROPERTY } from "@/constant/useOfProperty";
import { MAINTENANCE_RESPONSIBILITY } from "@/constant/maintenanceResponsibility";

interface LeaseData {
    lessorName: string;
    tenantName: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
    depositAmount: string;
    advanceAmount: string;
    billingDueDay: string;
    paymentMethods: string[];
    included: string[];
    excludedFees: { key: string; amount: string }[];
    gracePeriod: string;
    latePenalty: string;
    otherPenalties: { key: string; amount: string }[];
    maintenanceCharges: { key: string; amount: string }[];
    occupancyLimit: string;
    entryNoticeDays: string;
    useOfProperty: string;
    maintenanceResponsibility: string;
    renewalOption:string;
    percentageIncrease:string;
}

export function buildLeaseTemplate(data: LeaseData): string {
    const includedList =
        data.included.length > 0
            ? data.included.map((x) => `<li>${x}</li>`).join("")
            : "<li>None</li>";

    const excludedList =
        data.excludedFees.length > 0
            ? data.excludedFees
                .map((f) => {
                    const label =
                        EXTRA_EXPENSES.find((e) => e.key === f.key)?.label || f.key;
                    return `<li>${label}: ₱${f.amount}</li>`;
                })
                .join("")
            : "<li>None</li>";

    const penaltyList =
        data.otherPenalties.length > 0
            ? data.otherPenalties
                .map((p) => {
                    const label =
                        PENALTY_TYPES.find((pt) => pt.key === p.key)?.label || p.key;
                    return `<li>${label}: ₱${p.amount}</li>`;
                })
                .join("")
            : "<li>None</li>";

    const maintenanceList =
        data.maintenanceCharges.length > 0
            ? data.maintenanceCharges
                .map((m) => {
                    const label =
                        MAINTENANCE_CHARGES.find((mc) => mc.key === m.key)?.label || m.key;
                    return `<li>${label}: ₱${m.amount}</li>`;
                })
                .join("")
            : "<li>None</li>";

    const paymentMethodsList =
        data.paymentMethods.length > 0
            ? data.paymentMethods
                .map((pm) => {
                    const label =
                        PAYMENT_METHODS.find((p) => p.key === pm)?.label || pm;
                    return `<li>${label}</li>`;
                })
                .join("")
            : "<li>None</li>";

    const useOfPropertyLabel =
        USE_OF_PROPERTY.find((u) => u.key === data.useOfProperty)?.label ||
        data.useOfProperty;

    const maintenanceRespLabel =
        MAINTENANCE_RESPONSIBILITY.find(
            (m) => m.key === data.maintenanceResponsibility
        )?.label || data.maintenanceResponsibility;

    return `

    <h2 style="text-align:center; margin-bottom:20px; font-weight: bolder">CONTRACT OF LEASE</h2>
 <p><strong>KNOW ALL MEN BY THESE PRESENTS:</strong></p>
 <br>
    <p>
      This CONTRACT OF LEASE is executed electronically on 
      ${data.executionDate || "________"} by and between:
    </p>

<p>
  <strong>${data.lessorName}</strong>, with postal address at ${data.lessorAddress || "________"}, 
  hereinafter referred to as the <strong>LESSOR</strong>,
</p>

<p>-and-</p>

<p>
  <strong>${data.tenantName || "LESSEE NAME"}</strong>, with postal address at ${data.tenantAddress || "________"}, 
  hereinafter referred to as the <strong>LESSEE</strong>.
</p>
<br>
<p>
 <strong>NOW THEREFORE </strong>, for and in consideration of the foregoing premises, the LESSOR leases unto the
LESSEE and the LESSEE hereby accepts from the LESSOR the LEASED premises, subject to the
following:
</p>
<br>
    <p style="text-align: center; font-weight: bold">TERMS AND CONDITIONS: </p>
    <br>
    <p>
    <strong>1. PURPOSES:</strong> That premises hereby leased shall be used exclusively by the <strong>LESSEE</strong> for residential
purposes only. It is hereby expressly agreed that if at any time the premises are used for other purposes,
the <strong>LESSOR</strong> shall have the right to rescind this contract without prejudice to its other rights under the
law.
    </p>  
    <br>
    <p>
  <strong>2. TERM OF LEASE:</strong> This lease shall be for a period commencing on 
  ${data.startDate || "____"} and expiring on ${data.endDate || "____"}, inclusive. 
  Upon expiration, the lease may be renewed under terms and conditions mutually agreed 
  upon by both parties, provided that the <strong>LESSEE</strong> serves written notice of intention to renew 
  to the <strong>LESSOR</strong> not later than seven (7) days before the expiry date.
</p>
<br>
<p>
  <strong>3. RENTAL RATE:</strong> The monthly rental rate for the leased premises shall be in PESOS: 
  <strong>₱${data.rentAmount || "____"}</strong>, Philippine Currency, payable every 
  <strong>${data.billingDueDay || "___"}</strong> day of the following month. All rental payments 
  shall be payable directly to the LESSOR. 
  Upon renewal of this Contract of Lease, the monthly rent 
  ${data.percentageIncrease && data.percentageIncrease !== "0"
        ? `shall be subject to an increase of <strong>${data.percentageIncrease}%</strong> annually.`
        : `shall remain the same, with no increase, unless otherwise agreed by both parties.`}
</p>

  <br>
<p>
  <strong>4. DEPOSIT AND ADVANCE RENTAL:</strong> The LESSEE shall pay to the LESSOR upon signing of this contract 
  and prior to move-in a security deposit equivalent to ₱${data.depositAmount || "____"}, Philippine Currency, 
  and an advance rental payment equivalent to ₱${data.advanceAmount || "____"}, Philippine Currency. 
  The security deposit shall serve as (a) advance rental to be applied to the rent of the last month of the lease 
  term, and (b) security to answer for any unpaid utilities such as Water, Electricity, Telephone, or other 
  obligations of the LESSEE, including damages arising from any violation of this contract. 
  Any balance remaining after deductions shall be returned to the LESSEE upon proper termination of this agreement.
</p>

<br>
<p>
  <strong>5. DEFAULT IN PAYMENT:</strong> In the event that the LESSEE fails to pay the rent or any other
  charges when due, the LESSOR shall have the right, at its option, to terminate this Contract of Lease
  and repossess the leased premises. Any rental deposits or advance payments made by the LESSEE may
  be applied to settle outstanding obligations, without prejudice to the LESSOR’s right to recover any
  remaining unpaid balances through lawful means. The LESSOR may likewise pursue appropriate legal
  action to enforce payment of amounts due under this contract.
</p>
<br>
<p>
  <strong>USE OF PROPERTY:</strong> The leased premises shall be used exclusively for 
  ${useOfPropertyLabel || "residential/commercial"} purposes, and for no other purpose without the prior 
  written consent of the LESSOR. The LESSEE shall not directly or indirectly sublease, assign, transfer, or 
  permit the premises, in whole or in part, to be occupied by any other person, firm, or entity without the 
  LESSOR’s prior written approval. Any unauthorized use or occupancy shall constitute a breach of this 
  Contract of Lease and shall be sufficient ground for its termination.
</p>

<br>
<li>
  <strong>7. PUBLIC UTILITIES:</strong> The LESSEE shall be solely responsible for the payment of utilities 
  and services that are not expressly included in the rent, such as electricity, water, telephone, 
  cable television, Internet, and other similar charges, for the entire duration of the lease. 
  Specifically, the following recurring fees are excluded from the rent: 
  <ul>${excludedList}</ul>
</li>
</p>
<br>
<p>
  <strong>8. OCCUPANCY LIMIT:</strong> The leased premises shall be occupied by no more than 
  ${data.occupancyLimit || "___"} persons at any given time, unless otherwise authorized in writing by 
  the LESSOR. Any occupancy in excess of this limit shall constitute a violation of this Agreement and 
  may be grounds for its termination.
</p>

<br>
<p>
<strong> FORCE MAJEURE: </strong>If whole or any part of the leased premises shall be destroyed or damaged by
fire, flood, lightning, typhoon, earthquake, storm, riot or any other unforeseen disabling cause of acts of
God, as to render the leased premises during the term substantially unfit for use and occupation of the
LESSEE, then this lease contract may be terminated without compensation by the LESSOR or by the
LESSEE by notice in writing to the other.
</p>
  <br>
<p>
  <strong>MAINTENANCE AND REPAIRS:</strong> Prior to the turnover of the leased premises, the LESSOR 
  shall undertake such ordinary and necessary repairs as may be required to ensure the premises are in 
  good and tenantable condition. After delivery, responsibility for ordinary repairs and maintenance 
  shall be for the account of the <strong>${maintenanceRespLabel}</strong>. Any improvements, alterations, 
  or repairs affecting the structure or aesthetics of the premises shall require the prior written consent of 
  the LESSOR and shall be subject to any rules or regulations imposed by the LESSOR or property 
  management. In addition, the LESSEE shall be responsible for paying the following recurring 
  maintenance charges (e.g., garbage collection, common area upkeep, or similar services), unless 
  otherwise agreed upon:  
  <ul>
    ${maintenanceList}
  </ul>
</p>

  <br>
<p>
  <strong>. PENALTIES FOR LATE PAYMENT:</strong> The LESSEE shall be granted a grace period of 
  ${data.gracePeriod || "___"} days from the due date within which to settle rental obligations. Beyond 
  this period, a late payment penalty of ₱${data.latePenalty || "____"} per day shall be imposed until 
  full payment is made. In addition, the following penalties and charges shall likewise apply: 
</p>
<ul>
  ${penaltyList}
</ul>
<br>
<p>
  <strong>11. MODE OF PAYMENT:</strong> All rental payments shall be made payable to the LESSOR using 
  any of the following modes of payment agreed upon by the parties: 
</p>
<ul>
  ${paymentMethodsList}
</ul>
<br>
<p>
<strong>10. LIABILITY FOR SUITS, ETC.</strong> The LESSEE shall indemnify and hold harmless the LESSOR
against all actions, suits, damages, and claims by whomsoever that may be brought or made by reason of
violation, non-observance, or non – performance by the LESSEE of applicable laws, ordinances, rules and
regulations of the government.
</p>
<br>
<p>
  <strong>11. LESSOR'S RIGHT OF ENTRY:</strong> The LESSOR or its duly authorized representative shall, 
  after giving at least ${data.entryNoticeDays || "___"} hours’ prior notice to the LESSEE, have the right 
  to enter the leased premises at reasonable hours, in the presence of the LESSEE or its representative, 
  for the purpose of inspection, undertaking necessary repairs or maintenance, exhibiting the premises 
  to prospective lessees, or for any other lawful purpose deemed necessary by the LESSOR.
</p>
<br>
<p>
  <strong>EXPIRATION OF LEASE:</strong> Upon the expiration or lawful termination of this Contract of 
  Lease, the LESSEE shall promptly surrender and deliver the leased premises to the LESSOR, together 
  with all corresponding keys, in as good and tenantable condition as at the commencement of the lease, 
  ordinary wear and tear excepted. The premises shall be vacated of all occupants, movable furniture, 
  personal belongings, and effects of any kind. Failure of the LESSEE to vacate and return the premises 
  as stipulated shall entitle the LESSOR, at its option, to refuse acceptance of delivery and to compel the 
  LESSEE to continue paying rent at the same rate plus a penalty of twenty-five percent (25%) thereof 
  per month until full compliance. The same penalty shall apply in the event the LESSEE fails to vacate 
  after the expiration or termination of this lease for any reason whatsoever.
</p>
<br>
<p>
  <strong>15. OTHER RULES AND POLICIES:</strong> The LESSEE agrees to comply with any reasonable 
  house rules, building policies, or regulations that may be issued by the LESSOR from time to time, 
  provided that such rules are not inconsistent with the terms of this Contract of Lease. 
  These additional rules shall form an integral part of this lease once communicated in writing 
  to the LESSEE.
</p>
<br>
<p>
  <strong>BINDING EFFECT:</strong> This Contract of Lease shall be valid and binding solely between the 
  LESSOR and the LESSEE for the entire duration of the lease term, in accordance with the provisions 
  herein agreed upon.
</p>
<br>
IN WITNESS WHEREOF, parties herein affixed their signatures on the date and place above written.

<br>
<br>

<div style="display:flex; justify-content:space-between; margin-top:50px; text-align:center; gap:40px;">
  <div style="flex:1;"> 
   <!-- 🔑 Unique anchor for landlord signature -->
    <p><span style="color:white;">ANCHOR_LESSOR_SIGN</span></p>
    <p><strong>__________________________</strong></p>
    <p>${data.lessorName || "LESSOR NAME"}</p>
    <p><em>Lessor</em></p>
  
    <p>Date Signed: ___________________</p>
  </div>

  <div style="flex:1;">    
  <p><span style="color:white;">ANCHOR_LESSEE_SIGN</span></p>
    <p><strong>__________________________</strong></p>
    <p>${data.tenantName || "LESSEE NAME"}</p>
    <p><em>Lessee</em></p>
    <p>Date Signed: ___________________</p>
  </div>
</div>




  <br>
  `;
}
