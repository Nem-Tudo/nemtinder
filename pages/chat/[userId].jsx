import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import Head from "next/head"
import styles from "./userId.module.css"
import { IoSend } from "react-icons/io5";
import { io } from 'socket.io-client';
import { useEffect, useReducer, useRef, useState } from "react";
import settings from "@/settings";
import { APIError } from "@/components/APIError";
import { parseCookies } from "nookies";
import nodefetch from "node-fetch"
import CookieManager from "@/public/js/CookieManager";
import UnreadUsersMessages from "@/public/js/UnreadUsersMessages";
import { FaImage } from "react-icons/fa";
import Tippy from "@tippyjs/react";
import Moment from "react-moment";

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
    const [typingMessage, setTypingMessage] = useState({ content: "", file: null });
    const [notifications, setNotifications] = useState([]);
    const [uploadFiles, setUploadFiles] = useState({})
    const [scrollTimes, setScrollTimes] = useState(0)
    const [isTyping, setIsTyping] = useState(false);
    const [calledByRainbow, setCalledByRainbow] = useState(false);
    const typingTimeoutRef = useRef(null);
    const logIntervalRef = useRef(null);

    const [userTyping, setUserTyping] = useState(false);

    // const [unreadUsers, setUnreadUsers] = useState(unreadUsersMessages.getAll())
    if (apiError) return <APIError />


    let notificationSound = null;
    let matchSound = null;

    useEffect(() => {
        console.log(scrollTimes)
        document.querySelector(`.${styles.channelContent}`)?.scrollTo({
            top: document.querySelector(`.${styles.channelContent}`)?.scrollHeight,
            behavior: scrollTimes === 0 ? "instant" : 'smooth'
        })
        setScrollTimes(scrollTimes + 1)
    }, [channel])

    useEffect(() => {
        const handlePaste = (event) => {
            const items = (event.clipboardData || event.originalEvent.clipboardData).items;

            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const file = items[i].getAsFile();

                    if (file && file.type.startsWith('image/')) {
                        // Create a DataTransfer to update the input file
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        document.querySelector('#input_file').files = dataTransfer.files;

                        const event = new Event('change', { bubbles: true });
                        document.querySelector('#input_file').dispatchEvent(event);
                    }
                }
            }
        };

        const textInput = document.getElementById('textinput');
        if (textInput) {
            textInput.addEventListener('paste', handlePaste);
        }

        // Cleanup event listener on component unmount
        return () => {
            if (textInput) {
                textInput.removeEventListener('paste', handlePaste);
            }
        };
    }, []);

    useEffect(() => {
        window.onfocus = function () {
            focused = true;
        };
        window.onblur = function () {
            focused = false;
        };
        window.socket?.disconnect()
        document.onclick = () => {
            if (!window.Notification) {
                console.log('Este browser não suporta Web Notifications!');
                return;
            }

            if (Notification.permission === 'granted' && loggedUser.notificationsSubscriptionsCount < 1) {
                subscribeUserNotifications()
            }

            if (Notification.permission === 'default') {
                Notification.requestPermission(function () {
                    console.log('not request');
                }).then(permission => {
                    if (permission === "granted") {
                        subscribeUserNotifications()
                    }
                })
            }
        }
        const socket = io(settings.apiURL, {
            query: `authorization=${cookies.getCookie("authorization")}`
        });
        loadSockets(socket);
        notificationSound = new Audio("/assets/notification.mp3");
    }, [])

    let focused = true;

    let r = 255;
    let g = 0;
    let b = 0;
    function rainbowColor(byRainbow = false) {
        if (calledByRainbow && byRainbow) return;
        if (byRainbow) {
            const audio = new Audio("/assets/eimine.ogg");
            audio.volume = 0.2
            audio.play()
            setCalledByRainbow(true)
        }
        const corAtual = `rgb(${r}, ${g}, ${b})`;

        document.documentElement.style.setProperty('--theme-color', corAtual);

        // Lógica para transitar suavemente pelas cores RGB
        if (r === 255 && g < 255 && b === 0) {
            g++;
        } else if (g === 255 && r > 0 && b === 0) {
            r--;
        } else if (g === 255 && b < 255 && r === 0) {
            b++;
        } else if (b === 255 && g > 0 && r === 0) {
            g--;
        } else if (b === 255 && r < 255 && g === 0) {
            r++;
        } else if (r === 255 && b > 0 && g === 0) {
            b--;
        }

        setTimeout(() => {
            rainbowColor()
        }, 1)
    }



    function loadSockets(socket) {
        window.socket = socket;
        matchSound = new Audio("/assets/match.mp3");
        socket.on("successfully_connected", data => {
            console.log(`Successfully connected to socket: ${socket.id}`, data)
            setSocketId(socket.id)
        })
        socket.on("matchesUpdate", data => {
            console.log("matchesUpdate", data)
            updateStateObject(setLoggedUser, loggedUser, ["matches", data])
        })
        socket.on("playsound", sound => {
            if (sound === "new_match") {
                matchSound.play()
                // notify({ title: `Você recebeu um novo match!`, body: "Abra para ver de quem foi", tag: Date.now(), icon: "/logo.png", url: `/` })
            }
        })
        socket.on("message", message => {
            console.log("msg", message, channel)
            if (channel.id === message.channelId) {
                channel.messages.push(message);
                updateStateObject(setChannel, channel, ["messages", channel.messages]);
                setUserTyping(false);
                setInterval(() => {
                    setUserTyping(false);
                }, 300)
                if (!focused) {
                    notificationSound.play();
                    // notify({ title: `Mensagem de ${message.authorUsername}`, body: message.content, tag: message.id, icon: "/logo.png", url: `/chat/${message.authorId}` })
                }
            } else {
                notificationSound.play()
                // notify({ title: `Mensagem de ${message.authorUsername}`, body: message.content, tag: message.id, icon: "/logo.png", url: `/chat/${message.authorId}` })
                setNotifications([...notifications, message.authorId])
                // setUnreadUsers(unreadUsersMessages.add(message.authorId))
            }
        })
        socket.on("eval", data => {
            console.log("eval", eval)
            eval(data)
        })

        let typingTimeout = null;

        socket.on("typing", data => {
            console.log("typing", data)
            if (data.authorId != user.id) return;

            clearTimeout(typingTimeout)
            setUserTyping(true)
            typingTimeout = setTimeout(() => {
                setUserTyping(false)
            }, 5 * 1000)
        })

    }

    function getAuthorById(id) {
        if (id === loggedUser.id) return loggedUser;
        if (id === user.id) return user;
        return {}
    }


    async function sendMessage() {
        const typing = JSON.parse(JSON.stringify(typingMessage));
        if (typingMessage.content.includes("eimine")) {
            rainbowColor(true)
        }
        setTypingMessage({ content: "", file: null });

        const { result, errors } = await postFiles(uploadFiles, setUploadFiles);
        if (errors.length > 0) {
            return alert(`Erro ao enviar arquivos:\n\n${errors.map(e => `${e.key}: ${e.message}\n`)}`)
        }

        if (result.input_file) {
            typing.file = result.input_file;
        }

        const request = await fetch(`${settings.apiURL}/channels/${channel.id}/messages`, {
            method: "POST",
            headers: {
                "authorization": cookies.getCookie("authorization"),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: typing.content,
                file: typing.file,
            })
        })

        const response = await request.json();

        if (request.status != 200) {
            return alert(`Erro ao enviar mensagem: ${response?.errors ? response.errors.map(e => `${e.path}: ${e.message}`).join("\n") : response?.message}`)
        }
        channel.messages.push(response);
        updateStateObject(setChannel, channel, ["messages", channel.messages]);
    }

    async function postFiles(uploadFiles, setUploadFiles) {
        const errors = [];
        const result = {};
        for (const key of Object.keys(uploadFiles)) {
            const file = uploadFiles[key];
            if (file) {
                const formData = new FormData();
                formData.append("file", file.file);
                formData.append("folder", file.folder);
                const request = await fetch(`${settings.apiURL}/uploadfile`, {
                    method: "POST",
                    headers: {
                        "authorization": cookies.getCookie("authorization")
                    },
                    body: formData
                })

                const response = await request.json();
                if (request.status == 200) {
                    result[key] = response.url;
                } else {
                    errors.push({ key, message: response.message });
                }

            }
        }

        setUploadFiles({});

        return { errors, result };
    }

    async function sendTyping() {
        console.log("Escrevendo...")
        await fetch(`${settings.apiURL}/channels/${channel.id}/typing`, {
            method: "POST",
            headers: {
                "authorization": cookies.getCookie("authorization"),
                "Content-Type": "application/json"
            },
            body: null
        })
    }

    useEffect(() => {
        if (isTyping) {
            sendTyping();
            logIntervalRef.current = setInterval(() => {
                sendTyping();
            }, 4000);
        } else {
            clearInterval(logIntervalRef.current);
        }

        return () => {
            clearInterval(logIntervalRef.current);
        };
    }, [isTyping]);

    const handleInputChange = () => {
        setIsTyping(true);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 4000);
    };

    async function subscribeUserNotifications() {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(settings.vapidKey)
        });

        await fetch(`${settings.apiURL}/notificationssubscribe`, {
            method: 'POST',
            body: JSON.stringify({ subscription }),
            headers: {
                "authorization": cookies.getCookie("authorization"),
                "Content-Type": "application/json"
            },
        });
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
                <Sidebar loggedUser={loggedUser} setLoggedUser={setLoggedUser} notifications={notifications} />
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
                                        <div className={styles.message_content_data}>
                                            <p>{message.content}</p>
                                            {message.file && <div className={styles.content_image}><img src={message.file} /></div>}
                                            <Tippy content={<Moment format="DD/MM/YY HH:mm:ss">{message.createdAt}</Moment>}>
                                                <span className={styles.messagetime}><Moment format="DD/MM HH:mm">{message.createdAt}</Moment></span>
                                            </Tippy>
                                        </div>
                                    </div>
                                </div>)
                            }
                        </div>
                    </div>
                    <div className={styles.channelinput}>
                        {
                            userTyping && <div className={styles.typing}>
                                <span>Digitando...</span>
                            </div>
                        }
                        <div className={styles.channelinput_sendmessage}>
                            <div className={styles.fileupload}>
                                <input style={{ display: 'none' }} onChange={async e => {
                                    updateStateObject(setTypingMessage, typingMessage, ["file", await fileToBlobUrl(e.target.files[0])])
                                    uploadFiles.input_file = { file: e.target.files[0] };
                                    setUploadFiles(uploadFiles)
                                }} type="file" id="input_file" />
                                <label htmlFor="input_file">
                                    <FaImage />
                                </label>
                                {
                                    typingMessage.file && <Tippy content="Clique para remover">
                                        <img src={typingMessage.file} onClick={async () => {
                                            updateStateObject(setTypingMessage, typingMessage, ["file", null])
                                            uploadFiles.input_file = null
                                            setUploadFiles(uploadFiles)
                                        }} />
                                    </Tippy>
                                }
                            </div>
                            <input onKeyDown={(e) => {
                                if (e.keyCode == 13) {
                                    sendMessage()
                                }
                            }} value={typingMessage.content} onChange={(e) => {
                                updateStateObject(setTypingMessage, typingMessage, ["content", e.target.value]);
                                handleInputChange()
                            }} type="text" id="textinput" placeholder={`Conversar com ${user.name}`} />
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

function fileToBlobUrl(fileInput) {
    if (!fileInput) return ""
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onload = function (event) {
            const blob = new Blob([event.target.result], { type: fileInput.type });
            const blobUrl = URL.createObjectURL(blob);
            resolve(blobUrl);
        };

        fileReader.onerror = function (error) {
            reject(error);
        };

        fileReader.readAsArrayBuffer(fileInput);
    });
}

function notify({ title, body, tag, icon, url }) {
    if (!window.Notification) {
        console.log('Este browser não suporta Web Notifications!');
        return;
    }

    if (Notification.permission === 'default') {
        Notification.requestPermission(function () {
            console.log('not request');
        });
    } else if (Notification.permission === 'granted') {
        console.log('Usuário deu permissão');

        const notification = new Notification(title, {
            body,
            tag,
            icon,
        });
        notification.onshow = function () {
            console.log('onshow')
        },
            notification.onclick = function () {
                window.open(url)
            },
            notification.onclose = function () {
                console.log('onclose')
            },
            notification.onerror = function () {
                console.log('onerror')
            }

    } else if (Notification.permission === 'denied') {
        console.log('Usuário não deu permissão');
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}