import { FaHeart, FaHeartBroken, FaBars } from "react-icons/fa";
import styles from "./Sidebar.module.css";
import Tippy from "@tippyjs/react";
import { CiMail } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import Link from "next/link";
import CookieManager from "@/public/js/CookieManager";
import settings from "@/settings";

export default function Sidebar({ loggedUser, setLoggedUser }) {
    const { pending, matchs, sents } = loggedUser.matches;


    const cookies = new CookieManager();

    function openSidebar() {
        document.querySelector(`.${styles.sidebar}`).classList.remove(styles.sidebar_closed);
        document.querySelector(`.${styles.sidebar}`).classList.add(styles.sidebar_open);
        document.querySelector(`.${styles.sidebarbackground}`).classList.add(styles.sidebarbackground_enabled);
    }

    function closeSidebar() {
        document.querySelector(`.${styles.sidebar}`).classList.remove(styles.sidebar_open);
        document.querySelector(`.${styles.sidebar}`).classList.add(styles.sidebar_closed);
        document.querySelector(`.${styles.sidebar}`).classList.remove(styles.closingSidebar);
        document.querySelector(`.${styles.sidebarbackground}`).classList.remove(styles.sidebarbackground_enabled);

    }

    async function matchUser(userid, action) {
        const request = await fetch(`${settings.apiURL}/users/@me/matches`, {
            method: "PUT",
            headers: {
                "authorization": cookies.getCookie("authorization"),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: userid,
                action: action
            })
        })

        const response = await request.json();

        if (request.status != 200) {
            return alert(`Erro ao atualizar match: ${response?.errors ? response.errors.map(e => `${e.path}: ${e.message}`).join("\n") : response?.message}`)
        }

        updateStateObject(setLoggedUser, loggedUser, ["matches", response.matches])
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

    return (
        <>
            <section className={styles.sidebarmobile}>
                <div className={styles.sidebar_open} onClick={() => { openSidebar() }}>
                    <FaBars />
                </div>
            </section>
            <section className={styles.sidebar + " " + styles.sidebar_closed}>
                <div className={styles.group}>
                    <h2>Pendentes</h2>
                    <ul>
                        {
                            pending.map(pending => <li className={styles.userli} key={pending.id}>
                                <div className={styles.user}>
                                    <div className={styles.avatardiv}>
                                        <img src={pending.avatar} />
                                    </div>
                                    <a href={`/?user=${pending.id}`}>
                                        <span>{pending.name}</span>
                                    </a>
                                    <div className={styles.options}>
                                        <Tippy theme="nemtinder" content="❤ Match ❤">

                                            <button onClick={() => matchUser(pending.id, "SEND")}><FaHeart /></button>
                                        </Tippy>
                                        <Tippy theme="nemtinder" content="Recusar">

                                            <button onClick={() => matchUser(pending.id, "REFUSE")}><FaHeartBroken /></button>
                                        </Tippy>
                                    </div>
                                </div>
                            </li>)
                        }
                    </ul>
                </div>
                <div className={styles.group}>
                    <h2>Matchs</h2>
                    <ul>
                        {
                            matchs.map(pending => <li className={styles.userli} key={pending.id}>
                                <div className={styles.user}>
                                    <div className={styles.avatardiv}>
                                        <img src={pending.avatar} />
                                    </div>
                                    <a href={`/?user=${pending.id}`}>
                                        <span>{pending.name}</span>
                                    </a>
                                    <div className={styles.options}>
                                        <Tippy theme="nemtinder" content="Mensagem">
                                            <a href={`/chat/${pending.id}`}><CiMail /></a >
                                        </Tippy>
                                    </div>
                                </div>
                            </li>)
                        }
                    </ul>
                </div>
                <div className={styles.group}>
                    <h2>Enviados</h2>
                    <ul>
                        {
                            sents.map(pending => <li className={styles.userli} key={pending.id}>
                                <div className={styles.user}>
                                    <div className={styles.avatardiv}>
                                        <img src={pending.avatar} />
                                    </div>
                                    <a href={`/?user=${pending.id}`}>
                                        <span>{pending.name}</span>
                                    </a>
                                    <div className={styles.options}>
                                        <Tippy theme="nemtinder" content="Cancelar">
                                            <button onClick={() => matchUser(pending.id, "REFUSE")}><IoClose /></button>
                                        </Tippy>
                                    </div>
                                </div>
                            </li>)
                        }
                    </ul>
                </div>
            </section>
            <div className={styles.sidebarbackground} onClick={() => closeSidebar()}>
            </div>
        </>
    )
}