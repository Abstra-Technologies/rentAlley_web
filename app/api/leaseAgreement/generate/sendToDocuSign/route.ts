import { NextRequest, NextResponse } from "next/server";
import { getDocuSignToken } from "@/lib/docusignAuth";

export async function POST(req: NextRequest) {
    try {
        let { landlordEmail, tenantEmail, fileBase64 } = await req.json();
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
                        clientUserId: "1001", // required for embedded signing
                        routingOrder: "1",
                        tabs: {
                            signHereTabs: [
                                {
                                    anchorString: "LESSOR",
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
                                    anchorString: "LESSEE",
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

        // 1. Create envelope
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

        // 2. Create embedded signing view for landlord
        const viewRequest = {
            returnUrl: "http://localhost:3000/pages/lease/signed", // must be absolute
            authenticationMethod: "none",
            email: landlordEmail,
            userName: "Landlord",
            clientUserId: "1001", // must match signer above
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



