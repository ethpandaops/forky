import React, { useState } from 'react';

export const ViewportContext = React.createContext<
  | {
      viewport: object;
      setViewport: React.Dispatch<React.SetStateAction<object>>;
      viewportBox: {
        corner: {
          x: number;
          y: number;
        };
      };
      setViewportBox: React.Dispatch<
        React.SetStateAction<{
          corner: {
            x: number;
            y: number;
          };
          worldScreenWidth: number;
          worldScreenHeight: number;
        }>
      >;
    }
  | undefined
>(undefined);

export const ViewportProvider = ({ children }: { children: JSX.Element }) => {
  const [viewport, setViewport] = useState({});
  const [viewportBox, setViewportBox] = useState({
    corner: {
      x: 0,
      y: 0,
    },
    worldScreenWidth: 0,
    worldScreenHeight: 0,
  });

  const value = { viewport, setViewport, viewportBox, setViewportBox };

  return <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>;
};
