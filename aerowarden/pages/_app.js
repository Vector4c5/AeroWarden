import "@/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <ToastContainer
        position="top-right"
        autoClose={4200}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        limit={4}
      />
    </SessionProvider>
  );
}