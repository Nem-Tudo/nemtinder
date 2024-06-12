import "@/styles/globals.css";
import "@/styles/reset.css";


import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away-subtle.css';
import tippy from "tippy.js";
import '@/styles/tippy.css'

tippy.setDefaultProps({
    arrow: true,
    animation: "shift-away-subtle",
    delay: 0
})

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
