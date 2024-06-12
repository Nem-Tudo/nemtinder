import Link from "next/link";
import styles from "./Header.module.css"
import { IoIosNotificationsOutline } from "react-icons/io";
import Tippy from "@tippyjs/react";

export default function Header({ data = {} }) {
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
                                <div className={styles.icon}>
                                    <IoIosNotificationsOutline />
                                </div>
                            </Tippy>
                            <div className={styles.user}>
                                <span>{data.user.name}</span>
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
        </>
    )
}
