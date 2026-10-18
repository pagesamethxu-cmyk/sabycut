import React from 'react';

export interface SafeAreaViewProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  horizontal?: boolean;
  vertical?: boolean;
  all?: boolean;
  minTop?: number;
  minBottom?: number;
  minLeft?: number;
  minRight?: number;
  mode?: 'padding' | 'margin';
  as?: React.ElementType;
}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  top = false,
  bottom = false,
  left = false,
  right = false,
  horizontal = false,
  vertical = false,
  all = false,
  minTop = 0,
  minBottom = 0,
  minLeft = 0,
  minRight = 0,
  mode = 'padding',
  as: Component = 'div',
  style,
  className = '',
  ...rest
}) => {
  const applyTop = all || vertical || top;
  const applyBottom = all || vertical || bottom;
  const applyLeft = all || horizontal || left;
  const applyRight = all || horizontal || right;

  const prefix = mode === 'margin' ? 'margin' : 'padding';

  const safeStyle: React.CSSProperties = {
    ...style,
    ...(applyTop
      ? { [`${prefix}Top`]: minTop > 0 ? `max(var(--sat, 0px), ${minTop}px)` : 'var(--sat, 0px)' }
      : {}),
    ...(applyBottom
      ? { [`${prefix}Bottom`]: minBottom > 0 ? `max(var(--sab, 0px), ${minBottom}px)` : 'var(--sab, 0px)' }
      : {}),
    ...(applyLeft
      ? { [`${prefix}Left`]: minLeft > 0 ? `max(var(--sal, 0px), ${minLeft}px)` : 'var(--sal, 0px)' }
      : {}),
    ...(applyRight
      ? { [`${prefix}Right`]: minRight > 0 ? `max(var(--sar, 0px), ${minRight}px)` : 'var(--sar, 0px)' }
      : {}),
  };

  return (
    <Component style={safeStyle} className={className} {...rest}>
      {children}
    </Component>
  );
};

export default SafeAreaView;
