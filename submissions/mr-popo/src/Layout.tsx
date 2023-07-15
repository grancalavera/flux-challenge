import { PropsWithChildren } from "react";

export const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div className="app-container">
      <div className="css-root">{children}</div>
    </div>
  );
};
