// eslint-disable-next-line @typescript-eslint/no-require-imports
const  cron = require( "node-cron");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const  axios =  require("axios");

console.log("🔄 Scheduled task to downgrade expired subscriptions.");

// **Run every midnight (12:00 AM)**
cron.schedule("0 0 * * *", async () => {
    console.log("🔍 Running scheduled check for expired subscriptions...");

    try {
        const response = await axios.post("http://localhost:3000/api/subscription/downgrade");
        console.log("Downgrade API Response:", response.data);
    } catch (error) {
        console.error("🚨 Failed to downgrade expired subscriptions:", error.response?.data || error.message);
    }
});

// **Keep process running**
console.log("Subscription downgrade scheduler is running...");


// node server/cron/downgrade.js use this to run