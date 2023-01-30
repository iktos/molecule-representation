import React from 'react';

interface IProps {
  name: string;
  [key: string]: React.CSSProperties | string;
}

export const Keyframes = (props: IProps) => {
  const toCss = (cssObject: React.CSSProperties | string) =>
    typeof cssObject === 'string'
      ? cssObject
      : Object.keys(cssObject).reduce((accumulator, key) => {
          const cssKey = key.replace(/[A-Z]/g, (v) => `-${v.toLowerCase()}`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cssValue = (cssObject as any)[key].toString().replace("'", '');
          return `${accumulator}${cssKey}:${cssValue};`;
        }, '');

  return (
    <style>
      {`@keyframes ${props.name} {
        ${Object.keys(props)
          .map((key) => {
            return ['from', 'to'].includes(key)
              ? `${key} { ${toCss(props[key])} }`
              : /^_[0-9]+$/.test(key)
              ? `${key.replace('_', '')}% { ${toCss(props[key])} }`
              : '';
          })
          .join(' ')}
      }`}
    </style>
  );
};
