import { NextRequest, NextResponse } from "next/server";
import { getDocuSignToken } from "@/lib/docusignAuth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        let { landlordEmail, tenantEmail, fileBase64, agreementId } = await req.json();
        const { accessToken, accountId } = await getDocuSignToken();

        if (fileBase64.startsWith("data:")) {
            fileBase64 = fileBase64.split(",")[1];
        }

        fileBase64 = fileBase64.replace(/(\r\n|\n|\r)/gm, "").trim();

        // Envelope definition
        const envelopeDefinition = {
            emailSubject: "Please sign the Lease Agreement",
            documents: [
                {
                    documentBase64: fileBase64,
                    name: "Lease Agreement",
                    fileExtension: "pdf",
                    documentId: "1",
                },
            ],
            recipients: {
                signers: [
                    {
                        email: landlordEmail,
                        name: "Landlord",
                        recipientId: "1",
                        clientUserId: "1001",
                        routingOrder: "1",
                        tabs: {
                            signHereTabs: [
                                {
                                    anchorString: "ANCHOR_LESSOR_SIGN",
                                    anchorYOffset: "30",
                                    anchorXOffset: "0",
                                },
                            ],
                        },
                    },
                    {
                        email: tenantEmail,
                        name: "Tenant",
                        recipientId: "2",
                        clientUserId: "1002",
                        routingOrder: "2",
                        tabs: {
                            signHereTabs: [
                                {
                                    anchorString: "ANCHOR_LESSEE_SIGN",
                                    anchorYOffset: "30",
                                    anchorXOffset: "0",
                                },
                            ],
                        },
                    },
                ],
            },
            status: "sent",
        };

        //  Create envelope
        const res = await fetch(
            `https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(envelopeDefinition),
            }
        );

        const envelope = await res.json();

        console.log("Envelope creation response:", envelope);

        if (!res.ok || !envelope.envelopeId) {
            return NextResponse.json(
                { error: "Envelope creation failed", details: envelope },
                { status: 400 }
            );
        }

        const envelopeId = envelope.envelopeId;

        await db.execute(
            `UPDATE LeaseAgreement SET docusign_envelope_id = ? WHERE agreement_id = ?`,
            [envelopeId, agreementId]
        );
        // 2. Create embedded signing view for landlord after clicking finish
        const viewRequest = {
            returnUrl: "http://localhost:3000/pages/lease/signed", // must be absolute
            authenticationMethod: "none",
            email: landlordEmail,
            userName: "Landlord",
            clientUserId: "1001",
        };

        const viewRes = await fetch(
            `https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}/views/recipient`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(viewRequest),
            }
        );

        const viewResult = await viewRes.json();
        console.log("Recipient view response:", viewResult);

        if (!viewRes.ok || !viewResult.url) {
            return NextResponse.json(
                { error: "Recipient view creation failed", details: viewResult },
                { status: 400 }
            );
        }

        console.log('api envelope id: ', envelopeId);

        return NextResponse.json({
            envelopeId,
            signUrl: viewResult.url,
        });


    } catch (err) {
        console.error("DocuSign send failed:", err);
        return NextResponse.json(
            { error: "DocuSign send failed", details: String(err) },
            { status: 500 }
        );
    }
}



