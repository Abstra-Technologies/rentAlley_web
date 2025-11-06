
"use client";

import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";
import useAuthStore from "@/zustand/authStore";

export default function LeaseEditor() {
    const searchParams = useSearchParams();
    const { user, admin, fetchSession } = useAuthStore();

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const tenantName = searchParams.get("tenantName");
    const propertyName = searchParams.get("propertyName");
    const unitName = searchParams.get("unitName");
    const monthlyRent = searchParams.get("monthlyRent");
    const securityDeposit = searchParams.get("securityDeposit");

    const [content, setContent] = useState("");
    const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null);
    const [signUrl, setSignUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fileBase64, setFileBase64] = useState<string | null>(null);

    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user, admin]);

    useEffect(() => {
        const regenerateSignUrl = async () => {
            if (fileBase64 && user?.email) {
                try {
                    // fetch tenant email from API
                    const tenantRes = await fetch(
                        `/api/tenant/getByUnit?unitId=${searchParams.get("unitId")}`
                    );
                    const tenantData = await tenantRes.json();
                    const tenantEmail = tenantData?.email || "tenant@upkyp.local";

                    const res = await fetch(
                        "/api/leaseAgreement/generate/sendToDocuSign",
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                unitId: searchParams.get("unitId"),
                                landlordEmail: user.email,
                                tenantEmail,
                                fileBase64,
                            }),
                        }
                    );

                    const data = await res.json();
                    if (res.ok) {
                        setSignUrl(data.signUrl);
                    }
                } catch (err) {
                    console.error("Failed to regenerate signing URL:", err);
                }
            }
        };

        regenerateSignUrl();
    }, [fileBase64, user?.email, searchParams]);


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

    // Step 1: Save lease + generate PDF
    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/leaseAgreement/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unitId: searchParams.get("unitId"),
                    startDate,
                    endDate,
                    content,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setGeneratedFileUrl(data.signedUrl);
                setFileBase64(data.fileBase64); // 🔑 store base64 in state

                // fetch tenant email
                const tenantRes = await fetch(
                    `/api/tenant/getByUnit?unitId=${searchParams.get("unitId")}`
                );
                const tenantData = await tenantRes.json();
                const tenantEmail = tenantData?.email || "tenant@upkyp.local";

                // trigger signing flow
                await handleSendForSigning(data.fileBase64, tenantEmail);
            } else {
                alert(data.error || "Error saving lease.");
            }
        } catch (err) {
            console.error(err);
            alert("Unexpected error generating lease.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Send to DocuSign
    const handleSendForSigning = async (
        fileBase64: string,
        tenantEmail: string
    ) => {
        try {
            const res = await fetch(
                "/api/leaseAgreement/generate/sendToDocuSign",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        unitId: searchParams.get("unitId"),
                        landlordEmail: user?.email,
                        tenantEmail,
                        fileBase64,
                    }),
                }
            );

            const data = await res.json();
            if (res.ok) {
                setSignUrl(data.signUrl); // embedded signing link
            } else {
                alert(data.error || "Error sending to DocuSign.");
            }
        } catch (err) {
            console.error(err);
        }
    };



    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-6">
            <h1 className="text-2xl font-bold mb-4">Review Lease Agreement</h1>

            {!generatedFileUrl && !signUrl && (
                <>
                    <ReactQuill
                        value={content}
                        onChange={setContent}
                        className="mb-6"
                        theme="snow"
                        style={{ minHeight: "300px" }}
                    />
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Generating..." : "Generate Lease Agreement"}
                    </button>
                </>
            )}

            {/* Step 3: Preview generated PDF */}
            {generatedFileUrl && !signUrl && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">Generated Lease Preview</h2>
                    <iframe
                        src={generatedFileUrl}
                        className="w-full h-[500px] border rounded"
                    />
                    <p className="text-gray-500 text-sm mt-2">
                        Waiting to start signing flow...
                    </p>
                </div>
            )}

            {/* Step 4: Embedded signing */}
            {signUrl && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Sign Lease Agreement</h2>
                    <div className="w-full h-[85vh]">
                        <iframe
                            src={signUrl}
                            className="w-full h-full border rounded-xl shadow-lg"
                            style={{ minHeight: "700px" }}
                        />
                    </div>
                </div>
            )}

        </div>
    );
}

