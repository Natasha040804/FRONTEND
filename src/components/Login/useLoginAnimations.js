import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function useLoginAnimations() {
  const navRef = useRef(null);
  const homeTitleRef = useRef(null);
  const homeDescRef = useRef(null);
  const homeImgRef = useRef(null);
  const moveElementsRef = useRef([]);

  useLayoutEffect(() => {
    const images = Array.from(document.querySelectorAll('.home__img img'));
    const loadPromises = images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve);
      });
    });

    Promise.all(loadPromises).then(() => {
      // 1. NAV ANIMATION
      if (navRef.current) {
        gsap.from([navRef.current], {
          opacity: 0,
          duration: 1,
          delay: 0.5,
          y: 10
        });
      }

      // 2. HOME SECTION ANIMATIONS
      if (homeTitleRef.current) {
        gsap.from(homeTitleRef.current, {
          opacity: 0,
          duration: 1,
          delay: 0.8,
          y: 30
        });
      }

      if (homeDescRef.current) {
        gsap.from(homeDescRef.current, {
          opacity: 0,
          duration: 1,
          delay: 1,
          y: 30
        });
      }

      if (moveElementsRef.current.length > 0) {
        gsap.from(moveElementsRef.current, {
          opacity: 0,
          y: 40,
          duration: 1,
          delay: 0.6,
          stagger: 0.15,
          ease: 'power3.out'
        });
      }

      if (homeImgRef.current) {
        gsap.from(homeImgRef.current, {
          opacity: 0,
          duration: 1,
          delay: 0.7,
          y: 30
        });
      }

      // 3. MOUSEMOVE EFFECT
      const handleMove = (e) => {
        moveElementsRef.current.forEach(layer => {
          if (!layer) return;
          const speed = layer.dataset.speed;
          const x = (window.innerWidth - e.pageX * speed) / 120;
          const y = (window.innerHeight - e.pageY * speed) / 120;
          gsap.to(layer, { x, y, duration: 0.5 });
        });
      };

      if (moveElementsRef.current.length > 0) {
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
      }
    });
  }, []);

  return {
    navRef,
    homeTitleRef,
    homeDescRef,
    homeImgRef,
    moveElementsRef
  };
}