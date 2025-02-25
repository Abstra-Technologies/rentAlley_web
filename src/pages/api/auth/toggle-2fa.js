import { db } from "../../../lib/db";

export default async function toggle2fa(req, res){
    const { user_id, enable_2fa } = req.body;
    try{
        await db.query("UPDATE User SET is_2fa_enabled = ? WHERE user_id = ?", [enable_2fa ? 1 : 0, user_id]);
        return res.status(200).json({
            message: `2FA ${enable_2fa ? "enabled" : "disabled"} successfully.`,
        });
    }catch (error){
        console.error("Error toggling 2FA:", error);

    }
}