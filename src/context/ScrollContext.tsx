/** @format */

import React, { createContext, useContext, ReactNode } from "react";
import { useScrollAnimation, ScrollAnimationHook } from "../hooks/useScrollAnimation";

interface ScrollContextType {
        scrollAnimation: ScrollAnimationHook;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

interface ScrollProviderProps {
        children: ReactNode;
}

export const ScrollProvider: React.FC<ScrollProviderProps> = ({ children }) => {
        const scrollAnimation = useScrollAnimation();

        return (
                <ScrollContext.Provider value={{ scrollAnimation }}>
                        {children}
                </ScrollContext.Provider>
        );
};

export const useScrollContext = (): ScrollContextType => {
        const context = useContext(ScrollContext);
        if (!context) {
                throw new Error("useScrollContext must be used within a ScrollProvider");
        }
        return context;
};