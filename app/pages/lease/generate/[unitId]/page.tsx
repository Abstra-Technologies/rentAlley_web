
"use client";

import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
// Load Quill editor dynamically (fixes SSR issues)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';
import useAuthStore from "@/zustand/authStore";

export default function LeaseEditor() {
    const searchParams = useSearchParams();
    const { user, admin, loading,fetchSession } = useAuthStore();

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const tenantName = searchParams.get("tenantName");
    const propertyName = searchParams.get("propertyName");
    const unitName = searchParams.get("unitName");
    const monthlyRent = searchParams.get("monthlyRent");
    const securityDeposit = searchParams.get("securityDeposit");

    const [content, setContent] = useState("");

    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user, admin]);

    useEffect(() => {
        setContent(`
      <h2 style="text-align:center; margin-bottom:20px; font-weight: bolder">CONTRACT OF LEASE</h2>
       <br>
       <p style="text-align:left; margin-bottom:20px; font-weight: bold">KNOWN ALL MEN BY THESE PRESENTS:</p>
        <br>
      <p>This CONTRACT OF LEASE made and executed by and between:
      <strong>${user?.lastName} ${user?.firstName} </strong>, 
      of legal age, (Civil Status), Filipino national and a resident of (Complete Address), Philippines, hereinafter referred to as the <strong>LESSOR</strong>;</p>
<br>
      <p style="text-align: center">-and-</p>
<br>
      <p><strong>${tenantName || "(LESSEE'S FULL NAME)"}</strong>, of legal age, (Civil Status), Filipino national and a resident of (Complete Address), hereinafter referred to as the <strong>LESSEE</strong>;</p>

      <h3 style="text-align: center; font-weight: bold" >WITNESSETH:</h3>
      <br>
      <p>The LESSOR is the owner of a residential house situated at <strong>${propertyName || "__________________"}</strong>, Unit <strong>${unitName || "____"}</strong>. The LESSOR hereby leases unto the LESSEE the above-mentioned premises, under the following terms and conditions:</p>
        <br>
      <ol>
        <li>That the term of this lease shall be for a period of ___ (__) months and will start on <strong>${startDate || "____"}</strong> until <strong>${endDate || "____"}</strong>, renewable upon agreement.</li>
        <li>The monthly rental shall be <strong>${monthlyRent || "________"}</strong> PESOS, payable on the 1st of every month. Upon signing, the LESSEE shall pay one (1) month advance and one (1) month deposit of <strong>${securityDeposit || "________"}</strong>.</li>
<li>
  If any payment is late, a 
  <span contenteditable="true" style="border-bottom:1px dashed #999; padding:0 6px; font-weight: bold">3</span> day grace period is granted. 
  On the 
  <span contenteditable="true" style="border-bottom:1px dashed #999; padding:0 6px;font-weight: bold">4</span> day, 
  a penalty of 
  <span contenteditable="true" style="border-bottom:1px dashed #999; padding:0 6px;font-weight: bold">₱1,000.00</span> 
  per day shall apply.
</li>
        <li>The LESSEE agrees that the security deposit cannot be used in lieu of rental payments.</li>
        <li>The LESSOR agrees to refund the deposit upon successful inspection, less damages or missing items.</li>
        <li>The premises shall be used exclusively for residential purposes only.</li>
        <li>The LESSEE shall keep the premises in good condition and shoulder damages caused during occupancy.</li>
        <li>The LESSEE shall promptly pay electricity, water, and internet bills.</li>
        <li>The LESSOR may enter and inspect the premises at reasonable hours with notice.</li>
        <li>The LESSEE shall not store flammable or hazardous items inside the premises.</li>
        <li>Non-payment of 1 month’s rent entitles the LESSOR to rescind this contract.</li>
        <li>Pre-termination by the LESSEE forfeits the advance rental and deposit as liquidated damages.</li>
        <li>Sub-leasing is strictly prohibited without written consent of the LESSOR.</li>
        <li>The LESSEE must observe sanitary and electrical regulations imposed by local authorities.</li>
        <li>Improvements made by the LESSEE shall be at their own expense.</li>
        <li>The LESSEE is responsible for maintaining and cleaning air conditioning units.</li>
        <li>All disputes shall be filed in the proper courts of __________ only.</li>
      </ol>

      <p style="margin-top:30px;">IN WITNESS WHEREOF, we hereunto set our hands this ____ day of __________ in the City/Province of __________, Philippines.</p>

      <p style="margin-top:40px;">_________________________<br/>LESSOR</p>
      <p>Lessor ID No. ____________</p>

      <p style="margin-top:40px;">_________________________<br/>LESSEE</p>
      <p>Lessee ID No. ____________</p>

      <h3 style="margin-top:50px;">SIGNED IN THE PRESENCE OF:</h3>
      <p>(Witness Name & Signature) ____________________</p>
      <p>(Witness Name & Signature) ____________________</p>

      <h3 style="margin-top:50px;">ACKNOWLEDGEMENT</h3>
      <p>Republic of the Philippines)<br/>
      City of __________ ) S.S.<br/>
      x---------------------------------------x</p>

      <p>BEFORE ME, a Notary Public for the City/Province of __________, personally appeared the parties, known to me and acknowledged that this contract is their free act and deed.</p>

      <p>Doc No. _______; Page No. _______; Book No. _______; Series of 202__.</p>
    `);
    }, [tenantName, propertyName, unitName, startDate, endDate, monthlyRent, securityDeposit, user]);


    const handleSave = async () => {
        console.log("Final lease content:", content);

        // You can POST this content to finalize API
        const res = await fetch("/api/leaseAgreement/finalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                unitId: searchParams.get("unitId"),
                content,
            }),
        });

        if (res.ok) {
            alert("Lease saved and PDF generated!");
        } else {
            alert("Error saving lease.");
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-6">
            <h1 className="text-2xl font-bold mb-4">Review Lease Agreement</h1>

            <ReactQuill
                value={content}
                onChange={setContent}
                className="mb-6"
                theme="snow"
                style={{ minHeight: "300px" }}
            />

            <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
                Finalize & Generate PDF
            </button>
        </div>
    );
}
