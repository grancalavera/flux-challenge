import { Layout } from "./Layout";
import { Button, SithList } from "./sith-lords";
import { PlanetMonitor } from "./PlanetMonitor";

export function Application() {
  return (
    <Layout>
      <PlanetMonitor />
      <section className="css-scrollable-list">
        <SithList />
        <div className="css-scroll-buttons">
          <Button direction="up" />
          <Button direction="down" />
        </div>
      </section>
    </Layout>
  );
}
