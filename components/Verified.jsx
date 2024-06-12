import { MdVerified } from "react-icons/md";
import styles from "./Verified.module.css"
import Tippy from "@tippyjs/react";

export default function Verified({ flags }) {
    return (
        <>
            {
                flags.includes("VERIFIED") && <Tippy content="Verificado"><div className={styles.verified}><MdVerified /></div></Tippy>
            }
        </>
    )
}