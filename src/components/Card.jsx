import React from "react";
import clsx from "clsx";

// Shared card component enforcing unified radius, border, and shadow
const Card = ({ as: As = "div", className = "", children, ...rest }) => {
  const Comp = As;
  return (
    <Comp
      className={clsx("tm-card-shell", className)}
      {...rest}
    >
      {children}
    </Comp>
  );
};

export default Card;
