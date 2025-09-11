/** @format */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const ChatPage: React.FC = () => {
        return (
                <SafeAreaView style={styles.container}>
                        <View style={styles.header}>
                                <Text style={styles.headerTitle}>Messages</Text>
                                <IconButton icon="pencil-outline" size={24} onPress={() => {}} />
                        </View>
                        
                        <View style={styles.content}>
                                <IconButton icon="message-outline" size={64} iconColor="#9E9E9E" />
                                <Text style={styles.emptyTitle}>No messages yet</Text>
                                <Text style={styles.emptySubtext}>
                                        Start a conversation with someone to see your messages here.
                                </Text>
                        </View>
                </SafeAreaView>
        );
};

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: "#FFFFFF",
        },
        header: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#E5E5E7",
        },
        headerTitle: {
                fontSize: 20,
                fontWeight: "700",
                color: "#000",
        },
        content: {
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 40,
        },
        emptyTitle: {
                fontSize: 18,
                fontWeight: "600",
                color: "#000",
                marginTop: 16,
                textAlign: "center",
        },
        emptySubtext: {
                fontSize: 14,
                color: "#8E8E93",
                marginTop: 8,
                textAlign: "center",
                lineHeight: 20,
        },
});

export default React.memo(ChatPage);