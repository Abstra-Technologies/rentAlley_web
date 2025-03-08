import axios from "axios";

export default async function tenantPayment(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const {
        amount,
        firstName,
        lastName,
        email,
        payment_method_id,
        payment_type,
        agreement_id,
        redirectUrl,
    } = req.body;

    console.log("Payment Request:", { amount, firstName, lastName, email, payment_method_id, payment_type, agreement_id, redirectUrl });

    // Check Required Fields
    if (!amount || isNaN(amount) || !payment_type || !payment_method_id || !agreement_id || !firstName || !lastName || !email) {
        return res.status(400).json({ error: "Invalid request parameters. Check required fields." });
    }

    const publicKey = process.env.MAYA_PUBLIC_KEY;
    const secretKey = process.env.MAYA_SECRET_KEY;

    try {
        //  Generate Unique Receipt Reference
        const requestReferenceNumber = `PAY-${Date.now()}-${payment_type.toUpperCase()}`;

        const payload = {
            totalAmount: { value: parseFloat(amount), currency: "PHP" },
            buyer: { firstName, lastName, contact: { email } },
            redirectUrl: {
                success: encodeURI(`${redirectUrl.success}?agreement_id=${agreement_id}&payment_type=${payment_type}&amount=${amount}&requestReferenceNumber=${requestReferenceNumber}`),
                failure: `${redirectUrl.failure}?agreement_id=${agreement_id}`,
                cancel: `${redirectUrl.cancel}?agreement_id=${agreement_id}`,
            },
            requestReferenceNumber,
            items: [{
                name: payment_type === "security_deposit" ? "Security Deposit" : "Advance Rent",
                quantity: 1,
                totalAmount: { value: parseFloat(amount), currency: "PHP" },
            }],
        };

        console.log("Sending Payload to Maya:", JSON.stringify(payload, null, 2));

        // Send Request to Maya
        const response = await axios.post(
            "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
            payload,
            { headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}` } }
        );

        console.log("Maya Response:", response.data);

        return res.status(200).json({
            checkoutUrl: response.data.redirectUrl,
            requestReferenceNumber
        });

    } catch (error) {
        console.error("Error during Maya payment processing:", error.response?.data || error.message);
        return res.status(500).json({ error: "Payment initiation failed.", details: error.response?.data || error.message });
    }
}

