import React from "react";
import { StyleSheet, Text } from "react-native";
import { SystemContent } from "../../../../types";
import Info from "./Info";
import Mention from "./Mention";
import Reminder from "./Reminder";

interface MessageSystemProps {
  content: SystemContent;
}

const MessageSystem = ({ content }: MessageSystemProps) => {
  if (!content || !content.system) return null;
  const { type } = content.system;
  switch (type) {
    case "info":
      return <Info info={content.system} />;
    case "reminder":
      return <Reminder reminder={content.system} />;
    case "mention":
      return <Mention mention={content.system} />;
    default:
      // @ts-ignore by chance we have a text in the system message
      return !!content?.system?.text ? (
        <Info info={content.system} />
      ) : (
        <Text style={styles.systemMessage}>[Unknown system message]</Text>
      );
  }
};

const styles = StyleSheet.create({
  systemMessage: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginVertical: 10,
  },
});

export default MessageSystem;
