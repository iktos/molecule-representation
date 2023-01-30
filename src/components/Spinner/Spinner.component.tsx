import React from 'react';
import { Keyframes } from './Keyframes';

export interface SpinnerProps {
  width: number;
  height: number;
}
export const Spinner: React.FC<SpinnerProps> = ({ width, height }) => (
  <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Keyframes name='spinner' _0={{ transform: 'rotate(0deg)' }} _100={{ transform: 'rotate(360deg)' }} />
    <div
      style={{
        display: 'inline-block',
        width: '40px',
        height: '40px',
        content: ' ',
        borderRadius: '50%',
        border: '2px solid #358de7',
        borderColor: '#358de7 transparent #358de7 transparent',
        animation: 'spinner 1.2s linear infinite',
      }}
    />
  </div>
);
