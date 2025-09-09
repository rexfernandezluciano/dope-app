/** @format */
import React, { useMemo } from "react";
import { View, Text, StyleSheet, useWindowDimensions, Platform } from "react-native";

interface StepperProps {
	steps: string[];
	currentStep: number;
	accentColor?: string;
	successColor?: string;
	neutralColor?: string;
	breakpoint?: number; // Width breakpoint for mobile/desktop switch
}

const Stepper: React.FC<StepperProps> = ({
	steps,
	currentStep,
	accentColor = "#0c57aa",
	successColor = "#0069b5",
	neutralColor = "#6c757d",
	breakpoint = 768,
}) => {
	const { width } = useWindowDimensions();
	const isMobile = width < breakpoint;

	// Memoize progress percentage to avoid recalculation
	const progressPercentage = useMemo(() => {
		return Math.min(((currentStep + 1) / steps.length) * 100, 100);
	}, [currentStep, steps.length]);

	// Memoize current step text to avoid array access on each render
	const currentStepText = useMemo(() => {
		return steps[Math.min(currentStep, steps.length - 1)] || "";
	}, [steps, currentStep]);

	// Memoize step widths for desktop view
	const stepWidth = useMemo(() => {
		if (isMobile) return 0;
		return Math.max((width - 32) / steps.length, 120); // Min width of 120, with padding
	}, [width, steps.length, isMobile]);

	const renderMobileView = () => (
		<View style={styles.mobileContainer}>
			<View style={[styles.mobileBadge, { backgroundColor: accentColor }]}>
				<Text style={styles.mobileBadgeText}>
					Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
				</Text>
			</View>
			<Text
				style={[styles.mobileStepText, { color: accentColor }]}
				numberOfLines={2}
				adjustsFontSizeToFit>
				{currentStepText}
			</Text>
			<View style={styles.progressBarContainer}>
				<View style={[styles.progressBar, { backgroundColor: `${neutralColor}30` }]}>
					<View
						style={[
							styles.progressBarFill,
							{
								width: `${progressPercentage}%`,
								backgroundColor: accentColor,
							},
						]}
					/>
				</View>
			</View>
		</View>
	);

	const renderDesktopView = () => (
		<View style={styles.desktopContainer}>
			<View style={styles.stepsRow}>
				{steps.map((step, index) => {
					const isActive = index === currentStep;
					const isCompleted = index < currentStep;
					const isLast = index === steps.length - 1;

					return (
						<View
							key={`step-${index}`}
							style={styles.stepWrapper}>
							<View style={[styles.stepContainer, { width: stepWidth }]}>
								{/* Step circle */}
								<View
									style={[
										styles.stepCircle,
										isActive && {
											borderColor: accentColor,
											backgroundColor: accentColor,
										},
										isCompleted && {
											borderColor: successColor,
											backgroundColor: successColor,
										},
										!isActive &&
											!isCompleted && {
												borderColor: `${neutralColor}50`,
												backgroundColor: "white",
											},
									]}
									accessible={true}
									accessibilityLabel={`Step ${index + 1}${isCompleted ? ", completed" : isActive ? ", current" : ""}`}
									accessibilityRole="button"
									accessibilityState={{
										selected: isActive,
										disabled: index > currentStep,
									}}>
									<Text style={[styles.stepCircleText, isActive || isCompleted ? styles.stepCircleTextLight : { color: neutralColor }]}>
										{isCompleted ? "✓" : index + 1}
									</Text>
								</View>

								{/* Step label */}
								<Text
									style={[
										styles.stepLabel,
										isActive && {
											fontWeight: "600",
											color: accentColor,
										},
										isCompleted && {
											color: successColor,
										},
										!isActive &&
											!isCompleted && {
												color: neutralColor,
											},
									]}
									numberOfLines={2}
									adjustsFontSizeToFit>
									{step}
								</Text>
							</View>

							{/* Connector line */}
							{!isLast && (
								<View
									style={[
										styles.connectorLine,
										{
											backgroundColor: isCompleted ? successColor : `${neutralColor}30`,
											width: stepWidth * 0.8,
										},
									]}
								/>
							)}
						</View>
					);
				})}
			</View>
		</View>
	);

	return <View style={styles.container}>{isMobile ? renderMobileView() : renderDesktopView()}</View>;
};

const styles = StyleSheet.create({
	container: {
		marginVertical: 16,
		paddingHorizontal: 16,
	},

	// Mobile styles
	mobileContainer: {
		alignItems: "center",
	},
	mobileBadge: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		marginBottom: 12,
	},
	mobileBadgeText: {
		color: "white",
		fontSize: 14,
		fontWeight: "600",
		textAlign: "center",
	},
	mobileStepText: {
		fontSize: 18,
		fontWeight: "600",
		textAlign: "center",
		marginBottom: 16,
		paddingHorizontal: 8,
	},
	progressBarContainer: {
		width: "100%",
		marginTop: 8,
	},
	progressBar: {
		height: 6,
		borderRadius: 3,
		overflow: "hidden",
	},
	progressBarFill: {
		height: "100%",
		borderRadius: 3,
		...Platform.select({
			ios: {
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.2,
				shadowRadius: 2,
			},
			android: {
				elevation: 2,
			},
		}),
	},

	// Desktop styles
	desktopContainer: {
		width: "100%",
	},
	stepsRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "center",
	},
	stepWrapper: {
		flexDirection: "row",
		alignItems: "center",
	},
	stepContainer: {
		alignItems: "center",
		justifyContent: "flex-start",
	},
	stepCircle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "white",
		marginBottom: 8,
		...Platform.select({
			ios: {
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.1,
				shadowRadius: 4,
			},
			android: {
				elevation: 3,
			},
		}),
	},
	stepCircleText: {
		fontSize: 16,
		fontWeight: "600",
	},
	stepCircleTextLight: {
		color: "white",
	},
	stepLabel: {
		fontSize: 13,
		textAlign: "center",
		lineHeight: 16,
		minHeight: 32, // Consistent height
		paddingHorizontal: 4,
	},
	connectorLine: {
		height: 2,
		marginTop: 22, // Half of circle height
		marginHorizontal: 8,
		borderRadius: 1,
	},
});

export default Stepper;
