import Link from "next/link";
import styles from "./Header.module.css"
import { IoIosNotificationsOutline } from "react-icons/io";
import Tippy from "@tippyjs/react";
import Verified from "./Verified";
import { useEffect, useState } from "react";
import settings from "@/settings";
import CookieManager from "@/public/js/CookieManager";

export default function Header({ data = {} }) {

    const [notifications, setNotifications] = useState(null);

    const cookies = new CookieManager()

    useEffect(() => {
        document.onkeydown = (e) => {
            if(notifications && e.keyCode === 27){
                setNotifications(null)
            }
        }
    }, [])

    async function openNotifications() {
        const request = await fetch(`${settings.apiURL}/users/@me/notifications`, {
            method: "GET",
            headers: {
                "authorization": cookies.getCookie("authorization"),
            }
        })

        const response = await request.json();

        if (request.status != 200) {
            return alert(`Erro ao obter notificações: ${response?.errors ? response.errors.map(e => `${e.path}: ${e.message}`).join("\n") : response?.message}`)
        }

        setNotifications(response.reverse());
    }


    return (
        <>

            <header className={styles.header}>
                <div className={styles.left}>
                    <Link href="/">
                        <img className={styles.logo} src="/logo.png" alt="Logo" />
                        <h1>NemTinder</h1>
                    </Link >
                    <a target="_blank" className={styles.premium + " " + styles.item} href="https://pixcord.shop/1112429999157428446?p=NemTinder%20Premium"><span>Premium</span>🔥</a>
                    <a target="_blank" className={styles.item} href="https://discord.gg/XF7Yd7P3zP"><span>Discord</span></a>
                </div>
                <div className={styles.right}>
                    {
                        data.user ? <>
                            <Tippy theme="nemtinder" content="Notificações">
                                <div className={styles.icon} onClick={() => openNotifications()}>
                                    <IoIosNotificationsOutline />
                                </div>
                            </Tippy>
                            <div className={styles.user}>
                                <span>{data.user.name}</span>
                                <Verified flags={data.user.flags} />
                                <Tippy theme="nemtinder" content="Meu perfil">
                                    <Link className={styles.avatardiv} href={"/profile"}>
                                        <img src={data.user.avatar} />
                                    </Link>
                                </Tippy>
                            </div>
                        </> : <>
                            <Tippy theme="nemtinder" content="Logue">
                                <div className={styles.login}>
                                    <Link href={"/login"}>Logar</Link>
                                </div>
                            </Tippy>
                        </>
                    }
                </div>
            </header>

            {
                notifications && <div className={styles.notifications_background}>
                    <div className={styles.notifications}>
                        <div className={styles.notifications_options}>
                            <span className={styles.notifications_title}>Notificações</span>
                            <button onClick={() => setNotifications(null)} className={styles.notifications_close}>Fechar</button>
                        </div>
                        <ul>
                            {
                                notifications.map((not) => <li className={styles.notification}>
                                    <div className={styles.notification_author}>
                                        <a href={`/?user=${not.authorId}`}>{not.authorUsername}</a>
                                    </div>
                                    <div className={styles.notification_content}>
                                        <span>{not.content}</span>
                                        {not.extraContent && <span className={styles.notification_extraContent}>{not.extraContent}</span>}
                                    </div>
                                    <div className={styles.notification_button}>
                                        <a href={not.button_url}>{not.button_text}</a>
                                    </div>
                                </li>)
                            }
                        </ul>
                    </div>
                </div>
            }
        </>
    )
}
