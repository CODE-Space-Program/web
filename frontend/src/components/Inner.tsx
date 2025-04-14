import React from "react";

export const Inner: React.FC<{
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
  middle?: boolean;
  children: React.ReactNode;
}> = ({ children, left, right, bottom, top, middle }) => {
  const className = `inner-${left ? "left" : right ? "right" : "left"}-${
    top ? "top" : bottom ? "bottom" : middle ? "middle" : "middle"
  }`;
  return <div className={className}>{children}</div>;
};
