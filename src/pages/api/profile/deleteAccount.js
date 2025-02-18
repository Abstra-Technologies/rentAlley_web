import { db, archivedb } from "../../lib/db";

export default async function deleteAccount() {
    const {user_id} =  req.body;

    try{
        const User = await db.query("SELECT * FROM User WHERE user_id = ?", [user_id]);

        if(User.length == 0){
            return res.status(403).json({message: "User not found."});
        }

        await archivedb.query(`
            INSERT INTO users (user_id, first_name, last_name, email, user_type, phone_number, profile_picture, deleted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            user.user_id,
            user.first_name,
            user.last_name,
            user.email,
            user.user_type,
            user.phone_number,
            user.profile_picture,
            user.user_type,
            user.google_id,
        ]);


    }
}