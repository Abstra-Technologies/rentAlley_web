
export default function handler(req, res) {
    const { GOOGLE_CLIENT_ID, REDIRECT_URI_SIGNIN } = process.env;

    if (!GOOGLE_CLIENT_ID || !REDIRECT_URI_SIGNIN) {
        return res.status(500).json({ error: "Server configuration is missing." });
    }

    // Generate Google OAuth URL
    const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI_SIGNIN}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile`;

    // Redirect user to Google OAuth
    res.redirect(googleAuthURL);
}
