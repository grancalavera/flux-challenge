import { useObiWanLocation } from "./obiWanLocation";
import { withSubscribe } from "./withSubscribe";

export const PlanetMonitor = withSubscribe(() => {
  const { name } = useObiWanLocation();
  return <h1 className="css-planet-monitor">Obi-Wan currently on {name}</h1>;
});
