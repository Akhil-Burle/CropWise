import { createElement, forwardRef, Fragment } from 'react';

/**
 * Animation-free stand-in for the few framer-motion APIs the app used.
 * Farmers use cheap phones: no motion library, no animation work. The final `animate`
 * values are applied as plain styles so bars and rings still show the right size.
 */
const MOTION_PROPS = ['initial', 'animate', 'exit', 'transition', 'layout', 'whileHover', 'whileTap'];
const cache = new Map();

function plainStyle(animate) {
  if (!animate || typeof animate !== 'object') return undefined;
  const out = {};
  Object.entries(animate).forEach(([k, v]) => {
    if (!Array.isArray(v) && k !== 'x' && k !== 'y') out[k] = v;
  });
  return out;
}

export const motion = new Proxy(
  {},
  {
    get(_, tag) {
      if (!cache.has(tag)) {
        const C = forwardRef(function Plain(props, ref) {
          const rest = { ...props };
          const end = plainStyle(rest.animate);
          MOTION_PROPS.forEach((p) => delete rest[p]);
          return createElement(tag, { ...rest, ref, style: end ? { ...end, ...rest.style } : rest.style });
        });
        C.displayName = `plain.${String(tag)}`;
        cache.set(tag, C);
      }
      return cache.get(tag);
    },
  },
);

export const AnimatePresence = ({ children }) => createElement(Fragment, null, children);
export const MotionConfig = ({ children }) => createElement(Fragment, null, children);
/** Always "reduced": nothing animates. */
export const useReducedMotion = () => true;
