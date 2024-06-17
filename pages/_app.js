import "@/styles/globals.css";
import "@/styles/reset.css";


import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away-subtle.css';
import tippy from "tippy.js";
import '@/styles/tippy.css'
import { useEffect } from "react";

tippy.setDefaultProps({
  arrow: true,
  animation: "shift-away-subtle",
  delay: 0
})

export default function App({ Component, pageProps }) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registrado com sucesso:', registration);
        })
        .catch((error) => {
          console.error('Falha ao registrar o Service Worker:', error);
        });
    }
  }, []);


  return <Component {...pageProps} />;
}
