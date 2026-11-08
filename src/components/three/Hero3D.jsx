import React, { Suspense, lazy, useEffect, useRef, useState } from "react";

// 3D scene alag chunk me — sirf tab load ho jab dikhana ho
const ChargerScene = lazy(() => import("./ChargerScene"));

const supportsWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
};

/**
 * Home hero ka 3D charger. Ye cases me `fallback` (purani flat image) dikhti hai:
 *  - browser WebGL support nahi karta
 *  - user ne "reduce motion" on rakha hai
 * Screen se bahar ho to animation ruk jaata hai (battery bachti hai).
 */
const Hero3D = ({ fallback, className = "" }) => {
  const wrapRef = useRef(null);
  const [mode, setMode] = useState("pending"); // pending | 3d | fallback
  const [visible, setVisible] = useState(true);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setLowPower(window.matchMedia?.("(max-width: 767px)").matches || (navigator.hardwareConcurrency || 8) <= 4);
    setMode(!reduce && supportsWebGL() ? "3d" : "fallback");
  }, []);

  useEffect(() => {
    if (!wrapRef.current || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {mode === "3d" ? (
        <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center opacity-60">{fallback}</div>}>
          <ChargerScene lowPower={lowPower} paused={!visible} />
        </Suspense>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">{mode === "fallback" && fallback}</div>
      )}
    </div>
  );
};

export default Hero3D;
