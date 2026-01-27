import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./scripts/scroll-reveal.js";

createRoot(document.getElementById("root")!).render(<App />);