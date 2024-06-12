import Head from "next/head";
import styles from "./login.module.css";
import Header from "@/components/Header";
import nodefetch from "node-fetch"
import { parseCookies, setCookie } from "nookies";
import { APIError } from "@/components/APIError";
import settings from "@/settings";
import axios from "axios";

import ReCAPTCHA from "react-google-recaptcha";
import { useRef, useState } from "react";
import CookieManager from "../public/js/CookieManager.js";


export async function getServerSideProps({ query, req, res }) {
    const cookies = parseCookies({ req })

    try {
        const request = await nodefetch(`${settings.apiURL}/users/@me`, {
            headers: {
                "Authorization": cookies.authorization
            }
        });

        if (request.status === 200) return {
            redirect: {
                permanent: false,
                destination: "/",
            },
            props: {},
        }

        return {
            props: {},
        }
    } catch (e) {
        return {
            props: {
                apiError: true
            },
        }
    }

}

export default function Login({ apiError }) {
    const recaptcha1Ref = useRef(null);
    const recaptcha2Ref = useRef(null);
    const [recaptcha1Value, setRecaptcha1Value] = useState(null);
    const [recaptcha2Value, setRecaptcha2Value] = useState(null);

    if (apiError) return <APIError />

    const cookie = new CookieManager();


    async function login() {
        const username = document.querySelector("#login_username").value;
        const password = document.querySelector("#login_password").value;

        try {

            const request = await fetch(`${settings.apiURL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "g-recaptcha-response": recaptcha1Value
                },
                body: JSON.stringify({
                    username,
                    password
                })
            })

            const response = await request.json();

            if (request.status != 200) {
                recaptcha1Ref.current.reset()
                setRecaptcha1Value(null)
                return alert(`Erro ao logar: ${response.message}`);
            }

            cookie.setCookie("authorization", response.token)

            alert(`Seja bem vindo, ${response.user.username}!`)

            location.href = "/"

        } catch (e) {
            console.log(e)
            recaptcha1Ref.current.reset()
            setRecaptcha1Value(null)
            alert(`Erro: ${e.response?.data?.message}`)
        }

    }

    async function register() {
        const username = document.querySelector("#register_username").value;
        const name = document.querySelector("#register_name").value;
        const password = document.querySelector("#register_password").value;

        try {

            const request = await fetch(`${settings.apiURL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "g-recaptcha-response": recaptcha2Value
                },
                body: JSON.stringify({
                    username,
                    name,
                    password
                })
            })

            const response = await request.json();
            if (request.status != 200) {
                recaptcha2Ref.current.reset()
                setRecaptcha2Value(null)
                return alert(`Erro: ${response.message}`)
            }

            cookie.setCookie("authorization", response.token);

            alert(`Registrado com sucesso ${response.user.username}!`);

            location.href = "/profile"

        } catch (e) {
            console.log(e)
            recaptcha2Ref.current.reset()
            setRecaptcha2Value(null)
            alert(`Erro: ${e.response?.data?.message}`)
        }

    }


    return (
        <>
            <Head>
                <title>NemTinder Login</title>
                <meta name="description" content="Logue no NemTinder" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header data={{ user: null }} />
            <main className={styles.main}>

                <div className={styles.inputs}>
                    <h1>Já tem uma conta?</h1>
                    <input id="login_username" type="text" placeholder="username" />
                    <input id="login_password" type="password" placeholder="senha" />
                    <ReCAPTCHA
                        sitekey={settings.captchaKey}
                        ref={recaptcha1Ref}
                        onChange={setRecaptcha1Value}
                    />
                    <button onClick={() => login()} disabled={!recaptcha1Value}>Logar</button>
                </div>

                <div className={styles.inputs}>
                    <h1>Criar uma conta?</h1>
                    <input id="register_username" type="text" placeholder="username" />
                    <input id="register_name" type="text" placeholder="nome" />
                    <input id="register_password" type="password" placeholder="senha" />
                    <ReCAPTCHA
                        sitekey={settings.captchaKey}
                        ref={recaptcha2Ref}
                        onChange={setRecaptcha2Value}
                    />
                    <button disabled={!recaptcha2Value} onClick={() => register()}>Registrar</button>
                </div>

            </main>
        </>
    )
}