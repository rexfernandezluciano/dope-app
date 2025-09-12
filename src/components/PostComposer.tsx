/** @format */

import React, { useState, useCallback, useEffect } from "react";
import {
        View,
        Text,
        TextInput,
        TouchableOpacity,
        ScrollView,
        StyleSheet,
        Dimensions,
        Alert,
        KeyboardAvoidingView,
        Platform,
} from "react-native";
import { Avatar, IconButton, Button, Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import PostService from "../services/PostService";
import AuthService from "../services/AuthService";
import { CreatePostData } from "../api/interface/post.interface";

interface PostComposerProps {
        onClose: () => void;
        onPostCreated?: (postId: string) => void;
}

interface PollOption {
        text: string;
        id: string;
}

const { width, height } = Dimensions.get("window");

const PostComposer: React.FC<PostComposerProps> = ({ onClose, onPostCreated }) => {
        const [content, setContent] = useState("");
        const [isLoading, setIsLoading] = useState(false);
        const [showPoll, setShowPoll] = useState(false);
        const [pollQuestion, setPollQuestion] = useState("");
        const [pollOptions, setPollOptions] = useState<PollOption[]>([
                { id: "1", text: "" },
                { id: "2", text: "" },
        ]);
        const [pollDuration, setPollDuration] = useState(24); // 24 hours default

        const user = AuthService.user;

        const addPollOption = useCallback(() => {
                if (pollOptions.length < 4) {
                        const newOption: PollOption = {
                                id: (pollOptions.length + 1).toString(),
                                text: "",
                        };
                        setPollOptions(prev => [...prev, newOption]);
                }
        }, [pollOptions.length]);

        const removePollOption = useCallback((id: string) => {
                if (pollOptions.length > 2) {
                        setPollOptions(prev => prev.filter(option => option.id !== id));
                }
        }, [pollOptions.length]);

        const updatePollOption = useCallback((id: string, text: string) => {
                setPollOptions(prev => prev.map(option => (option.id === id ? { ...option, text } : option)));
        }, []);

        const togglePoll = useCallback(() => {
                setShowPoll(prev => !prev);
                if (showPoll) {
                        // Clear poll data when hiding
                        setPollQuestion("");
                        setPollOptions([
                                { id: "1", text: "" },
                                { id: "2", text: "" },
                        ]);
                }
        }, [showPoll]);

        const validatePost = useCallback((): string | null => {
                if (!content.trim() && !showPoll) {
                        return "Please enter some content for your post.";
                }

                if (showPoll) {
                        if (!pollQuestion.trim()) {
                                return "Please enter a poll question.";
                        }
                        const validOptions = pollOptions.filter(option => option.text.trim());
                        if (validOptions.length < 2) {
                                return "Please provide at least 2 poll options.";
                        }
                }

                return null;
        }, [content, showPoll, pollQuestion, pollOptions]);

        const handlePost = useCallback(async () => {
                const validationError = validatePost();
                if (validationError) {
                        Alert.alert("Validation Error", validationError);
                        return;
                }

                setIsLoading(true);

                try {
                        const postData: CreatePostData = {
                                content: content.trim() || undefined,
                                postType: showPoll ? "poll" : "text",
                                privacy: "public",
                        };

                        if (showPoll) {
                                postData.poll = {
                                        question: pollQuestion.trim(),
                                        options: pollOptions
                                                .filter(option => option.text.trim())
                                                .map(option => ({ text: option.text.trim() })),
                                        expiresIn: pollDuration * 60 * 60 * 1000, // Convert hours to milliseconds
                                        allowMultiple: false,
                                };
                        }

                        const response = await PostService.createPost(postData);

                        if (response.success && response.data) {
                                Alert.alert("Success", "Your post has been created!", [
                                        {
                                                text: "OK",
                                                onPress: () => {
                                                        onPostCreated?.(response.data!.id);
                                                        onClose();
                                                },
                                        },
                                ]);
                        } else {
                                Alert.alert("Error", response.error || "Failed to create post. Please try again.");
                        }
                } catch (error) {
                        console.error("Error creating post:", error);
                        Alert.alert("Error", "An unexpected error occurred. Please try again.");
                } finally {
                        setIsLoading(false);
                }
        }, [content, showPoll, pollQuestion, pollOptions, pollDuration, validatePost, onPostCreated, onClose]);

        const isPostButtonDisabled = isLoading || (!content.trim() && !showPoll) || (showPoll && !pollQuestion.trim());

        return (
                <SafeAreaView style={styles.container}>
                        <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                                {/* Header */}
                                <View style={styles.header}>
                                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                                <IconButton icon="close" size={24} iconColor="#000" />
                                        </TouchableOpacity>
                                        <Text style={styles.headerTitle}>New thread</Text>
                                        <View style={styles.headerRight}>
                                                <IconButton icon="content-save-outline" size={24} iconColor="#000" />
                                                <IconButton icon="dots-horizontal" size={24} iconColor="#000" />
                                        </View>
                                </View>

                                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                        {/* User Info */}
                                        <View style={styles.userSection}>
                                                <Avatar.Image size={40} source={{ uri: user?.photoURL || "https://via.placeholder.com/40" }} />
                                                <View style={styles.userInfo}>
                                                        <Text style={styles.username}>{user?.username || "user"}</Text>
                                                        <Text style={styles.userHandle}>@{user?.username || "user"}</Text>
                                                </View>
                                        </View>

                                        {/* Main Content Input */}
                                        <View style={styles.inputSection}>
                                                <TextInput
                                                        style={styles.mainInput}
                                                        placeholder="What's new?"
                                                        placeholderTextColor="#8E8E93"
                                                        multiline
                                                        value={content}
                                                        onChangeText={setContent}
                                                        textAlignVertical="top"
                                                />
                                        </View>

                                        {/* Poll Section */}
                                        {showPoll && (
                                                <Card elevation={0} style={styles.pollContainer}>
                                                        <Card.Content>
                                                                <Text style={styles.pollTitle}>Create a poll</Text>
                                                                <TextInput
                                                                        style={styles.pollQuestionInput}
                                                                        placeholder="Ask a question..."
                                                                        placeholderTextColor="#8E8E93"
                                                                        value={pollQuestion}
                                                                        onChangeText={setPollQuestion}
                                                                />

                                                                {pollOptions.map((option, index) => (
                                                                        <View key={option.id} style={styles.pollOptionContainer}>
                                                                                <TextInput
                                                                                        style={styles.pollOptionInput}
                                                                                        placeholder={`Option ${index + 1}`}
                                                                                        placeholderTextColor="#8E8E93"
                                                                                        value={option.text}
                                                                                        onChangeText={text => updatePollOption(option.id, text)}
                                                                                />
                                                                                {pollOptions.length > 2 && (
                                                                                        <TouchableOpacity
                                                                                                onPress={() => removePollOption(option.id)}
                                                                                                style={styles.removeOptionButton}>
                                                                                                <IconButton icon="close" size={20} iconColor="#FF3B30" />
                                                                                        </TouchableOpacity>
                                                                                )}
                                                                        </View>
                                                                ))}

                                                                {pollOptions.length < 4 && (
                                                                        <TouchableOpacity onPress={addPollOption} style={styles.addOptionButton}>
                                                                                <IconButton icon="plus" size={20} iconColor="#007AFF" />
                                                                                <Text style={styles.addOptionText}>Add option</Text>
                                                                        </TouchableOpacity>
                                                                )}

                                                                <View style={styles.pollDurationContainer}>
                                                                        <Text style={styles.pollDurationLabel}>Poll duration:</Text>
                                                                        <View style={styles.durationButtons}>
                                                                                {[1, 6, 24, 72, 168].map(hours => (
                                                                                        <TouchableOpacity
                                                                                                key={hours}
                                                                                                style={[
                                                                                                        styles.durationButton,
                                                                                                        pollDuration === hours && styles.durationButtonActive,
                                                                                                ]}
                                                                                                onPress={() => setPollDuration(hours)}>
                                                                                                <Text
                                                                                                        style={[
                                                                                                                styles.durationButtonText,
                                                                                                                pollDuration === hours && styles.durationButtonTextActive,
                                                                                                        ]}>
                                                                                                        {hours === 1 ? "1h" : hours === 6 ? "6h" : hours === 24 ? "1d" : hours === 72 ? "3d" : "1w"}
                                                                                                </Text>
                                                                                        </TouchableOpacity>
                                                                                ))}
                                                                        </View>
                                                                </View>
                                                        </Card.Content>
                                                </Card>
                                        )}

                                        {/* Action Buttons */}
                                        <View style={styles.actionButtons}>
                                                <TouchableOpacity style={styles.actionButton}>
                                                        <IconButton icon="image-outline" size={24} iconColor="#8E8E93" />
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.actionButton}>
                                                        <IconButton icon="camera-outline" size={24} iconColor="#8E8E93" />
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.actionButton}>
                                                        <IconButton icon="gif" size={24} iconColor="#8E8E93" />
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.actionButton, showPoll && styles.actionButtonActive]} onPress={togglePoll}>
                                                        <IconButton icon="poll" size={24} iconColor={showPoll ? "#007AFF" : "#8E8E93"} />
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.actionButton}>
                                                        <IconButton icon="map-marker-outline" size={24} iconColor="#8E8E93" />
                                                </TouchableOpacity>
                                        </View>
                                </ScrollView>

                                {/* Bottom Bar */}
                                <View style={styles.bottomBar}>
                                        <Text style={styles.privacyText}>Anyone can reply & quote</Text>
                                        <Button
                                                mode="contained"
                                                onPress={handlePost}
                                                disabled={isPostButtonDisabled}
                                                loading={isLoading}
                                                style={[styles.postButton, isPostButtonDisabled && styles.postButtonDisabled]}
                                                labelStyle={styles.postButtonText}>
                                                Post
                                        </Button>
                                </View>
                        </KeyboardAvoidingView>
                </SafeAreaView>
        );
};

