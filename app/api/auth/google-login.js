export default function handler(req, res) {
    const { GOOGLE_CLIENT_ID, REDIRECT_URI_SIGNIN } = process.env;

    const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI_SIGNIN}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile`;

    res.redirect(googleAuthURL);
}
