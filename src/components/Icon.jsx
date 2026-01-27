import React from 'react';
import clsx from 'clsx';
import * as Icons from '../icons';

const Icon = ({ name, as: As, className, size, ...rest }) => {
  const Comp = As || (name ? Icons[name] : null);
  if (!Comp) return null;
  return <Comp className={clsx('tm-icon', className)} {...rest} />;
};

export default Icon;
