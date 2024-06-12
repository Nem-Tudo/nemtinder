export default class CookieManager {

    setCookie(name, value, days = 99999) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    };

    getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    eraseCookie(name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    };

    parseCookies(cookies) {
        let parsedCookies = {};
        if (!cookies) return {};

        cookies.split(";").forEach((cookie) => {
            const parts = cookie.split("=");
            parsedCookies[parts[0].trim()] = parts[1].trim();
        });

        return parsedCookies;
    };
}