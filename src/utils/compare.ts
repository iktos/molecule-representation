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

export const isEqual = (obj1: unknown, obj2: unknown): boolean => {
  // Get the type of each object
  const type1 = typeof obj1;
  const type2 = typeof obj2;

  // If the types are different, the objects are not equal
  if (type1 !== type2) {
    return false;
  }

  // Handle specific types
  switch (type1) {
    case 'object':
      // Compare arrays and objects
      if (Array.isArray(obj1) && Array.isArray(obj2)) {
        // Compare arrays
        if (obj1.length !== obj2.length) {
          return false;
        }
        for (let i = 0; i < obj1.length; i++) {
          if (!isEqual(obj1[i], obj2[i])) {
            return false;
          }
        }
      } else if (obj1 instanceof Date && obj2 instanceof Date) {
        // Compare dates
        if (obj1.getTime() !== obj2.getTime()) {
          return false;
        }
      } else if (obj1 && obj2) {
        // Compare objects
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) {
          return false;
        }
        for (const key of keys1) {
          // @ts-ignore
          // eslint-disable-next-line no-prototype-builtins
          if (!obj2.hasOwnProperty(key) || !isEqual(obj1[key], obj2[key])) {
            return false;
          }
        }
      }
      break;
    default:
      // Compare primitives and functions
      if (obj1 !== obj2) {
        return false;
      }
      break;
  }

  // If all tests passed, the objects are equal
  return true;
};
