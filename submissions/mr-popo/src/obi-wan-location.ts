import { bind } from "@react-rxjs/core";
import { webSocket } from "rxjs/webSocket";

type ObiWanLocation = {
  id: number;
  name: string;
};

export const [useObiWanLocation, obiWanLocation$] = bind(
  webSocket<ObiWanLocation>("ws://localhost:4000")
);
