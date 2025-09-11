/** @format */

import { useRef, useState, useCallback } from "react";
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from "react-native";

export interface ScrollAnimationHook {
        scrollY: Animated.Value;
        tabBarStyle: any;
        onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
        isTabBarVisible: boolean;
}

export const useScrollAnimation = (): ScrollAnimationHook => {
        const scrollY = useRef(new Animated.Value(0)).current;
        const [isTabBarVisible, setIsTabBarVisible] = useState(true);
        const lastScrollY = useRef(0);
        const scrollDirection = useRef<"up" | "down">("down");

        const TAB_BAR_HEIGHT = 60;
        const SCROLL_THRESHOLD = 10;

        const onScroll = useCallback(
                (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                        const currentScrollY = event.nativeEvent.contentOffset.y;
                        const deltaY = currentScrollY - lastScrollY.current;

                        // Only process if scroll delta is significant enough
                        if (Math.abs(deltaY) < SCROLL_THRESHOLD) {
                                return;
                        }

                        // Determine scroll direction
                        const currentDirection = deltaY > 0 ? "down" : "up";

                        // Only animate if direction changed or if we're at the top/bottom
                        if (
                                currentDirection !== scrollDirection.current ||
                                currentScrollY <= 0
                        ) {
                                scrollDirection.current = currentDirection;

                                if (currentScrollY <= 0) {
                                        // At the top, always show tab bar
                                        setIsTabBarVisible(true);
                                        Animated.timing(scrollY, {
                                                toValue: 0,
                                                duration: 250,
                                                useNativeDriver: false,
                                        }).start();
                                } else if (currentDirection === "down" && currentScrollY > 100) {
                                        // Scrolling down, hide tab bar
                                        if (isTabBarVisible) {
                                                setIsTabBarVisible(false);
                                                Animated.timing(scrollY, {
                                                        toValue: TAB_BAR_HEIGHT,
                                                        duration: 250,
                                                        useNativeDriver: false,
                                                }).start();
                                        }
                                } else if (currentDirection === "up") {
                                        // Scrolling up, show tab bar
                                        if (!isTabBarVisible) {
                                                setIsTabBarVisible(true);
                                                Animated.timing(scrollY, {
                                                        toValue: 0,
                                                        duration: 250,
                                                        useNativeDriver: false,
                                                }).start();
                                        }
                                }
                        }

                        lastScrollY.current = currentScrollY;
                },
                [scrollY, isTabBarVisible, TAB_BAR_HEIGHT]
        );

        const tabBarStyle = {
                transform: [
                        {
                                translateY: scrollY.interpolate({
                                        inputRange: [0, TAB_BAR_HEIGHT],
                                        outputRange: [0, TAB_BAR_HEIGHT],
                                        extrapolate: "clamp",
                                }),
                        },
                ],
        };

        return {
                scrollY,
                tabBarStyle,
                onScroll: Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false, listener: onScroll }
                ),
                isTabBarVisible,
        };
};