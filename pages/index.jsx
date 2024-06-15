import Head from "next/head";
import styles from "./index.module.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UserSuggestion from "@/components/UserSuggestion";
import nodefetch from "node-fetch"
import { parseCookies, setCookie } from "nookies";
import { APIError } from "@/components/APIError";
import settings from "@/settings";
import { useEffect, useState } from "react";
import CookieManager from "@/public/js/CookieManager";
import { io } from 'socket.io-client';
import { useRouter } from "next/router";


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

export default function Home({ loggedUser: _loggedUser, apiError }) {
  if (apiError) return <APIError />

  const [loggedUser, setLoggedUser] = useState(_loggedUser);
  const [feed, setFeed] = useState([]);
  const [showingFeedItem, setShowingFeedItem] = useState(0);
  const [socketId, setSocketId] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const router = useRouter()
  const cookies = new CookieManager()

  let notificationSound = null;
  let matchSound = null;

  useEffect(() => {
    getFeed();
  }, [])

  useEffect(() => {
    window.socket?.disconnect()
    const socket = io(settings.apiURL, {
      query: `authorization=${cookies.getCookie("authorization")}`
    });
    loadSockets(socket);
  }, [])

  useEffect(() => {
    if (feed.length > 0) {
      router.push({
        pathname: "/",
        query: { user: feed[showingFeedItem].id }
      });
    }
  }, [showingFeedItem])


  function loadSockets(socket) {
    notificationSound = new Audio("/assets/notification.mp3");
    matchSound = new Audio("/assets/match.mp3");

    window.socket = socket;
    socket.on("successfully_connected", data => {
      console.log(`Successfully connected to socket: ${socket.id}`, data)
      setSocketId(socket.id)
    })
    socket.on("matchesUpdate", data => {
      console.log("matchesUpdate", data)
      updateStateObject(setLoggedUser, loggedUser, ["matches", data])
    })
    socket.on("eval", data => {
      console.log("eval", eval)
      eval(data)
    })
    socket.on("playsound", sound => {
      if (sound === "new_match") {
        matchSound.play()
      }
    })
    socket.on("message", message => {
      setNotifications([...notifications, message.authorId])
      notificationSound.play()
    })

  }


  async function getFeed() {
    const request = await fetch(`${settings.apiURL}/feed?${router.query.user ? `user=${router.query.user}&` : ""}`, {
      method: "GET",
      headers: {
        "authorization": cookies.getCookie("authorization"),
      }
    })

    const response = await request.json();

    if (request.status != 200) {
      return alert(`Erro ao obter feed: ${response?.errors ? response.errors.map(e => `${e.path}: ${e.message}`).join("\n") : response?.message}`)
    }

    setFeed(response);
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

  async function jumpUser(userId) {
    fetch(`${settings.apiURL}/users/${userId}/matches/jump`, {
      method: "POST",
      headers: {
        "authorization": cookies.getCookie("authorization"),
        "Content-Type": "application/json"
      },
      body: null
    })
  }

  return (
    <>
      <Head>
        <title>NemTinder</title>
        <meta name="description" content="Acesse o NemTinder" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header data={{ user: loggedUser }} />
      <main className={styles.main}>
        <Sidebar loggedUser={loggedUser} setLoggedUser={setLoggedUser} notifications={notifications} />
        <section className={styles.content}>
          {
            (feed.length > 0) ? <UserSuggestion closeFunction={() => {
              const nextItem = showingFeedItem + 1;
              if (nextItem >= feed.length) return alert("Acabou os usuários :(\nChame mais amigos para termos mais gente!");
              jumpUser(feed[showingFeedItem]?.id);
              setShowingFeedItem(nextItem);
            }} matchFunction={async () => {
              await matchUser(feed[showingFeedItem].id, "SEND")
              const nextItem = showingFeedItem + 1;
              if (nextItem >= feed.length) return alert("Acabou os usuários :(\nChame mais amigos para termos mais gente!")
              setShowingFeedItem(nextItem)
            }} user={feed[showingFeedItem]} /> : "Carregando feed..."
          }
        </section>
      </main>
    </>
  );
}