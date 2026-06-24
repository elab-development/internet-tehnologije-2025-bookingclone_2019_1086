import ReactDOM from "react-dom/client";

import App from "./app/App";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./i18n/i18n";
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <App />
);