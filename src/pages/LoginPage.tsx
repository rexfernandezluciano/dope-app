/** @format */

import React, { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { TextInput, Button, Card, Divider } from "react-native-paper";
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
    <ScrollView
      contentContainerStyle={
        (styles.home,
        { alignItems: "center", justifyContent: "center" })
      }
    >
      <View style={{ flex: 1 }}>
        <Card style={{ padding: 16, width: "100%", maxWidth: 400, marginTop: 32, marginBottom: 32,"}}>
          <Text style={[styles.h1, { textAlign: "center", marginBottom: 32 }]}>
            Login to DOPE
          </Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginBottom: 16 }}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ marginBottom: 16 }}
          />

          {showTfa && (
            <TextInput
              label="2FA Code"
              value={tfaCode}
              onChangeText={setTfaCode}
              keyboardType="numeric"
              style={{ marginBottom: 16 }}
            />
          )}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            style={{ marginBottom: 16 }}
          >
            Login
          </Button>

          <Button mode="text" onPress={handleForgotPassword}>
            Forgot Password?
          </Button>

          <Divider style={{ marginVertical: 16 }} />

          <Button mode="outlined" onPress={() => navigation.navigate("Signup")}>
            Create Account
          </Button>
        </Card>
      </View>
    </ScrollView>
  );
};

export default LoginPage;
