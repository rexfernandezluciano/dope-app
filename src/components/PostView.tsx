import { View, Text } from "react-native";
import { List, Avatar } from "react-native-paper";
import styles from "../css/styles";

const PostView = ({ post }) => {
  return (
    <View>
      <List.Item
        title={post.author.name}
        description={post.content}
        left={() => <Avatar.Image size={35} source={post.author.photoURL} />}
      />
    </View>
  );
};

export default PostView;
