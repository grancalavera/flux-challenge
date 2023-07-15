import { bind } from "@react-rxjs/core";
import { webSocket } from "rxjs/webSocket";

type ObiWanLocation = {
  id: number;
  name: string;
};

const obiWanLocationSubject$ = webSocket<ObiWanLocation>("ws://localhost:4000");

export const [useObiWanLocation, obiWanLocation$] = bind(
  obiWanLocationSubject$
);
