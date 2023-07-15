import { bind } from "@react-rxjs/core";
import { createSignal, mergeWithKey } from "@react-rxjs/utils";
import { produce } from "immer";
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  scan,
  shareReplay,
  startWith,
  switchMap,
} from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { assertNever } from "./assertNever";
import { withSubscribe } from "./withSubscribe";
import { obiWanLocation$ } from "./obiWanLocation";

type SithTracker = [Slot, Slot, Slot, Slot, Slot];
type Slot = Empty | Loading | Loaded;
type Empty = { kind: "empty" };
type Loading = { kind: "loading" } & WithId;
type Loaded = { kind: "loaded" } & WithId & Data;
type WithId = { id: number };
type Data = {
  id: number;
  name: string;
  homeworld: {
    id: number;
    name: string;
  };
  master: Reference;
  apprentice: Reference;
};

type Reference = {
  url: string | null;
  id: number | null;
};

const initialState: SithTracker = [
  { kind: "loading", id: 3616 },
  { kind: "empty" },
  { kind: "empty" },
  { kind: "empty" },
  { kind: "empty" },
];

const [useLoadSithSlotData] = bind<[index: number, id: number], void>(
  (index: number, id: number) =>
    fromFetch(`http://localhost:3000/dark-jedis/${id}`).pipe(
      filter((response) => response.ok),
      switchMap((data) => data.json() as Promise<Data>),
      map((data) => loadSithData({ index, data }))
    )
);

const [sithData$, loadSithData] = createSignal<{
  index: number;
  data: Data;
}>();
const [scrollUp$, scrollUp] = createSignal();
const [scrollDown$, scrollDown] = createSignal();

const signal$ = mergeWithKey({
  scrollUp$,
  scrollDown$,
  sithData$,
});

const sithTracker$ = signal$.pipe(
  scan(
    (state, signal) =>
      produce(state, (draft) => {
        switch (signal.type) {
          case "scrollUp$": {
            if (state[0].kind === "loaded" && state[0].master.id !== null) {
              draft[0] = { kind: "empty" };
              draft[1] = { kind: "loading", id: state[0].master.id };
              draft[2] = { ...state[0] };
              draft[3] = { ...state[1] };
              draft[4] = { ...state[2] };
            }

            break;
          }
          case "scrollDown$": {
            console.log(state);
            if (state[4].kind === "loaded" && state[4].apprentice.id !== null) {
              draft[0] = { ...state[2] };
              draft[1] = { ...state[3] };
              draft[2] = { ...state[4] };
              draft[3] = { kind: "loading", id: state[4].apprentice.id };
              draft[4] = { kind: "empty" };
            }
            break;
          }
          case "sithData$": {
            const { data, index } = signal.payload;
            const slot: Loaded = { ...data, kind: "loaded" };
            draft[index] = slot;

            if (
              index > -1 &&
              data.master.id !== null &&
              state[index - 1]?.kind === "empty"
            ) {
              draft[index - 1] = {
                kind: "loading",
                id: data.master.id,
              };
            }

            if (
              index < 4 &&
              data.apprentice.id !== null &&
              state[index + 1]?.kind === "empty"
            ) {
              draft[index + 1] = {
                kind: "loading",
                id: data.apprentice.id,
              };
            }
            break;
          }
          default: {
            assertNever(signal);
          }
        }
      }),
    initialState
  ),
  startWith(initialState),
  shareReplay({ bufferSize: 1, refCount: true })
);

const [useSithIdBySlotIndex] = bind((index: number) =>
  sithTracker$.pipe(
    map((sithTracker) => sithTracker[index]),
    filter(Boolean)
  )
);

const [useIsButtonDisabled] = bind((direction: "up" | "down") =>
  combineLatest([sithTracker$, slotWarnings$]).pipe(
    map(([state, slotWarnings]) => {
      if (slotWarnings.some(Boolean)) return true;
      if (direction === "up") {
        const slot = state[0];
        return !(slot.kind === "loaded" && slot.master.id !== null);
      } else {
        const slot = state[4];
        return !(slot.kind === "loaded" && slot.apprentice.id !== null);
      }
    })
  )
);

type SlotWarnings = [boolean, boolean, boolean, boolean, boolean];
const initialSlotWarnings: SlotWarnings = [false, false, false, false, false];
const slotWarnings$ = combineLatest([obiWanLocation$, sithTracker$]).pipe(
  map(
    ([obiWanLocation, slots]) =>
      slots.map(
        (slot) =>
          slot.kind === "loaded" && slot.homeworld.id === obiWanLocation.id
      ) as SlotWarnings
  ),
  distinctUntilChanged(
    (prev, current) => JSON.stringify(prev) === JSON.stringify(current)
  ),
  startWith(initialSlotWarnings),
  shareReplay({ bufferSize: 1, refCount: true })
);

const [useIsObiWanHere] = bind((index: number) =>
  slotWarnings$.pipe(map((slotWarnings) => slotWarnings[index] ?? false))
);

export const SithList = () => (
  <ul className="css-slots">
    <SithSloth index={0} />
    <SithSloth index={1} />
    <SithSloth index={2} />
    <SithSloth index={3} />
    <SithSloth index={4} />
  </ul>
);

const SithSloth = withSubscribe((props: { index: number }) => {
  const slot = useSithIdBySlotIndex(props.index);
  const isObiWanHere = useIsObiWanHere(props.index);

  return (
    <li className={`css-slot ${isObiWanHere ? " css-warning" : ""}`}>
      {slot.kind === "loading" && (
        <LoadSithLord id={slot.id} index={props.index} />
      )}
      {slot.kind === "loaded" && <ShowSithLord {...slot} />}
    </li>
  );
});

const LoadSithLord = withSubscribe((props: { id: number; index: number }) => {
  useLoadSithSlotData(props.index, props.id);
  return null;
});

const ShowSithLord = ({ name, homeworld }: Loaded) => (
  <>
    <h3>{name}</h3>
    <h6>Homeworld: {homeworld.name}</h6>
  </>
);

export const Button = withSubscribe(
  ({ direction }: { direction: "up" | "down" }) => {
    const isDisabled = useIsButtonDisabled(direction);
    return (
      <button
        onClick={() => {
          if (isDisabled) return;
          direction === "up" ? scrollUp() : scrollDown();
        }}
        className={`css-button-${direction} ${
          isDisabled ? "css-button-disabled" : ""
        }`}
      ></button>
    );
  }
);