const styles = StyleSheet.create({
        container: {
                flex: 1,
                backgroundColor: "#FFFFFF",
        },
        keyboardContainer: {
                flex: 1,
        },
        header: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#E5E5E7",
        },
        closeButton: {
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
        },
        headerTitle: {
                fontSize: 17,
                fontWeight: "600",
                color: "#000",
        },
        headerRight: {
                flexDirection: "row",
        },
        content: {
                flex: 1,
                paddingHorizontal: 16,
        },
        userSection: {
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
        },
        userInfo: {
                marginLeft: 12,
        },
        username: {
                fontSize: 16,
                fontWeight: "600",
                color: "#000",
        },
        userHandle: {
                fontSize: 14,
                color: "#8E8E93",
                marginTop: 2,
        },
        inputSection: {
                marginBottom: 20,
        },
        mainInput: {
                fontSize: 16,
                color: "#000",
                minHeight: 100,
                textAlignVertical: "top",
                lineHeight: 22,
        },
        pollContainer: {
                marginBottom: 20,
                backgroundColor: "#F8F9FA",
        },
        pollTitle: {
                fontSize: 16,
                fontWeight: "600",
                color: "#000",
                marginBottom: 12,
        },
        pollQuestionInput: {
                borderWidth: 1,
                borderColor: "#E5E5E7",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                marginBottom: 12,
                backgroundColor: "#FFFFFF",
        },
        pollOptionContainer: {
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
        },
        pollOptionInput: {
                flex: 1,
                borderWidth: 1,
                borderColor: "#E5E5E7",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: "#FFFFFF",
        },
        removeOptionButton: {
                marginLeft: 8,
        },
        addOptionButton: {
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
        },
        addOptionText: {
                fontSize: 16,
                color: "#007AFF",
                marginLeft: 4,
        },
        pollDurationContainer: {
                marginTop: 16,
        },
        pollDurationLabel: {
                fontSize: 14,
                color: "#8E8E93",
                marginBottom: 8,
        },
        durationButtons: {
                flexDirection: "row",
                flexWrap: "wrap",
        },
        durationButton: {
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#E5E5E7",
                marginRight: 8,
                marginBottom: 8,
        },
        durationButtonActive: {
                backgroundColor: "#007AFF",
                borderColor: "#007AFF",
        },
        durationButtonText: {
                fontSize: 14,
                color: "#8E8E93",
        },
        durationButtonTextActive: {
                color: "#FFFFFF",
        },
        actionButtons: {
                flexDirection: "row",
                paddingVertical: 16,
        },
        actionButton: {
                marginRight: 8,
        },
        actionButtonActive: {
                backgroundColor: "#E3F2FD",
                borderRadius: 20,
        },
        addToThreadButton: {
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
        },
        addToThreadText: {
                fontSize: 16,
                color: "#8E8E93",
                marginLeft: 8,
        },
        bottomBar: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: "#E5E5E7",
                backgroundColor: "#FFFFFF",
        },
        privacyText: {
                fontSize: 14,
                color: "#8E8E93",
        },
        postButton: {
                backgroundColor: "#007AFF",
                borderRadius: 20,
                paddingHorizontal: 24,
        },
        postButtonDisabled: {
                backgroundColor: "#E5E5E7",
        },
        postButtonText: {
                fontSize: 16,
                fontWeight: "600",
                color: "#FFFFFF",
        },
});

export default React.memo(PostComposer);