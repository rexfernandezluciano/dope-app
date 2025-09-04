/** @format */
import React, { useState } from "react";
import { View, Text, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { TextInput, Button, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import styles from "../css/styles";
import AuthService from "../services/AuthService";

const LoginPage = () => {
	const navigation = useNavigation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [tfaCode, setTfaCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [showTfa, setShowTfa] = useState(false);

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert("Error", "Please fill in all fields");
			return;
		}

		setLoading(true);
		try {
			const result = await AuthService.login({
				email,
				password,
				tfaCode: tfaCode || undefined,
			});

			if (result.success) {
				Alert.alert("Success", "Login successful!");
				navigation.navigate("Home");
			} else {
				if (result.error?.includes("TFA") || result.error?.includes("2FA")) {
					setShowTfa(true);
				}
				Alert.alert("Error", result.error || "Login failed");
			}
		} catch (error) {
			Alert.alert("Error", "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleForgotPassword = () => {
		navigation.navigate("ForgotPassword");
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // Adjust as needed
		>
			<ScrollView contentContainerStyle={{ backgroundColor: "#ffffff", flexGrow: 1, justifyContent: "center" }}>
				<View style={{ flex: 1, justifyContent: "center", padding: 16 }}>
					<View style={[styles.card]}>
						<Text style={[styles.h1, { textAlign: "center", marginTop: 16, marginBottom: 32 }]}>Login to DOPE</Text>

						<TextInput
							label="Email"
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							mode="outlined"
							contentStyle={{ borderRadius: 16 }}
							style={{ marginBottom: 16 }}
						/>

						<TextInput
							label="Password"
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							mode="outlined"
							autoCapitalize="none"
							contentStyle={{ borderRadius: 16 }}
							style={{ marginBottom: 16 }}
						/>

						{showTfa && (
							<TextInput
								label="2FA Code"
								value={tfaCode}
								onChangeText={setTfaCode}
								keyboardType="numeric"
								contentStyle={{ borderRadius: 16 }}
								style={{ marginBottom: 16 }}
							/>
						)}

						<Button
							mode="contained"
							onPress={handleLogin}
							loading={loading}
							disabled={loading}
							style={{ marginBottom: 16 }}>
							Login
						</Button>

						<Button
							mode="text"
							disabled={loading}
							onPress={handleForgotPassword}>
							Forgot Password?
						</Button>

						<Divider style={{ marginVertical: 16 }} />

						<Button
							mode="outlined"
							disabled={loading}
							onPress={() => navigation.navigate("Signup")}>
							Create Account
						</Button>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default LoginPage;
