require('dotenv').config();

const envCookies = () => {
    if (process.env.ENV === 'PROD') {
        return {
            httpOnly: true,
            secure: true,
            sameSite: true
        }
    }
    else if (process.env.ENV === 'DEV') {
        return {
            sameSite: true
        }
    }

};

module.exports = envCookies;

