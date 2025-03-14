import {getSecret} from "../../lib/getSecrets.mjs";


export default async function handler(req, res) {
    const secrets =  getSecret("my-rentahan-secret");

    if (!secrets) {
        return res.status(500).json({ error: "Failed to load secrets" });
    }

    res.status(200).json(secrets);
}
