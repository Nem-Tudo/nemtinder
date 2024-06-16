export function getServerSideProps({req, res, query}) {
    if (query.user) {
        if (query.user.startsWith("@")) {
            return {
                redirect: {
                    permanent: false,
                    destination: `/?user=${query.user.replace("@", "")}`,
                }
            }
        }
    }

    return {
        props: {

        }
    }
}

export default function User() {
    return <h1>Não encontrado</h1>
}