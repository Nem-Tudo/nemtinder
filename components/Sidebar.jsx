import { FaHeart, FaHeartBroken, FaBars } from "react-icons/fa";
import styles from "./Sidebar.module.css";
import Tippy from "@tippyjs/react";
import { CiMail } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import Link from "next/link";
import CookieManager from "@/public/js/CookieManager";
import settings from "@/settings";
import Verified from "./Verified";
import { IoCloseOutline } from "react-icons/io5";
import { useEffect } from "react";

export default function Sidebar({ loggedUser, setLoggedUser, notifications }) {
    const { pending, matchs, sents, jumps } = loggedUser.matches;

    useEffect(() => {
        console.log("NOT", notifications)
    }, [notifications])


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
                    <h2>Pendentes ({pending.length})</h2>
                    <ul>
                        {
                            pending.map((pending, index) => <li className={styles.userli} key={pending.id + "_" + index}>
                                <div className={styles.user}>
                                    <div className={styles.avatardiv}>
                                        <img src={pending.avatar} />
                                    </div>
                                    <a href={`/?user=${pending.id}`}>
                                        <span>{pending.name}</span>
                                        <Verified flags={pending.flags} />
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
                    <h2>Matchs ({matchs.length})</h2>
                    <ul>
                        {
                            matchs.filter(m => notifications.includes(m.id)).map((pending, index) => <li className={styles.userli} key={pending.id + "_" + index}>
                                <div className={styles.user}>
                                    <Tippy content="Desfazer match" theme="nemtinder">
                                        <div style={{ cursor: "pointer" }} onClick={() => matchUser(pending.id, "REFUSE")}>
                                            <IoCloseOutline />
                                        </div>
                                    </Tippy>
                                    <div className={styles.avatardiv}>
                                        <img src={pending.avatar} />
                                    </div>
                                    <a href={`/?user=${pending.id}`}>
                                        <span>{pending.name}</span>
                                        <Verified flags={pending.flags} />
                                    </a>
                                    <div style={{ backgroundColor: "red", width: "10px", height: "10px", borderRadius: "50%" }}></div>
                                    <div className={styles.options}>
                                        <Tippy theme="nemtinder" content="Mensagem">
                                            <a href={`/chat/${pending.id}`}><CiMail /></a >
                                        </Tippy>
                                    </div>
                                </div>
                            </li>)
                        }
                        {
                            matchs.filter(m => !notifications.includes(m.id)).map((pending, index) => <li className={styles.userli} key={pending.id + "_" + index}>
                                <div className={styles.user}>
                                    <Tippy content="Desfazer match" theme="nemtinder">
                                        <div style={{ cursor: "pointer" }} onClick={() => matchUser(pending.id, "REFUSE")}>
                                            <IoCloseOutline />
                                        </div>
                                    </Tippy>
                                    <div className={styles.avatardiv}>
                                        <img src={pending.avatar} />
                                    </div>
                                    <a href={`/?user=${pending.id}`}>
                                        <span>{pending.name}</span>
                                        <Verified flags={pending.flags} />
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
                    <h2>Enviados ({sents.length})</h2>
                    <ul>
                        {
                            sents.map((pending, index) => <li className={styles.userli} key={pending.id + "_" + index}>
                                <div className={styles.user}>
                                    <div className={styles.avatardiv}>
                                        <img src={pending.avatar} />
                                    </div>
                                    <a href={`/?user=${pending.id}`}>
                                        <span>{pending.name}</span>
                                        <Verified flags={pending.flags} />
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
                <div className={styles.group}>
                    <h2>Pulados ({jumps.length})</h2>
                    <span style={{ display: "block", marginBottom: "5px" }}>Usuários que você pulou duas ou mais vezes e não são mais recomendados</span>
                    {
                        loggedUser.flags.includes("VERIFIED") && <ul>
                            {
                                jumps.map((pending, index) => <li className={styles.userli} key={pending.id + "_" + index}>
                                    <div className={styles.user}>
                                        <div className={styles.avatardiv}>
                                            <img src={pending.avatar} />
                                        </div>
                                        <a href={`/?user=${pending.id}`}>
                                            <span>{pending.name}</span>
                                            <Verified flags={pending.flags} />
                                        </a>
                                        <div className={styles.options}>
                                            <Tippy theme="nemtinder" content="❤ Match ❤">
                                                <button onClick={() => matchUser(pending.id, "SEND")}><FaHeart /></button>
                                            </Tippy>
                                        </div>
                                    </div>
                                </li>)
                            }
                        </ul>
                    }
                    {
                        !loggedUser.flags.includes("VERIFIED") && <span style={{marginTop: "10px", display: "block", border: "1px solid var(--theme-color)", padding: "7px", borderRadius: "5px"}}>Obtenha <a style={{color: "red", fontWeight: "500"}} href="/premium">Premium</a> para visualizar ou enviar match</span>
                    }
                </div>
            </section>
            <div className={styles.sidebarbackground} onClick={() => closeSidebar()}>
            </div>
        </>
    )
}