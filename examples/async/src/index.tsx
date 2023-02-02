import { createRoot } from "react-dom";

import App from "./App";

const rootElement = document.getElementById("root");
if (rootElement) createRoot(rootElement).render(<App />);
