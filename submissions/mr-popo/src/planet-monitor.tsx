import { useObiWanLocation } from "./obi-wan-location";
import { withSubscribe } from "./with-subscribe";

export const PlanetMonitor = withSubscribe(() => {
  const { name } = useObiWanLocation();
  return <h1 className="css-planet-monitor">Obi-Wan currently on {name}</h1>;
});
