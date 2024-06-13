import Tippy from "@tippyjs/react";
import styles from "./UserSuggestion.module.css";
import Verified from "./Verified";
import { FaHeart, FaHeartBroken, FaRegHeart } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

export default function UserSuggestion({ user, matchFunction, closeFunction }) {
    return (
        <>
            <div className={styles.userSuggestion}>
                <div className={styles.left}>
                    <div className={styles.userprincipal}>
                        <div className={styles.userphoto}>
                            <img src={user.photos[0] ? user.photos[0].url : user.avatar} />
                            <div className={styles.userinfosdiv}>
                                <div className={styles.userinfos}>
                                    <div>
                                        <h2>{user.name}</h2>
                                        <span>{user.age}</span>
                                        <Verified flags={user.flags} />
                                    </div>
                                    <div>
                                        <p>{user.shortDescription}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.useroptions}>
                        <Tippy content="Pular" theme="nemtinder">
                            <div onClick={() => closeFunction()} className={styles.option}>
                                <IoClose />
                            </div>
                        </Tippy>
                        <Tippy content="Enviar match" theme="nemtinder">
                            <div onClick={() => matchFunction()} className={styles.option}>
                                <FaRegHeart />
                            </div>
                        </Tippy>
                    </div>
                </div>
                <div className={styles.right}>
                    <div className={styles.head}>
                        <div className={styles.avatardiv}>
                            <img src={user.avatar} />
                        </div>
                        <h2>{user.username}</h2>
                        <Verified flags={user.flags} />
                        {getGenderText(user.gender)}
                    </div>
                    <div className={styles.aboutuser}>
                        <h3>Gostos</h3>
                        <p>{user.likesDescription}</p>
                        <h3>Biografia</h3>
                        <p>{user.longDescription}</p>
                        <h3>Procura</h3>
                        <p>{user.preferredGenders.map(gender => getGenderText(gender))}</p>
                        <h3>Redes Sociais</h3>
                        <p>{user.socialsDescription}</p>
                    </div>
                </div>
            </div >
        </>
    )
}

function getGenderText(genderCode) {
    if (genderCode === 0) return <span style={{ color: "#f05ff5" }} className={styles.gender}>Mulher</span>
    if (genderCode === 1) return <span style={{ color: "#4e8bed" }} className={styles.gender}>Homem</span>
    if (genderCode === 2) return <span style={{ color: "#a6a6a6" }} className={styles.gender}>Outro</span>
}