import {
  ScrollDirection,
  scrollDown,
  scrollUp,
  useIsButtonDisabled,
  useIsObiWanHere,
  useIsSlotWarningInCourse,
  useLoadSithData,
  useSlotByIndex,
} from "./sith-tracker-state";
import { withSubscribe } from "./with-subscribe";

export const SithTracker = () => (
  <section className="css-scrollable-list">
    <ul className="css-slots">
      <SithSlot index={0} />
      <SithSlot index={1} />
      <SithSlot index={2} />
      <SithSlot index={3} />
      <SithSlot index={4} />
    </ul>
    <div className="css-scroll-buttons">
      <ScrollButton scrollDirection="up" />
      <ScrollButton scrollDirection="down" />
    </div>
  </section>
);

const ScrollButton = withSubscribe(
  ({ scrollDirection }: { scrollDirection: ScrollDirection }) => {
    const buttonDisabled = useIsButtonDisabled(scrollDirection);
    const slotWarningInCourse = useIsSlotWarningInCourse();
    const isDisabled = buttonDisabled || slotWarningInCourse;
    return (
      <button
        onClick={() => {
          if (isDisabled) return;
          scrollDirection === "up" ? scrollUp() : scrollDown();
        }}
        className={`css-button-${scrollDirection} ${
          isDisabled ? "css-button-disabled" : ""
        }`}
      ></button>
    );
  }
);

const SithSlot = withSubscribe((props: { index: number }) => {
  const slot = useSlotByIndex(props.index);
  const showWarning = useIsObiWanHere(props.index);
  const shouldInterruptLoading = useIsSlotWarningInCourse();
  return (
    <li className={`css-slot ${showWarning ? "css-warning" : ""}`}>
      {slot.kind === "loading" && !shouldInterruptLoading && (
        <LoadSith index={props.index} id={slot.id} />
      )}

      {slot.kind === "loaded" && (
        <ShowSith name={slot.name} homeworld={slot.homeworld.name} />
      )}
    </li>
  );
});

const LoadSith = withSubscribe((props: { id: number; index: number }) => {
  useLoadSithData(props.index, props.id);
  return null;
});

const ShowSith = ({ name, homeworld }: { name: string; homeworld: string }) => (
  <>
    <h3>{name}</h3>
    <h6>Homeworld: {homeworld}</h6>
  </>
);
