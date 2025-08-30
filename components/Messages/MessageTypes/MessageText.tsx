import React from 'react';
import { StyleSheet } from 'react-native';
import ParsedText from 'react-native-parsed-text';
import { TextContent } from '../../../types';

interface MessageTextProps {
  content: TextContent;
}

/**
 * MessageText - Renders text content inside a message bubble
 * 
 * Handles styling and formatting of text messages
 */
const MessageText = ({ content }: MessageTextProps) => {
  return (
    <ParsedText
      style={markdownStyles.text}
      parse={[
        { pattern: boldPattern, style: markdownStyles.bold },
        { pattern: italicPattern, style: markdownStyles.italic },
        { pattern: strikethroughPattern, style: markdownStyles.strikethrough },
        { pattern: deeplinkUrlPattern, style: markdownStyles.url },
        { type: 'url', style: markdownStyles.url },
        { type: 'email', style: markdownStyles.email },
        { pattern: phoneNumberPattern3, style: markdownStyles.phone },
        { pattern: phoneNumberPattern2, style: markdownStyles.phone },
        { pattern: phoneNumberPattern, style: markdownStyles.phone },
      ]}
      childrenProps={{ allowFontScaling: false }}
    >
      {content?.text}
    </ParsedText>
  );
};

// WhatsApp-style markdown styles
const markdownStyles = StyleSheet.create({
  text: {
    fontSize: 16,
  },
  bold: {
    fontWeight: "700", 
  },
  italic: {
    fontStyle: "italic",
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  url: {
    color: "#53bdeb", // WhatsApp link blue
    textDecorationLine: "none", // WhatsApp doesn't underline links
  },
  phone: {
    color: "#53bdeb", // WhatsApp link blue
    textDecorationLine: "none",
  },
  email: {
    color: "#53bdeb", // WhatsApp link blue
    textDecorationLine: "none",
  },
});

// Patterns for WhatsApp-style markdown
const boldPattern = /(?:\*)([^*<\n]+)(?:\*)/g;
const italicPattern = /_(\S(.*?\S)?)\_/gm;
const strikethroughPattern = /~((?:\[.*?\]|<.*?>(?:.*?<.*?>)?|`.*?`|.)*?)~/gm;
const phoneNumberPattern =
  /(\+\d{1,3}\s?)?(\d{12}|\d{5}\s?\d{6}|\d{5}\s?\d{5})|[\+]?[(]?\d{3}[)]?[-\s\.]?\d{3}[-\s\.]?\d{4,7}/;
const phoneNumberPattern2 =
  /(\+\d{1,3}\s?)?(\d{4}\s?\d{6}|\d{5}\s?\d{5}|\d{2}\s?\d{4}\s?\d{6})|[\+]?[(]?\d{3}[)]?[-\s\.]?\d{3}[-\s\.]?\d{4,7}/;
// New pattern for phone numbers with dashes, spaces, or dots
const phoneNumberPattern3 = /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?){2,3}\d{3,4}/g;
// Generic pattern for all deeplinks (any scheme://...)
const deeplinkUrlPattern = /[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/\S+/g;

export default MessageText; 