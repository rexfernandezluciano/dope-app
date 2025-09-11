/** @format */

import React, { useState, useRef } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StatusBar, Dimensions } from "react-native";
import { TextInput, Button, HelperText, IconButton } from "react-native-paper";
import * as Animatable from "react-native-animatable";
import { DOPEClient } from "../services/DOPEClient";
import { validateEmail } from "../utils/validation";
import { AlertService } from "../services/AlertService";

// Get screen dimensions
const SCREEN_HEIGHT = Dimensions.get("window").height;
const ANIMATION_DURATION = 600;

interface ForgotPasswordPageProps {
        navigation: any;
        route?: {
                params?: {
                        email?: string;
                };
        };
}

interface ForgotPasswordResponse {
        message: string;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ navigation, route }) => {
        // Form state
        const [email, setEmail] = useState(route?.params?.email || "");
        const [loading, setLoading] = useState(false);
        const [emailSent, setEmailSent] = useState(false);
        const [error, setError] = useState("");

        // Refs
        const emailRef = useRef<any>(null);
        const containerRef = useRef<any>(null);

        // Handle email input change
        const handleEmailChange = (text: string) => {
                setEmail(text);
                if (error) setError(""); // Clear error when user starts typing
        };

        // Validate email
        const validateForm = () => {
                const emailError = validateEmail(email);
                if (emailError) {
                        setError(emailError);
                        return false;
                }
                setError("");
                return true;
        };

        // Handle forgot password submission
        const handleSubmit = async () => {
                if (!validateForm()) return;

                setLoading(true);
                try {
                        const client = DOPEClient.getInstance();
                        const response = await client.post<ForgotPasswordResponse>(
                                "/v1/auth/forgot-password",
                                { email: email.trim() }
                        );

                        if (response.success && response.data) {
                                setEmailSent(true);
                                AlertService.showSuccess(
                                        response.data.message || "Password reset instructions have been sent to your email."
                                );
                        } else {
                                throw new Error(response.error || "Failed to send reset email");
                        }
                } catch (error: any) {
                        console.error("Forgot password error:", error);
                        const errorMessage = error.message || "Failed to send reset email. Please try again.";
                        setError(errorMessage);
                        AlertService.showError(errorMessage);
                } finally {
                        setLoading(false);
                }
        };

        // Handle back navigation
        const handleBack = () => {
                navigation.goBack();
        };

        // Handle return to login
        const handleReturnToLogin = () => {
                navigation.navigate("login");
        };

        return (
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
                                        style={{
                                                backgroundColor: "#ffffff",
                                                borderRadius: 16,
                                                padding: 24,
                                                marginHorizontal: 8,
                                        }}>
                                        {/* Header */}
                                        <View style={{ alignItems: "center", marginBottom: 32 }}>
                                                <IconButton
                                                        icon="arrow-left"
                                                        mode="outlined"
                                                        onPress={handleBack}
                                                        style={{
                                                                position: "absolute",
                                                                left: -8,
                                                                top: -8,
                                                                backgroundColor: "#f5f5f5",
                                                        }}
                                                />

                                                <Text
                                                        style={{
                                                                textAlign: "center",
                                                                fontSize: 28,
                                                                fontWeight: "bold",
                                                                color: "#1a1a1a",
                                                                marginBottom: 8,
                                                        }}>
                                                        {emailSent ? "Check Your Email" : "Forgot Password?"}
                                                </Text>

                                                <Text
                                                        style={{
                                                                textAlign: "center",
                                                                fontSize: 16,
                                                                color: "#666666",
                                                                lineHeight: 22,
                                                        }}>
                                                        {emailSent
                                                                ? "We've sent password reset instructions to your email address."
                                                                : "Enter your email address and we'll send you instructions to reset your password."}
                                                </Text>
                                        </View>

                                        {!emailSent ? (
                                                <View>
                                                        {/* Email Input */}
                                                        <TextInput
                                                                ref={emailRef}
                                                                label="Email Address"
                                                                value={email}
                                                                onChangeText={handleEmailChange}
                                                                keyboardType="email-address"
                                                                autoCapitalize="none"
                                                                autoComplete="email"
                                                                autoCorrect={false}
                                                                mode="outlined"
                                                                disabled={loading}
                                                                error={!!error}
                                                                style={{ marginBottom: 4 }}
                                                                contentStyle={{ paddingHorizontal: 16 }}
                                                                onSubmitEditing={handleSubmit}
                                                                returnKeyType="send"
                                                        />
                                                        {error && (
                                                                <HelperText
                                                                        type="error"
                                                                        style={{ marginBottom: 8 }}>
                                                                        {error}
                                                                </HelperText>
                                                        )}

                                                        {/* Submit Button */}
                                                        <Button
                                                                mode="contained"
                                                                disabled={!email.trim() || loading}
                                                                loading={loading}
                                                                onPress={handleSubmit}
                                                                style={{
                                                                        borderRadius: 12,
                                                                        marginTop: 16,
                                                                        backgroundColor: "#0069b5",
                                                                }}
                                                                labelStyle={{
                                                                        color: "#ffffff",
                                                                        fontWeight: "bold",
                                                                        fontSize: 16,
                                                                        paddingVertical: 8,
                                                                }}>
                                                                {loading ? "Sending..." : "Send Reset Instructions"}
                                                        </Button>
                                                </View>
                                        ) : (
                                                <View>
                                                        {/* Success State */}
                                                        <View style={{ alignItems: "center", marginBottom: 24 }}>
                                                                <IconButton
                                                                        icon="email-check"
                                                                        size={64}
                                                                        iconColor="#0069b5"
                                                                        style={{ marginBottom: 16 }}
                                                                />
                                                                <Text
                                                                        style={{
                                                                                textAlign: "center",
                                                                                fontSize: 16,
                                                                                color: "#666666",
                                                                                lineHeight: 22,
                                                                        }}>
                                                                        If an account with{" "}
                                                                        <Text style={{ fontWeight: "600", color: "#1a1a1a" }}>
                                                                                {email}
                                                                        </Text>{" "}
                                                                        exists, you'll receive reset instructions shortly.
                                                                </Text>
                                                        </View>

                                                        {/* Return to Login Button */}
                                                        <Button
                                                                mode="contained"
                                                                onPress={handleReturnToLogin}
                                                                style={{
                                                                        borderRadius: 12,
                                                                        backgroundColor: "#0069b5",
                                                                }}
                                                                labelStyle={{
                                                                        color: "#ffffff",
                                                                        fontWeight: "bold",
                                                                        fontSize: 16,
                                                                        paddingVertical: 8,
                                                                }}>
                                                                Return to Login
                                                        </Button>

                                                        {/* Resend Button */}
                                                        <Button
                                                                mode="outlined"
                                                                onPress={() => setEmailSent(false)}
                                                                style={{
                                                                        borderRadius: 12,
                                                                        borderColor: "#0069b5",
                                                                        marginTop: 12,
                                                                }}
                                                                labelStyle={{
                                                                        color: "#0069b5",
                                                                        fontWeight: "bold",
                                                                }}>
                                                                Send Another Email
                                                        </Button>
                                                </View>
                                        )}
                                </Animatable.View>
                        </ScrollView>
                </KeyboardAvoidingView>
        );
};

export default ForgotPasswordPage;