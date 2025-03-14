//
// const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
//
// const client = new SecretsManagerClient({
//     region: "us-east-1", // e.g., "us-east-1"
// });
//
// export async function getSecret(secretName) {
//     try {
//         const command = new GetSecretValueCommand({ SecretId: secretName });
//         const response = await client.send(command);
//
//         if (response.SecretString) {
//             return JSON.parse(response.SecretString);
//         }
//         return null;
//     } catch (error) {
//         console.error("Error retrieving secret:", error);
//         return null;
//     }
// }


import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });

export async function getSecret(secretName) {
    try {
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await client.send(command);
        return response.SecretString ? JSON.parse(response.SecretString) : null;
    } catch (error) {
        console.error("Error fetching secrets:", error);
        return null;
    }
}
