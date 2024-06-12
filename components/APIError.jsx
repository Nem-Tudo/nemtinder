import Head from "next/head";

export function APIError() {
    return (
        <>
            <Head>
                <title>NemTinder: Erro na API</title>
            </Head>
            <img src="/logo.png" style={{ width: "50px" }} alt="" />
            <h1 style={{ color: "black", fontSize: "1.5rem" }}>Ocorreu um erro ao acessar nossa API. Lamento muito :( <a style={{ color: "blue" }} href="https://discord.gg/XF7Yd7P3zP">Acesse o Discord para saber atualizações</a> e tente novamente.</h1>
        </>
    )
}