// scripts/setup-resend-domain.ts
import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend('re_ajPZU3Mq_7Ynxp7PtXKmp3g3eGAikQsDb');

async function setup() {
    await resend.domains.create({
        name: "upkyp.com",
        customReturnPath: "outbound",
    });

    console.log("Resend domain created.");
}

setup().catch(console.error);
