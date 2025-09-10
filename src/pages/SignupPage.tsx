/** @format */

import React, { useState, useMemo } from "react";
import { View, Text, Alert, ScrollView, Platform } from "react-native";
import { TextInput, Button, RadioButton, Avatar, ActivityIndicator, HelperText, Menu, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import DateTimePicker from "@react-native-community/datetimepicker";
import styles from "../css/styles";
import Stepper from "../components/stepper/Stepper";
import AuthService from "../services/AuthService";

// Constants
const GENDER_OPTIONS = [
	{ value: "male", label: "Male" },
	{ value: "female", label: "Female" },
	{ value: "non_binary", label: "Non-binary" },
	{ value: "other", label: "Other" },
	{ value: "prefer_not_to_say", label: "Prefer not to say" },
];

const STEPS = ["Name", "Email", "Username", "Password", "Personal Info", "Profile Picture"];
const MIN_AGE = 13;
const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

const SignupPage = () => {
	const navigation = useNavigation();

	// Form state
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		username: "",
		password: "",
		gender: "",
		birthday: new Date(new Date().getFullYear() - 18, 0, 1), // Default to 18 years ago
	});

	// UI state
	const [step, setStep] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [verificationId, setVerificationId] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
	const [showVerification, setShowVerification] = useState(false);

	// Memoized values
	const isValidAge = useMemo(() => {
		const today = new Date();
		const birthDate = new Date(formData.birthday);
		const age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();

		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
			return age - 1 >= MIN_AGE;
		}
		return age >= MIN_AGE;
	}, [formData.birthday]);

	// Form update helper
	const updateFormData = (field, value) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		setError(""); // Clear error when user makes changes
	};

	// Validation functions
	const validateEmail = email => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const validateUsername = username => {
		return username.length >= MIN_USERNAME_LENGTH && USERNAME_REGEX.test(username);
	};

	const validatePassword = password => {
		return password.length >= MIN_PASSWORD_LENGTH;
	};

	// API calls
	const checkAvailability = async (field, value) => {
		if (!value) return { exists: false };

		try {
			const result = field === "username" ? await AuthService.checkUsernameAvailability(value) : await AuthService.checkEmailAvailability(value);
			return { exists: result };
		} catch (error) {
			throw new Error(`Failed to check ${field} availability`);
		}
	};

	// Navigation helpers
	const nextStep = () => {
		if (step < STEPS.length - 1) {
			setStep(prev => prev + 1);
			setError("");
		}
	};

	const prevStep = () => {
		if (step > 0) {
			setStep(prev => prev - 1);
			setError("");
		}
	};

	// Step handlers
	const handleNameStep = () => {
		if (!formData.firstName.trim() || !formData.lastName.trim()) {
			setError("Please enter your full name.");
			return;
		}
		nextStep();
	};

	const handleEmailStep = async () => {
		if (!formData.email.trim()) {
			setError("Please enter your email address.");
			return;
		}

		if (!validateEmail(formData.email)) {
			setError("Please enter a valid email address.");
			return;
		}

		try {
			setLoading(true);
			const emailCheck = await checkAvailability("email", formData.email);

			if (!emailCheck.exists) {
				setError("This email is already registered. Please use a different email or try logging in.");
				return;
			}

			nextStep();
		} catch (err) {
			setError(err.message || "Failed to validate email. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleUsernameStep = async () => {
		if (!validateUsername(formData.username)) {
			setError(`Username must be at least ${MIN_USERNAME_LENGTH} characters and contain only letters, numbers, and underscores.`);
			return;
		}

		try {
			setLoading(true);
			const usernameCheck = await checkAvailability("username", formData.username);

			if (!usernameCheck.exists) {
				setError("This username is already taken. Please choose a different username.");
				return;
			}

			nextStep();
		} catch (err) {
			setError(err.message || "Failed to validate username. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handlePasswordStep = () => {
		if (!validatePassword(formData.password)) {
			setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
			return;
		}
		nextStep();
	};

	const handlePersonalInfoStep = () => {
		if (!formData.gender) {
			setError("Please select your gender.");
			return;
		}

		if (!isValidAge) {
			setError(`You must be at least ${MIN_AGE} years old to create an account.`);
			return;
		}

		nextStep();
	};

	// Date picker handlers
	const onChangeBirthday = (event, selectedDate) => {
		const currentDate = selectedDate || formData.birthday;
		setShowDatePicker(Platform.OS === "ios");
		updateFormData("birthday", currentDate);
	};

	const showDatepicker = () => {
		setShowDatePicker(true);
	};

	// Final signup
	const handleSignup = async () => {
		if (!formData.firstName || !formData.lastName || !formData.email || !formData.username || !formData.password) {
			Alert.alert("Error", "Please fill in all required fields");
			return;
		}

		setLoading(true);
		try {
			const result = await AuthService.register({
				name: `${formData.firstName} ${formData.lastName}`.trim(),
				email: formData.email,
				username: formData.username,
				password: formData.password,
				gender: formData.gender,
				birthday: formData.birthday,
			});

			if (result.success && result.verificationId) {
				setVerificationId(result.verificationId);
				setShowVerification(true);
				Alert.alert("Success", "Please check your email for verification code");
			} else {
				Alert.alert("Error", result.error || "Registration failed");
			}
		} catch (error) {
			Alert.alert("Error", "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	// Render gender selection
	const renderGenderSelection = () => (
		<View>
			<Text style={[styles.label, { marginBottom: 8 }]}>Gender</Text>
			<RadioButton.Group
				onValueChange={value => updateFormData("gender", value)}
				value={formData.gender}>
				{GENDER_OPTIONS.map(option => (
					<View
						key={option.value}
						style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}>
						<RadioButton value={option.value} />
						<Text style={{ flex: 1, marginLeft: 8 }}>{option.label}</Text>
					</View>
				))}
			</RadioButton.Group>
		</View>
	);

	// Render current step
	const renderStep = () => {
		const commonButtonProps = {
			mode: "contained",
			disabled: loading,
			style: {
				marginTop: 16,
				marginBottom: 16,
				borderRadius: 12,
			},
			labelStyle: {
				fontSize: 16,
				fontWeight: "bold",
			},
		};

		const backButtonProps = {
			mode: "outlined",
			onPress: prevStep,
		};

		const LoadingButton = ({ onPress, children, ...props }) => (
			<Button
				onPress={onPress}
				{...commonButtonProps}
				{...props}>
				{loading ? (
					<ActivityIndicator
						size="small"
						color="#fff"
					/>
				) : (
					children
				)}
			</Button>
		);

		switch (step) {
			case 0:
				return (
					<View>
						<TextInput
							label="First Name"
							mode="outlined"
							value={formData.firstName}
							onChangeText={text => updateFormData("firstName", text)}
							disabled={loading}
							style={styles.input}
						/>
						<TextInput
							label="Last Name"
							mode="outlined"
							value={formData.lastName}
							onChangeText={text => updateFormData("lastName", text)}
							disabled={loading}
							style={styles.input}
						/>
						<LoadingButton onPress={handleNameStep}>Next</LoadingButton>
						<Text
							style={styles.loginText}
							onPress={() => navigation.navigate("login")}>
							Already have an account? Login
						</Text>
					</View>
				);

			case 1:
				return (
					<View>
						<TextInput
							label="Email Address"
							mode="outlined"
							value={formData.email}
							onChangeText={text => updateFormData("email", text.toLowerCase().trim())}
							disabled={loading}
							style={styles.input}
							keyboardType="email-address"
							autoCapitalize="none"
						/>
						<LoadingButton onPress={handleEmailStep}>Next</LoadingButton>
						<Button {...backButtonProps}>Back</Button>
					</View>
				);

			case 2:
				return (
					<View>
						<TextInput
							label="Username"
							mode="outlined"
							value={formData.username}
							onChangeText={text => updateFormData("username", text.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
							disabled={loading}
							style={styles.input}
							autoCapitalize="none"
							maxLength={20}
						/>
						<HelperText type="info">Choose a unique username. Only letters, numbers, and underscores allowed.</HelperText>
						<LoadingButton onPress={handleUsernameStep}>Next</LoadingButton>
						<Button {...backButtonProps}>Back</Button>
					</View>
				);

			case 3:
				return (
					<View>
						<TextInput
							label="Password"
							mode="outlined"
							value={formData.password}
							onChangeText={text => updateFormData("password", text)}
							disabled={loading}
							style={styles.input}
							secureTextEntry
						/>
						<HelperText type="info">Password must be at least {MIN_PASSWORD_LENGTH} characters long.</HelperText>
						<LoadingButton onPress={handlePasswordStep}>Next</LoadingButton>
						<Button {...backButtonProps}>Back</Button>
					</View>
				);

			case 4:
				return (
					<View>
						{renderGenderSelection()}

						<Text style={[styles.label, { marginTop: 16 }]}>Birthday</Text>
						<Button
							mode="outlined"
							onPress={showDatepicker}
							style={[styles.input, { justifyContent: "flex-start" }]}>
							{formData.birthday.toLocaleDateString()}
						</Button>

						{showDatePicker && (
							<DateTimePicker
								value={formData.birthday}
								mode="date"
								display="default"
								onChange={onChangeBirthday}
								maximumDate={new Date()}
								minimumDate={new Date(1900, 0, 1)}
							/>
						)}

						<HelperText type="info">You must be at least {MIN_AGE} years old to create an account.</HelperText>

						<LoadingButton onPress={handlePersonalInfoStep}>Next</LoadingButton>
						<Button {...backButtonProps}>Back</Button>
					</View>
				);

			case 5:
				return (
					<View>
						<Text style={styles.label}>Profile Picture (Optional)</Text>
						<View style={{ alignItems: "center", margin: 16 }}>
							<Avatar.Text
								label={`${formData.firstName[0] || ""}${formData.lastName[0] || ""}`}
								size={150}
							/>
						</View>
						<LoadingButton onPress={handleSignup}>Create Account</LoadingButton>
						<Button {...backButtonProps}>Back</Button>
						<Button
							mode="text"
							onPress={handleSignup}
							disabled={loading}
							style={{ marginTop: 8 }}>
							Skip & Create Account
						</Button>
					</View>
				);

			default:
				return null;
		}
	};

	return (
		<ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
			<Animatable.View
				animation="fadeIn"
				duration={300}
				style={[styles.formContainer, styles.card, { padding: 16, flex: 1, justifyContent: "center" }]}>
				<Text style={[styles.h1, { textAlign: "center", marginTop: 16, marginBottom: 16 }]}>Create an Account</Text>
				<Stepper
					currentStep={step}
					steps={STEPS}
					style={{ marginBottom: 16 }}
				/>

				{error ? <Text style={[styles.errorText, { marginBottom: 16 }]}>{error}</Text> : null}

				{renderStep()}
			</Animatable.View>
		</ScrollView>
	);
};

export default SignupPage;
