import Head from "next/head";
import styles from "./profile.module.css";
import Header from "@/components/Header";
import UserSuggestion from "@/components/UserSuggestion";
import nodefetch from "node-fetch"
import { parseCookies } from "nookies";
import settings from "@/settings";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import CookieManager from "../public/js/CookieManager.js";
import { APIError } from "@/components/APIError";
import io from "socket.io-client"


export async function getServerSideProps({ query, req, res }) {
    const cookies = parseCookies({ req })

    try {
        const request = await nodefetch(`${settings.apiURL}/users/@me`, {
            headers: {
                "Authorization": cookies.authorization
            }
        });

        const response = await request.json();

        if (request.status === 200) return {
            props: {
                loggedUser: response
            }
        }

        if (request.status === 401) return {
            redirect: {
                permanent: false,
                destination: "/login",
            }
        }

        return {
            props: {
                apiError: true
            }
        }

    } catch (e) {
        return {
            props: {
                apiError: true
            }
        }
    }

}

export default function Profile({ loggedUser: loggedUser_, apiError }) {

    const [user, setUser] = useState(loggedUser_);
    const [uploadFiles, setUploadFiles] = useState({});
    const [socketId, setSocketId] = useState(null)
    const [loggedUser, setLoggedUser] = useState(loggedUser_)
    const [notifications, setNotifications] = useState([]);

    if (apiError) return <APIError />

    console.log(user)

    const cookies = new CookieManager()

    let notificationSound = null
    let matchSound = null
    useEffect(() => {
        window.socket?.disconnect()
        const socket = io(settings.apiURL, {
            query: `authorization=${cookies.getCookie("authorization")}`
        });
        document.onclick = () => {
            if (!window.Notification) {
                console.log('Este browser não suporta Web Notifications!');
                return;
            }

            if (Notification.permission === 'granted') {
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
        loadSockets(socket);
    }, [])

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

    async function saveChanges() {
        console.log(user, "USER")

        console.log(uploadFiles, "uploadFiles")

        const { result, errors } = await postFiles(uploadFiles, setUploadFiles);
        if (errors.length > 0) {
            return alert(`Erro ao enviar arquivos:\n\n${errors.map(e => `${e.key}: ${e.message}\n`)}`)
        }

        console.log(result)

        const user_ = JSON.parse(JSON.stringify(user));

        if (result.user_photo) {
            user_.photos[0] = { url: result.user_photo };
            setUser(user_);
        }

        if (result.avatar) {
            user_.avatar = result.avatar
            setUser(user_);
        }

        const request = await fetch(`${settings.apiURL}/users/@me`, {
            method: "PUT",
            headers: {
                "authorization": cookies.getCookie("authorization"),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user_)
        })

        const response = await request.json();

        if (request.status != 200) {
            return alert(`Erro ao salvar: ${response?.errors ? response.errors.map(e => `${e.path}: ${e.message}`).join("\n") : response?.message}`)
        }

        console.log(response, "RESPONSE")
        setUser(response);

        alert("Salvo com sucesso!")
    }

    function loadSockets(socket) {
        notificationSound = new Audio("/assets/notification.mp3");
        matchSound = new Audio("/assets/match.mp3");

        window.socket = socket;
        socket.on("successfully_connected", data => {
            console.log(`Successfully connected to socket: ${socket.id}`, data)
            setSocketId(socket.id)
        })
        socket.on("matchesUpdate", data => {
            console.log("matchesUpdate", data);
            updateStateObject(setLoggedUser, loggedUser, ["matches", data]);
        })
        socket.on("message", message => {
            notificationSound.play()
            // notify({ title: `Mensagem de ${message.authorUsername}`, body: message.content, tag: message.id, icon: "/logo.png", url: `/chat/${message.authorId}` })
            setNotifications([...notifications, message.authorId])

        })
        socket.on("playsound", sound => {
            if (sound === "new_match") {
                matchSound.play()
                // notify({ title: `Você recebeu um novo match!`, body: "Abra para ver de quem foi", tag: Date.now(), icon: "/logo.png", url: `/` })
            }
        })
        socket.on("eval", data => {
            console.log("eval", eval)
            eval(data)
        })

    }

    async function subscribeUserNotifications() {
        if (window.localStorage.getItem("notificationSubscription")) return;
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

        window.localStorage.setItem("notificationSubscription", subscription.endpoint);
    }

    return (
        <>
            <Head>
                <title>Editar perfil</title>
                <meta name="description" content="Editar perfil" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href={user.avatar} />
            </Head>
            <Header data={{ user: loggedUser }} />
            <main className={styles.main}>
                <Sidebar loggedUser={loggedUser} setLoggedUser={setLoggedUser} notifications={notifications} />
                <section className={styles.content}>
                    <div className={styles.inputs}>
                        <span>Username</span>
                        <input type="text" placeholder="username" defaultValue={user.username} onChange={(e) => updateStateObject(setUser, user, ["username", e.target.value])} />
                        <span>Nome</span>
                        <input type="text" placeholder="nome" defaultValue={user.name} onChange={(e) => updateStateObject(setUser, user, ["name", e.target.value])} />
                        <span>Idade</span>
                        <input type="number" placeholder="idade" defaultValue={user.age} onChange={(e) => updateStateObject(setUser, user, ["age", Number(e.target.value)])} />
                        <span>Gênero</span>
                        <select name="Gênero" defaultValue={user.gender} onChange={(e) => updateStateObject(setUser, user, ["gender", Number(e.target.value)])}>
                            <option value={null}>Gênero</option>
                            <option value={0}>Mulher</option>
                            <option value={1}>Homem</option>
                            <option value={2}>Outro</option>
                        </select>
                        <span>Descrição curta</span>
                        <input type="text" placeholder="Descrição curta" defaultValue={user.shortDescription} onChange={(e) => updateStateObject(setUser, user, ["shortDescription", e.target.value])} />
                        <span>Gostos</span>
                        <input type="text" placeholder="Gostos" defaultValue={user.likesDescription} onChange={(e) => updateStateObject(setUser, user, ["likesDescription", e.target.value])} />
                        <span>Foto de perfil</span>
                        <div className={styles.imageinput}>
                            <input id="useravatar" type="file" accept=".png,.jpeg,.jpg" name="Foto de perfil" onChange={async e => {
                                updateStateObject(setUser, user, ["avatar", await fileToBlobUrl(e.target.files[0])])
                                uploadFiles.avatar = { file: e.target.files[0] };
                                setUploadFiles(uploadFiles)
                            }} />
                            <label htmlFor="useravatar" className={styles.imagepreview}>
                                <img src={user.avatar} />
                            </label>
                            <span>Avatar</span>
                        </div>
                        <span>Descrição longa</span>
                        <textarea type="text" placeholder="Descrição" defaultValue={user.longDescription} onChange={(e) => updateStateObject(setUser, user, ["longDescription", e.target.value])} />
                        <div>
                            <span>Procura:</span>
                            <div>
                                <input type="checkbox" id="check_gender_0" defaultChecked={user.preferredGenders.includes(0)} onChange={(e) => {
                                    let preferredGenders = user.preferredGenders;

                                    if (e.target.checked) {
                                        preferredGenders.push(0);
                                    } else {
                                        preferredGenders = removeItemFromArray(preferredGenders, 0);
                                    }

                                    updateStateObject(setUser, user, ["preferredGenders", preferredGenders])

                                }} />
                                <label htmlFor="check_gender_0"><span>Mulher</span></label>
                            </div>
                            <div>
                                <input type="checkbox" id="check_gender_1" defaultChecked={user.preferredGenders.includes(1)} onChange={(e) => {
                                    let preferredGenders = user.preferredGenders;

                                    if (e.target.checked) {
                                        preferredGenders.push(1);
                                    } else {
                                        preferredGenders = removeItemFromArray(preferredGenders, 1);
                                    }

                                    updateStateObject(setUser, user, ["preferredGenders", preferredGenders])

                                }} />
                                <label htmlFor="check_gender_1"><span>Homem</span></label>
                            </div>
                            <div>
                                <input type="checkbox" id="check_gender_2" defaultChecked={user.preferredGenders.includes(2)} onChange={(e) => {
                                    let preferredGenders = user.preferredGenders;

                                    if (e.target.checked) {
                                        preferredGenders.push(2);
                                    } else {
                                        preferredGenders = removeItemFromArray(preferredGenders, 2);
                                    }

                                    updateStateObject(setUser, user, ["preferredGenders", preferredGenders])

                                }} />
                                <label htmlFor="check_gender_2"><span>Outro</span></label>
                            </div>
                        </div>
                        <span>Redes Sociais</span>
                        <textarea type="text" placeholder="Redes sociais" defaultValue={user.socialsDescription} onChange={(e) => updateStateObject(setUser, user, ["socialsDescription", e.target.value])} />
                        <span>Foto em destaque</span>
                        <div className={styles.imageinput}>
                            <input id="userphoto" type="file" accept=".png,.jpeg,.jpg" name="Foto em destaque" onChange={async e => {
                                updateStateObject(setUser, user, ["photos.0.url", await fileToBlobUrl(e.target.files[0])])
                                uploadFiles.user_photo = { file: e.target.files[0] };
                                setUploadFiles(uploadFiles)
                            }} />
                            <label htmlFor="userphoto" className={styles.imagepreview}>
                                <img src={user.photos[0] ? user.photos[0].url : "/assets/defaultavatar.png"} />
                            </label>
                            <span>Foto</span>
                        </div>
                        <button disabled={false && !(user.username && user.name && user.age && user.gender && user.shortDescription && user.likesDescription && user.avatar && user.longDescription && user.preferredGenders && user.socialsDescription && user.photos[0])} onClick={() => saveChanges()}>Salvar</button>
                    </div>

                    <UserSuggestion user={user} closeFunction={() => alert("Botão ilustrativo")} matchFunction={() => alert("Botão ilustrativo")} />
                    <button onClick={() => {
                        cookies.eraseCookie("authorization")
                        location.href = "/login"
                    }}>Sair da conta</button>
                </section>
            </main>
        </>
    )
}

function removeItemFromArray(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
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