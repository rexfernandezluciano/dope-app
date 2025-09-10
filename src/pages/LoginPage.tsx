/** @format */
import React, { useState, useRef, useEffect } from "react";
import { View, Text, Alert, ScrollView, KeyboardAvoidingView, Platform, StatusBar, Dimensions, TouchableWithoutFeedback, Keyboard } from "react-native";
import { TextInput, Button, Divider, HelperText, IconButton, ActivityIndicator } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import styles from "../css/styles";
import AuthService from "../services/AuthService";

// Constants
const SCREEN_HEIGHT = Dimensions.get("window").height;
const TFA_CODE_LENGTH = 6;
const ANIMATION_DURATION = 300;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = () => {
	const navigation = useNavigation();

	// Form state
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		tfaCode: "",
	});

	// UI state
	const [loading, setLoading] = useState(false);
	const [showTfa, setShowTfa] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState({});

	// Refs for form inputs
	const emailRef = useRef(null);
	const passwordRef = useRef(null);
	const tfaRef = useRef(null);

	// Animation ref
	const containerRef = useRef(null);

	// Set status bar style when screen is focused
	useFocusEffect(() => {
		StatusBar.setBarStyle("dark-content");
		if (Platform.OS === "android") {
			StatusBar.setBackgroundColor("#ffffff");
		}
	});

	// Form update helper with validation
	const updateFormData = (field, value) => {
		setFormData(prev => ({ ...prev, [field]: value }));

		// Clear specific error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: null }));
		}
	};

	// Validation functions
	const validateEmail = email => {
		if (!email.trim()) {
			return "Email is required";
		}
		if (!EMAIL_REGEX.test(email.trim())) {
			return "Please enter a valid email address";
		}
		return null;
	};

	const validatePassword = password => {
		if (!password) {
			return "Password is required";
		}
		if (password.length < 6) {
			return "Password must be at least 6 characters";
		}
		return null;
	};

	const validateTfaCode = code => {
		if (!code) {
			return "2FA code is required";
		}
		if (!/^\d{6}$/.test(code)) {
			return "Please enter a valid 6-digit code";
		}
		return null;
	};

	// Validate form
	const validateForm = () => {
		const newErrors = {};

		if (!showTfa) {
			const emailError = validateEmail(formData.email);
			const passwordError = validatePassword(formData.password);

			if (emailError) newErrors.email = emailError;
			if (passwordError) newErrors.password = passwordError;
		} else {
			const tfaError = validateTfaCode(formData.tfaCode);
			if (tfaError) newErrors.tfaCode = tfaError;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Handle login submission
	const handleLogin = async () => {
		// Dismiss keyboard
		Keyboard.dismiss();

		// Validate form
		if (!validateForm()) {
			containerRef.current?.shake?.(800);
			return;
		}

		setLoading(true);

		try {
			const result = await AuthService.login({
				email: formData.email.trim().toLowerCase(),
				password: formData.password,
				tfaCode: formData.tfaCode || undefined,
			});

			if (result.success) {
				// Success animation
				await containerRef.current?.pulse?.(ANIMATION_DURATION);

				Alert.alert("Success", "Welcome back!", [
					{
						text: "Continue",
						onPress: () => navigation.navigate("main"),
					},
				]);
			} else {
				// Check if 2FA is required
				if (result.error?.includes("TFA") || result.error?.includes("2FA")) {
					setShowTfa(true);
					// Focus TFA input after state update
					setTimeout(() => tfaRef.current?.focus(), 100);

					Alert.alert("Two-Factor Authentication", "Please enter your 6-digit authentication code");
				} else {
					// Shake animation for error
					containerRef.current?.shake?.(800);
					Alert.alert("Login Failed", result.error || "Invalid credentials");
				}
			}
		} catch (error) {
			console.error("Login error:", error);
			containerRef.current?.shake?.(800);
			Alert.alert("Error", "Network error. Please check your connection and try again.");
		} finally {
			setLoading(false);
		}
	};

	// Handle forgot password
	const handleForgotPassword = () => {
		navigation.navigate("forgotPassword", { email: formData.email });
	};

	// Handle back from TFA
	const handleBackFromTfa = () => {
		setShowTfa(false);
		setFormData(prev => ({ ...prev, tfaCode: "" }));
		setErrors({});

		// Focus password field after animation
		setTimeout(() => passwordRef.current?.focus(), ANIMATION_DURATION);
	};

	// Handle TFA code input (auto-format)
	const handleTfaCodeChange = text => {
		// Only allow digits and limit to 6 characters
		const cleanText = text.replace(/\D/g, "").slice(0, TFA_CODE_LENGTH);
		updateFormData("tfaCode", cleanText);

		// Auto-submit when code is complete
		if (cleanText.length === TFA_CODE_LENGTH && !loading) {
			setTimeout(() => handleLogin(), 500);
		}
	};

	// Dismiss keyboard on outside tap
	const dismissKeyboard = () => {
		Keyboard.dismiss();
	};

	// Check if form is ready for submission
	const canSubmit = showTfa ? formData.tfaCode.length === TFA_CODE_LENGTH && !loading : formData.email.trim() && formData.password && !loading;

	return (
		<TouchableWithoutFeedback onPress={dismissKeyboard}>
			<KeyboardAvoidingView
				style={{
					backgroundColor: "#ffffff",
					flex: 1,
					minHeight: SCREEN_HEIGHT,
				}}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
				<StatusBar
					barStyle="dark-content"
					backgroundColor="#ffffff"
					translucent={false}
				/>

				<ScrollView
					contentContainerStyle={{
						backgroundColor: "#ffffff",
						flexGrow: 1,
						justifyContent: "center",
						paddingHorizontal: 16,
						paddingVertical: 32,
					}}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}>
					<Animatable.View
						ref={containerRef}
						animation="fadeInUp"
						duration={ANIMATION_DURATION}
						style={[
							styles.card,
							{
								backgroundColor: "#ffffff",
							},
						]}>
						{/* Header */}
						<View style={{ alignItems: "center", marginBottom: 32 }}>
							{showTfa && (
								<IconButton
									icon="arrow-left"
									mode="outlined"
									onPress={handleBackFromTfa}
									style={{
										position: "absolute",
										left: -8,
										top: -8,
										backgroundColor: "#f5f5f5",
									}}
								/>
							)}

							<Text
								style={[
									styles.h1,
									{
										textAlign: "center",
										fontSize: 28,
										fontWeight: "bold",
										color: "#1a1a1a",
										marginBottom: 8,
									},
								]}>
								{showTfa ? "Enter 2FA Code" : "Welcome Back"}
							</Text>

							{!showTfa && (
								<Text
									style={{
										textAlign: "center",
										fontSize: 16,
										color: "#666666",
										lineHeight: 22,
									}}>
									Sign in to your DOPE account
								</Text>
							)}
						</View>

						{/* Login Form */}
						{!showTfa && (
							<View>
								{/* Email Input */}
								<TextInput
									ref={emailRef}
									label="Email Address"
									value={formData.email}
									onChangeText={text => updateFormData("email", text)}
									keyboardType="email-address"
									autoCapitalize="none"
									autoComplete="email"
									autoCorrect={false}
									mode="outlined"
									disabled={loading}
									error={!!errors.email}
									style={{ marginBottom: 4 }}
									contentStyle={{ paddingHorizontal: 16 }}
									onSubmitEditing={() => passwordRef.current?.focus()}
									returnKeyType="next"
								/>
								{errors.email && (
									<HelperText
										type="error"
										style={{ marginBottom: 8 }}>
										{errors.email}
									</HelperText>
								)}

								{/* Password Input */}
								<TextInput
									ref={passwordRef}
									label="Password"
									value={formData.password}
									onChangeText={text => updateFormData("password", text)}
									secureTextEntry={!showPassword}
									mode="outlined"
									autoCapitalize="none"
									autoComplete="password"
									autoCorrect={false}
									disabled={loading}
									error={!!errors.password}
									style={{ marginBottom: 4 }}
									contentStyle={{ paddingHorizontal: 16 }}
									onSubmitEditing={handleLogin}
									returnKeyType="done"
									right={
										<TextInput.Icon
											icon={showPassword ? "eye-off" : "eye"}
											onPress={() => setShowPassword(prev => !prev)}
										/>
									}
								/>
								{errors.password && (
									<HelperText
										type="error"
										style={{ marginBottom: 8 }}>
										{errors.password}
									</HelperText>
								)}
							</View>
						)}

						{/* 2FA Form */}
						{showTfa && (
							<View>
								<Text
									style={{
										textAlign: "center",
										fontSize: 14,
										color: "#666666",
										marginBottom: 16,
										lineHeight: 20,
									}}>
									Enter the 6-digit code from your authenticator app
								</Text>

								<TextInput
									ref={tfaRef}
									label="Authentication Code"
									value={formData.tfaCode}
									onChangeText={handleTfaCodeChange}
									keyboardType="numeric"
									mode="outlined"
									disabled={loading}
									error={!!errors.tfaCode}
									style={{
										marginBottom: 4,
										textAlign: "center",
									}}
									contentStyle={{
										textAlign: "center",
										fontSize: 18,
										letterSpacing: 4,
										fontWeight: "bold",
									}}
									maxLength={TFA_CODE_LENGTH}
									autoFocus
									onSubmitEditing={handleLogin}
									returnKeyType="done"
								/>
								{errors.tfaCode && (
									<HelperText
										type="error"
										style={{ marginBottom: 8 }}>
										{errors.tfaCode}
									</HelperText>
								)}

								{/* TFA Progress Indicator */}
								<View
									style={{
										flexDirection: "row",
										justifyContent: "center",
										marginBottom: 16,
									}}>
									{Array.from({ length: TFA_CODE_LENGTH }, (_, index) => (
										<View
											key={index}
											style={{
												width: 8,
												height: 8,
												borderRadius: 4,
												backgroundColor: index < formData.tfaCode.length ? "#007AFF" : "#e0e0e0",
												marginHorizontal: 2,
											}}
										/>
									))}
								</View>
							</View>
						)}

						{/* Submit Button */}
						<Button
							mode="contained"
							onPress={handleLogin}
							disabled={!canSubmit}
							style={{
								marginTop: 16,
								marginBottom: 16,
								borderRadius: 12,
							}}
							labelStyle={{
								fontSize: 16,
								fontWeight: "bold",
							}}>
							{loading ? <ActivityIndicator color="#0069b5" /> : showTfa ? "Verify Code" : "Sign In"}
						</Button>

						{/* Additional Actions */}
						{!showTfa && (
							<View>
								{/* Forgot Password */}
								<Button
									mode="text"
									disabled={loading}
									onPress={handleForgotPassword}
									style={{ marginBottom: 8 }}
									labelStyle={{ color: "#007AFF" }}>
									Forgot Password?
								</Button>

								<Divider style={{ marginVertical: 16, backgroundColor: "#e0e0e0" }} />

								{/* Sign Up */}
								<View style={{ alignItems: "center" }}>
									<Text style={{ color: "#666666", marginBottom: 12 }}>Don't have an account?</Text>
									<Button
										mode="outlined"
										disabled={loading}
										onPress={() => navigation.navigate("signup")}
										style={{
											borderRadius: 12,
											borderColor: "#0069b5",
											width: "100%",
										}}
										labelStyle={{
											color: "#0069b5",
											fontWeight: "bold",
										}}>
										Create Account
									</Button>
								</View>
							</View>
						)}
					</Animatable.View>
				</ScrollView>
			</KeyboardAvoidingView>
		</TouchableWithoutFeedback>
	);
};

export default LoginPage;
