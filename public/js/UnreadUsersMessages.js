export default class UnreadUsersMessages {

    constructor(cookies) {
        this.cookies = cookies;
    }

    add(user) {
        const unreadUsersMessages = JSON.parse(this.cookies.getCookie("unreadUsersMessages"));
        if (!unreadUsersMessages) this.cookies.setCookie("unreadUsersMessages", {});

        unreadUsersMessages[user] ? unreadUsersMessages[user]++ : unreadUsersMessages[user] = 1;

        this.cookies.setCookie("unreadUsersMessages", unreadUsersMessages);
        return unreadUsersMessages[user];
    };

    clear(user) {
        const unreadUsersMessages = JSON.parse(this.cookies.getCookie("unreadUsersMessages"));
        if (!unreadUsersMessages) this.cookies.setCookie("unreadUsersMessages", {});
        unreadUsersMessages[user] = 0;

        this.cookies.setCookie("unreadUsersMessages", unreadUsersMessages);
        return 0;

    };

    get(user) {
        const unreadUsersMessages = JSON.parse(this.cookies.getCookie("unreadUsersMessages"));
        if (!unreadUsersMessages) this.cookies.setCookie("unreadUsersMessages", {})
        if (!unreadUsersMessages[user]) unreadUsersMessages[user] = 0;

        this.cookies.setCookie("unreadUsersMessages", unreadUsersMessages);
        return unreadUsersMessages[user];
    };

    getAll() {
        const unreadUsersMessages = JSON.parse(this.cookies.getCookie("unreadUsersMessages"));
        if (!unreadUsersMessages) this.cookies.setCookie("unreadUsersMessages", {})
        return unreadUsersMessages;
    };
}