/** @format */

import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import styles from "../css/styles";
import DOPEClient from "../api/config/DOPEClient";

import PostView from "../components/PostView";

const HomePage = () => {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const client = DOPEClient.getInstance();

	useEffect(() => {
		const fetchHomeFeed = async () => {
			try {
				setLoading(true);
				const feed: any = await client.getHomeFeed();
				if (feed) {
					setPosts(feed);
					console.log("Home Feed:", JSON.stringify(feed, null, 2));
				}
			} catch (error: any) {
				console.error(error.message);
			} finally {
				setLoading(false);
			}
		};
		fetchHomeFeed();
	}, [setPosts]);

	if (loading) {
		return (
			<View style={styles.home}>
				<Text>Loading...</Text>
			</View>
		);
	}

	return (
		<View style={styles.home}>
			<Text style={styles.h2}>Feed</Text>
			{posts.map((post: any) => (
				<PostView key={post.id} post={post} />
			))}
		</View>
	);
};

export default HomePage;
