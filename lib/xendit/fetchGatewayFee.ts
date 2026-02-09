import axios from "axios";

export async function fetchGatewayFee(paymentRef: string) {
    const res = await axios.get(
        "https://api.xendit.co/balance_mutations",
        {
            params: {
                reference_id: paymentRef,
            },
            auth: {
                username: process.env.XENDIT_TEXT_BALANCE_KEY!,
                password: "",
            },
        }
    );

    const mutations = res.data?.data || [];

    const feeMutation = mutations.find(
        (m: any) => m.type === "FEE"
    );

    if (!feeMutation) return null;

    return Math.abs(Number(feeMutation.amount));
}
