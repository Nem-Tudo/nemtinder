import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import Head from "next/head"
import styles from "./userId.module.css"
import { IoSend } from "react-icons/io5";
import { io } from 'socket.io-client';
import { useEffect, useState } from "react";
import settings from "@/settings";
import { APIError } from "@/components/APIError";
import { parseCookies } from "nookies";
import nodefetch from "node-fetch"
import CookieManager from "@/public/js/CookieManager";
import UnreadUsersMessages from "@/public/js/UnreadUsersMessages";

export async function getServerSideProps({ query, req, res }) {
    const cookies = parseCookies({ req })

    try {
        const request = await nodefetch(`${settings.apiURL}/users/@me`, {
            headers: {
                "Authorization": cookies.authorization
            }
        });

        const response = await request.json();

        if (request.status === 401) return {
            redirect: {
                permanent: false,
                destination: "/login",
            }
        }

        if (request.status != 200) return {
            props: {
                apiError: true
            }
        }

        const requestuser = await nodefetch(`${settings.apiURL}/users/${query.userId}`, {
            headers: {
                "Authorization": cookies.authorization
            }
        });

        if (requestuser.status != 200) return {
            props: {
                apiError: true
            }
        }

        const responseuser = await requestuser.json();


        const request_channel_messages = await nodefetch(`${settings.apiURL}/channels/${getChannelByIds(response.id, responseuser.id)}/messages`, {
            headers: {
                "Authorization": cookies.authorization
            }
        });

        if (request_channel_messages.status != 200) return {
            props: {
                apiError: true
            }
        }

        const response_channel_messages = await request_channel_messages.json();



        return {
            props: {
                loggedUser: response,
                user: responseuser,
                channel: {
                    id: getChannelByIds(response.id, responseuser.id),
                    messages: response_channel_messages
                }
            }
        }

    } catch (e) {
        console.log(e)
        return {
            props: {
                apiError: true
            }
        }
    }

}

export default function Chat({ loggedUser: loggedUser_, channel: channel_, user: user_, apiError }) {

    const cookies = new CookieManager();
    // let unreadUsersMessages = null

    const [socketId, setSocketId] = useState(null);
    const [loggedUser, setLoggedUser] = useState(loggedUser_);
    const [channel, setChannel] = useState(channel_);
    const [user, setUser] = useState(user_);
    const [typingMessage, setTypingMessage] = useState({ content: "" });
    // const [unreadUsers, setUnreadUsers] = useState(unreadUsersMessages.getAll())

    if (apiError) return <APIError />


    let notificationSound = null;

    useEffect(() => {
        window.onfocus = function () {
            focused = true;
        };
        window.onblur = function () {
            focused = false;
        };
        window.socket?.disconnect()
        const socket = io(settings.apiURL, {
            query: `authorization=${cookies.getCookie("authorization")}`
        });
        loadSockets(socket);
        notificationSound = new Audio("/assets/notification.mp3");
    }, [])

    let focused = true;



    function loadSockets(socket) {
        window.socket = socket;
        socket.on("successfully_connected", data => {
            console.log(`Successfully connected to socket: ${socket.id}`, data)
            setSocketId(socket.id)
        })
        socket.on("matchesUpdate", data => {
            console.log("matchesUpdate", data)
            updateStateObject(setLoggedUser, loggedUser, ["matches", data])
        })
        socket.on("message", message => {
            console.log("msg", message, channel)
            if (channel.id === message.channelId) {
                channel.messages.push(message);
                updateStateObject(setChannel, channel, ["messages", channel.messages]);
                if (!focused) notificationSound.play()
            } else {
                notificationSound.play()
                // setUnreadUsers(unreadUsersMessages.add(message.authorId))
            }
        })

    }

    function getAuthorById(id) {
        if (id === loggedUser.id) return loggedUser;
        if (id === user.id) return user;
        return {}
    }


    async function sendMessage() {
        const request = await fetch(`${settings.apiURL}/channels/${channel.id}/messages`, {
            method: "POST",
            headers: {
                "authorization": cookies.getCookie("authorization"),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: typingMessage.content
            })
        })

        const response = await request.json();

        if (request.status != 200) {
            return alert(`Erro ao enviar mensagem: ${response?.errors ? response.errors.map(e => `${e.path}: ${e.message}`).join("\n") : response?.message}`)
        }
        channel.messages.push(response);
        updateStateObject(setChannel, channel, ["messages", channel.messages]);
        setTypingMessage({ content: "" })
    }


    return (
        <>
            <Head>
                <title>NemTinder</title>
                <meta name="description" content="Acesse o NemTinder" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header data={{ user: loggedUser }} />
            <main className={styles.main}>
                <Sidebar loggedUser={loggedUser} setLoggedUser={setLoggedUser} />
                <div className={styles.content}>
                    <div className={styles.channelContent}>
                        <div className={styles.channelTitle}>
                            <div className={styles.avatardiv}>
                                <img src={user.avatar} />
                            </div>
                            <h2>{user.name}</h2>
                            <span>{user.shortDescription}</span>
                        </div>
                        <div className={styles.channelMessages}>
                            {
                                channel.messages.map(message => <div key={message.id} className={styles.message + " " + (message.authorId === loggedUser.id ? styles.message_right : styles.message_left)}>
                                    <div className={styles.message_content}>
                                        <div className={styles.avatardiv}>
                                            <img src={getAuthorById(message.authorId).avatar} />
                                        </div>
                                        <p>{message.content}</p>
                                    </div>
                                </div>)
                            }
                        </div>
                    </div>
                    <div className={styles.channelinput}>
                        <div className={styles.channelinput_sendmessage}>
                            <input value={typingMessage.content} onChange={(e) => updateStateObject(setTypingMessage, typingMessage, ["content", e.target.value])} type="text" placeholder={`Conversar com ${user.name}`} />
                            <button onClick={() => sendMessage()}><IoSend /></button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}


function getChannelByIds(id1, id2) {
    const ids = [id1, id2].sort((a, b) => a - b);
    return `${ids[0]}_${ids[1]}`;
}

function updateStateObject(func, obj, ...updates) {
    const _obj = JSON.parse(JSON.stringify(obj));

    for (const update of updates) {
        const [param, value] = update;
        const keys = param.split('.');
        let currentObj = _obj;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!currentObj[keys[i]]) {
                currentObj[keys[i]] = {};
            }
            currentObj = currentObj[keys[i]];
        }

        currentObj[keys[keys.length - 1]] = value;
    }

    func(_obj);
}