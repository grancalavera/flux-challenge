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
import { assertNever } from "./assert-never";
import { obiWanLocation$ } from "./obi-wan-location";

export type { ScrollDirection };

export {
  scrollDown,
  scrollUp,
  useIsButtonDisabled,
  useIsObiWanHere,
  useIsSlotWarningInCourse,
  useLoadSithData,
  useSlotByIndex,
};

type State = [Slot, Slot, Slot, Slot, Slot];
type Slot = Empty | Loading | Loaded;
type Empty = { kind: "empty" };
type Loading = { kind: "loading" } & WithId;
type Loaded = { kind: "loaded" } & WithId & SithData;
type WithId = { id: number };
type SithData = {
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
type ScrollDirection = "up" | "down";
type IndexedSithData = { index: number; data: SithData };
type SlotWarnings = [boolean, boolean, boolean, boolean, boolean];

const reduceScrollUp = (state: State) =>
  produce(state, (draft) => {
    if (state[0].kind === "loaded" && state[0].master.id !== null) {
      draft[0] = { kind: "empty" };
      draft[1] = { kind: "loading", id: state[0].master.id };
      draft[2] = state[0];
      draft[3] = state[1];
      draft[4] = state[2];
    }
  });

const reduceScrollDown = (state: State) =>
  produce(state, (draft) => {
    if (state[4].kind === "loaded" && state[4].apprentice.id !== null) {
      draft[0] = state[2];
      draft[1] = state[3];
      draft[2] = state[4];
      draft[3] = { kind: "loading", id: state[4].apprentice.id };
      draft[4] = { kind: "empty" };
    }
  });

const reduceLoadSithData = (state: State, { index, data }: IndexedSithData) =>
  produce(state, (draft) => {
    draft[index] = { ...data, kind: "loaded" };

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
  });

const initialState: State = [
  { kind: "loading", id: 3616 },
  { kind: "empty" },
  { kind: "empty" },
  { kind: "empty" },
  { kind: "empty" },
];

const [loadSithData$, loadSithData] = createSignal<IndexedSithData>();
const [scrollUp$, scrollUp] = createSignal();
const [scrollDown$, scrollDown] = createSignal();

const sithTracker$ = mergeWithKey({
  scrollUp$,
  scrollDown$,
  loadSithData$,
}).pipe(
  scan((state, signal) => {
    switch (signal.type) {
      case "scrollUp$":
        return reduceScrollUp(state);
      case "scrollDown$":
        return reduceScrollDown(state);
      case "loadSithData$":
        return reduceLoadSithData(state, signal.payload);
      default:
        assertNever(signal);
    }
  }, initialState),
  startWith(initialState),
  shareReplay({ bufferSize: 1, refCount: true })
);

const [useSlotByIndex] = bind((index: number) =>
  sithTracker$.pipe(
    map((sithTracker) => sithTracker[index]),
    filter(Boolean)
  )
);

const [useIsButtonDisabled] = bind((scrollDirection: ScrollDirection) =>
  sithTracker$.pipe(
    map((state) => {
      if (scrollDirection === "up") {
        const slot = state[0];
        return !(slot.kind === "loaded" && slot.master.id !== null);
      } else {
        const slot = state[4];
        return !(slot.kind === "loaded" && slot.apprentice.id !== null);
      }
    })
  )
);

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

const [useIsSlotWarningInCourse] = bind(
  slotWarnings$.pipe(
    map((warnings) => warnings.some(Boolean)),
    distinctUntilChanged()
  )
);

const [useIsObiWanHere] = bind((index: number) =>
  slotWarnings$.pipe(map((warnings) => warnings[index] ?? false))
);

const [useLoadSithData] = bind<[index: number, id: number], void>(
  (index: number, id: number) =>
    fromFetch(`http://localhost:3000/dark-jedis/${id}`).pipe(
      filter((response) => response.ok),
      switchMap((data) => data.json() as Promise<SithData>),
      map((data) => loadSithData({ index, data }))
    )
);
