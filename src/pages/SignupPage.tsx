
/** @format */

import React, { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { TextInput, Button, Card, RadioButton, Divider } from "react-native-paper";
import styles from "../css/styles";
import AuthService from "../services/AuthService";

const SignupPage = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    photoURL: "",
    coverPhotoURL: "",
    gender: "prefer_not_to_say",
    birthday: "",
  });
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const checkAvailability = async (field: "username" | "email", value: string) => {
    if (!value) return;
    
    const result = field === "username" 
      ? await AuthService.checkUsernameAvailability(value)
      : await AuthService.checkEmailAvailability(value);
    
    if (!result.available) {
      Alert.alert("Error", `${field} is already taken`);
    }
  };

  const handleSignup = async () => {
    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.register({
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        photoURL: formData.photoURL || undefined,
        coverPhotoURL: formData.coverPhotoURL || undefined,
        gender: formData.gender as any,
        birthday: formData.birthday || undefined,
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

  const handleVerification = async () => {
    if (!verificationCode) {
      Alert.alert("Error", "Please enter verification code");
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.verifyEmail(
        formData.email,
        verificationCode,
        verificationId
      );

      if (result.success) {
        Alert.alert("Success", "Account verified! Please login.");
        navigation.navigate("Login");
      } else {
        Alert.alert("Error", result.error || "Verification failed");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <ScrollView style={styles.home} contentContainerStyle={{ padding: 16 }}>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Card style={{ padding: 16 }}>
            <Text style={[styles.h2, { textAlign: "center", marginBottom: 16 }]}>
              Verify Your Email
            </Text>
            <Text style={{ textAlign: "center", marginBottom: 32 }}>
              We've sent a verification code to {formData.email}
            </Text>

            <TextInput
              label="Verification Code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              style={{ marginBottom: 16 }}
            />

            <Button
              mode="contained"
              onPress={handleVerification}
              loading={loading}
            >
              Verify Email
            </Button>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.home} contentContainerStyle={{ padding: 16 }}>
      <Card style={{ padding: 16 }}>
        <Text style={[styles.h1, { textAlign: "center", marginBottom: 32 }]}>
          Join DOPE Network
        </Text>

        <TextInput
          label="Full Name *"
          value={formData.name}
          onChangeText={(value) => handleInputChange("name", value)}
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Email *"
          value={formData.email}
          onChangeText={(value) => handleInputChange("email", value)}
          onBlur={() => checkAvailability("email", formData.email)}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Username *"
          value={formData.username}
          onChangeText={(value) => handleInputChange("username", value)}
          onBlur={() => checkAvailability("username", formData.username)}
          autoCapitalize="none"
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Password *"
          value={formData.password}
          onChangeText={(value) => handleInputChange("password", value)}
          secureTextEntry
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Confirm Password *"
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange("confirmPassword", value)}
          secureTextEntry
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Profile Photo URL (optional)"
          value={formData.photoURL}
          onChangeText={(value) => handleInputChange("photoURL", value)}
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Cover Photo URL (optional)"
          value={formData.coverPhotoURL}
          onChangeText={(value) => handleInputChange("coverPhotoURL", value)}
          style={{ marginBottom: 16 }}
        />

        <TextInput
          label="Birthday (YYYY-MM-DD) (optional)"
          value={formData.birthday}
          onChangeText={(value) => handleInputChange("birthday", value)}
          placeholder="1990-01-01"
          style={{ marginBottom: 16 }}
        />

        <Text style={[styles.h5, { marginBottom: 8 }]}>Gender</Text>
        <RadioButton.Group
          onValueChange={(value) => handleInputChange("gender", value)}
          value={formData.gender}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <RadioButton value="male" />
            <Text>Male</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <RadioButton value="female" />
            <Text>Female</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <RadioButton value="non_binary" />
            <Text>Non-binary</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <RadioButton value="prefer_not_to_say" />
            <Text>Prefer not to say</Text>
          </View>
        </RadioButton.Group>

        <Button
          mode="contained"
          onPress={handleSignup}
          loading={loading}
          style={{ marginTop: 16, marginBottom: 16 }}
        >
          Create Account
        </Button>

        <Divider style={{ marginVertical: 16 }} />

        <Button
          mode="outlined"
          onPress={() => navigation.navigate("Login")}
        >
          Already have an account? Login
        </Button>
      </Card>
    </ScrollView>
  );
};

export default SignupPage;
