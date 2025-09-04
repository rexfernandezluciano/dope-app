/** @format */

import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { PaperProvider } from "react-native-paper";

import NavigationView from "./components/navs/NavigationView";
import HomePage from "./pages/HomePage"

const App = () => {
	const [activeTab, setActiveTab] = useState(0);

	const handleTabChange = (index: number) => {
		setActiveTab(index);
		console.log(`Tab ${index} selected`);
	};

	const renderContent = () => {
		switch (activeTab) {
			case 0:
				return <HomePage />;
			case 1:
				return <Text style={{ padding: 20 }}>Following Content</Text>;
			case 2:
				return <Text style={{ padding: 20 }}>Trending Content</Text>;
			default:
				return <HomePage />;
		}
	};

	return (
		<PaperProvider>
			<StatusBar style="auto" />
			<NavigationView
				logo="DOPE"
				avatar={{ uri: "https://i.pravatar.cc/150?img=3" }}
				onTabChange={handleTabChange}>
				{renderContent()}
			</NavigationView>
		</PaperProvider>
	);
};

export default App;
