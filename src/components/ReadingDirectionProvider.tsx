"use client";

import { createContext, useContext } from "react";
import {
  DEFAULT_READING_DIRECTION,
  type ReadingDirection,
} from "@/lib/reading-direction";

const ReadingDirectionContext = createContext<ReadingDirection>(
  DEFAULT_READING_DIRECTION,
);

type ReadingDirectionProviderProps = {
  direction: ReadingDirection;
  children: React.ReactNode;
};

export function ReadingDirectionProvider({
  direction,
  children,
}: ReadingDirectionProviderProps) {
  return (
    <ReadingDirectionContext.Provider value={direction}>
      {children}
    </ReadingDirectionContext.Provider>
  );
}

export function useReadingDirection(): ReadingDirection {
  return useContext(ReadingDirectionContext);
}
