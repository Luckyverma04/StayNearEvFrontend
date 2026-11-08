import { useCallback, useEffect, useRef } from "react";

/**
 * Card ko mouse ke saath 3D me jhukao (sirf asli mouse wale device par).
 *   const tilt = useTilt();
 *   <div ref={tilt.ref} onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave}>
 * Card ke andar ek `.snev-glare` element ho to chamak bhi mouse ke saath chalegi.
 */
export const useTilt = ({ max = 8, scale = 1.02 } = {}) => {
  const ref = useRef(null);
  const frame = useRef(0);
  const enabled = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    enabled.current = Boolean(fine && !reduce);
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const onPointerMove = useCallback(
    (e) => {
      if (!enabled.current || !ref.current) return;
      const el = ref.current;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width; // 0..1
      const py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.transition = "transform 80ms ease-out";
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) scale(${scale})`;
        el.style.setProperty("--glare-x", `${px * 100}%`);
        el.style.setProperty("--glare-y", `${py * 100}%`);
        el.style.setProperty("--glare-o", "1");
      });
    },
    [max, scale]
  );

  const onPointerLeave = useCallback(() => {
    if (!ref.current) return;
    cancelAnimationFrame(frame.current);
    const el = ref.current;
    el.style.transition = "transform 450ms cubic-bezier(.2,.8,.2,1)";
    el.style.transform = "";
    el.style.setProperty("--glare-o", "0");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
};

export default useTilt;
