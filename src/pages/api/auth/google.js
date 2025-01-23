
export default function handler(req, res) {
    const { role } = req.query;
    const { GOOGLE_CLIENT_ID, REDIRECT_URI } = process.env;

    if (!role) {
        return res.status(400).json({ error: 'Role is required' });
    }
    const state = JSON.stringify({ role });

    const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `state=${encodeURIComponent(state)}`;

    res.redirect(googleAuthURL);
}