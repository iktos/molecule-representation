/* 
  MIT License

  Copyright (c) 2023 Iktos

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

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
