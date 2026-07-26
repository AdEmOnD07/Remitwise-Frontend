import React, { useContext } from 'react';
import { HeadingLevelContext } from './HeadingLevelContext';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const Heading: React.FC<HeadingProps> = ({ level, children, ...props }) => {
  const currentLevel = useContext(HeadingLevelContext);
  const resolvedLevel = level ?? currentLevel;
  const Component = `h${Math.min(Math.max(resolvedLevel, 1), 6)}` as keyof React.JSX.IntrinsicElements;

  return <Component {...props}>{children}</Component>;
};
