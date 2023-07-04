require('dotenv').config();

const envCookies = () => {
    if (process.env.ENV === 'PROD') {
        return {
            httpOnly: true,
            secure: true,
            sameSite: 'none', // Adjusted for cross-site compatibility
        }
    }
    else if (process.env.ENV === 'DEV') {
        return {
            sameSite: true, // Adjusted for cross-site compatibility
        }
    }

};

module.exports = envCookies;

