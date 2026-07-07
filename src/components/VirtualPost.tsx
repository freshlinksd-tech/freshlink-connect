import React, { useState, useEffect, useRef } from 'react';

interface VirtualPostProps {
  id: string;
  children: React.ReactNode;
}

export const VirtualPost: React.FC<VirtualPostProps> = ({ id, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | string>('auto');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (containerRef.current) {
            setHeight(containerRef.current.offsetHeight);
          }
        } else {
          setIsVisible(false);
        }
      },
      {
        rootMargin: '600px 0px 600px 0px', // Pre-render elements 600px before they enter the viewport
        threshold: 0,
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ minHeight: height !== 'auto' ? `${height}px` : '400px' }}
      className="transition-all duration-300 ease-out"
      id={`virtual-container-${id}`}
    >
      {isVisible ? children : (
        <div className="bg-white border border-stone-200/45 rounded-[2rem] p-8 h-[400px] flex flex-col justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-100" />
            <div className="space-y-2">
              <div className="h-3 bg-stone-100 rounded w-28" />
              <div className="h-2.5 bg-stone-50 rounded w-20" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-5 bg-stone-100 rounded w-3/4" />
            <div className="h-3.5 bg-stone-50 rounded w-full" />
            <div className="h-3.5 bg-stone-50 rounded w-5/6" />
          </div>
          <div className="h-4 bg-stone-100 rounded w-24" />
        </div>
      )}
    </div>
  );
};
