import React from "react";
import ReactDOM from "react-dom/client";
import { Layout } from "./layout";
import "./main.css";
import { PlanetMonitor } from "./planet-monitor";
import { SithTracker } from "./sith-tracker";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Layout>
      <PlanetMonitor />
      <SithTracker />
    </Layout>
  </React.StrictMode>
);
