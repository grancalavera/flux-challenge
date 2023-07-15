import { Subscribe } from "@react-rxjs/core";
import { ReactNode } from "react";
import { Observable } from "rxjs";

interface WithSubscribeOptions {
  source$?: Observable<unknown>;
  fallback?: ReactNode | null;
}

export function withSubscribe<T>(
  Component: React.ComponentType<T>,
  options: WithSubscribeOptions = { fallback: null }
) {
  return (props: T) => (
    <Subscribe {...options}>
      <Component {...(props as T & JSX.IntrinsicAttributes)} />
    </Subscribe>
  );
}
