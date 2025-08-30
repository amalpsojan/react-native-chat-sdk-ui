# Chat SDK (React Native · Expo)

A reusable, Expo-friendly chat UI SDK focused purely on UI and local interactions (no backend). It ships with WhatsApp-like message bubbles, long-press actions, reply quoting, voice notes, native document opening, and robust audio playback.

## ✨ Features

- Message types: Text, Image, Video, Audio (voice notes), Document, Sticker, System
- WhatsApp-like bubbles with grouping, timestamps, and edited indicator
- Long-press actions: Reply, Copy, Edit (own text), Delete (own), Retry (failed), Download (media), Share (media)
- Reply system with in-bubble quoted header and tapping to jump to original
- Voice notes (record + send) using `expo-audio`; exclusive playback (only one plays at a time)
- Native document open with `expo-intent-launcher` (Android) and `expo-sharing` (iOS)
- Gesture-driven long press (react-native-gesture-handler)
- Safe area aware bottom sheet for actions
- Virtualized list via `@shopify/flash-list`

## 📦 Requirements (Expo Managed)

Install these runtime dependencies in your host app (recommended commands shown):

- Core
  - `react-native-gesture-handler`
  - `react-native-reanimated`
  - `react-native-safe-area-context`
  - `@shopify/flash-list`

- Media & OS integrations
  - `expo-audio` (playback + recording)
  - `expo-file-system` (download/cache files)
  - `expo-intent-launcher` (open files on Android)
  - `expo-sharing` (share/open files on iOS)
  - `expo-clipboard` (copy to clipboard)

Use Expo installer for managed projects:

```
npx expo install react-native-gesture-handler react-native-reanimated react-native-safe-area-context @shopify/flash-list expo-audio expo-file-system expo-intent-launcher expo-sharing expo-clipboard
```

Notes:
- Wrap your app in `GestureHandlerRootView`.
- Reanimated must be configured per Expo docs if not already.

## 🚀 Quick Start

```tsx
import React, { useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatSDK } from "@/components"; // re-export of src/components/chat-sdk
import { Message, MessageType } from "@/components/chat-sdk/types";

function ChatScreen() {
  const insets = useSafeAreaInsets();
  const currentUserId = "user-1";

  const initial: Message[] = [
    // Text (received)
    {
      id: "m-text-1",
      from: "user-2",
      isReceived: true,
      type: MessageType.TEXT,
      content: { text: "Hey! 👋" },
      createdAt: Date.now() - 60_000,
      status: "delivered",
    },
    // Text (own)
    {
      id: "m-text-2",
      from: currentUserId,
      isReceived: false,
      type: MessageType.TEXT,
      content: { text: "Hi there!" },
      createdAt: Date.now() - 50_000,
      status: "read",
    },
    // Image
    {
      id: "m-img",
      from: "user-2",
      isReceived: true,
      type: MessageType.IMAGE,
      content: {
        image: "https://sample-videos.com/img/Sample-jpg-image-1mb.jpg",
        caption: "A sample JPG image",
      },
      createdAt: Date.now() - 45_000,
      status: "sent",
    },
    // Video
    {
      id: "m-vid",
      from: "user-2",
      isReceived: true,
      type: MessageType.VIDEO,
      content: {
        video: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
        caption: "Sample MP4 video",
      },
      createdAt: Date.now() - 40_000,
      status: "delivered",
    },
    // Audio (voice note)
    {
      id: "m-aud",
      from: currentUserId,
      isReceived: false,
      type: MessageType.AUDIO,
      content: {
        audio: "https://sample-videos.com/audio/mp3/crowd-cheering.mp3",
        voice: true,
      },
      createdAt: Date.now() - 35_000,
      status: "read",
    },
    // Document
    {
      id: "m-doc",
      from: "user-2",
      isReceived: true,
      type: MessageType.DOCUMENT,
      content: {
        document: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileName: "dummy.pdf",
        caption: "Sample PDF document",
      },
      createdAt: Date.now() - 30_000,
      status: "sent",
    },
    // Sticker
    {
      id: "m-sticker",
      from: currentUserId,
      isReceived: false,
      type: MessageType.STICKER,
      content: {
        sticker: "https://raw.githubusercontent.com/expo/expo/main/.github/resources/banner.png",
      },
      createdAt: Date.now() - 25_000,
      status: "delivered",
    },
    // System (info)
    {
      id: "m-sys",
      from: "system",
      isReceived: true,
      type: MessageType.SYSTEM,
      content: { system: { type: "info", text: "This is an informational system message." } },
      createdAt: Date.now() - 20_000,
      status: "sent",
    },
    // Reply example (text replying to the image above)
    {
      id: "m-reply",
      from: currentUserId,
      isReceived: false,
      type: MessageType.TEXT,
      content: { text: "Looks good to me." },
      referenceMessage: {
        referenceMessageId: "m-img",
        type: MessageType.IMAGE,
        content: {
          image: "https://sample-videos.com/img/Sample-jpg-image-1mb.jpg",
          caption: "A sample JPG image",
        },
      },
      createdAt: Date.now() - 10_000,
      status: "sent",
    },
  ];

  const [messages, setMessages] = useState<Message[]>(initial);

  const handleSend = (partial: Partial<Message>) => {
    const now = Date.now();
    const newMsg: Message = {
      id: now.toString(),
      from: currentUserId,
      isReceived: false,
      type: partial.type || MessageType.TEXT,
      content: partial.content || { text: "" },
      createdAt: now,
      status: "sent",
      referenceMessage: partial.referenceMessage,
    } as Message;
    setMessages(prev => [newMsg, ...prev]);
  };

  return (
    <View style={{ flex: 1, marginBottom: insets.bottom }}>
      <ChatSDK
        messages={messages}
        currentUserId={currentUserId}
        onSendMessage={handleSend}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ChatScreen />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
```

Wrap your root (if not already) with `GestureHandlerRootView`.

## 🧩 Component API

The main entry is `ChatSDK` (aka `ChatWindow`). Props:

```ts
export interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (message: Partial<Message>) => void; // Provide id/from/createdAt/status yourself
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onRetryMessage?: (message: Message) => void;
  onLoadEarlier?: () => void; // for pagination/infinite scroll
  messageRenderers?: { /* override default renderers per MessageType if needed */ };
  onReplyMessage?: (message: Message) => void; // optional callback when user taps Reply in context menu
}
```

Notes:
- `onSendMessage` receives a partial Message (type + content [+ optional referenceMessage]); your app should create the full `Message` with id/from/createdAt/status and prepend/append it to the `messages` array.
- The input toolbar supports text sending and voice note recording. Press mic to record; press send to submit the voice note.

## 📨 Sending Messages

Send text:

```ts
onSendMessage({
  type: MessageType.TEXT,
  content: { text: "Hello!" },
});
```

Send image:

```ts
onSendMessage({
  type: MessageType.IMAGE,
  content: { image: "https://example.com/photo.jpg", caption: "A photo" },
});
```

Send video:

```ts
onSendMessage({
  type: MessageType.VIDEO,
  content: { video: "https://example.com/video.mp4", caption: "A video" },
});
```

Send document:

```ts
onSendMessage({
  type: MessageType.DOCUMENT,
  content: { document: "https://example.com/file.pdf", fileName: "file.pdf", caption: "PDF" },
});
```

Send voice note / audio:

- The input toolbar records with `expo-audio` and submits automatically as:

```ts
{
  type: MessageType.AUDIO,
  content: { audio: "file:///.../recording.m4a", voice: true },
}
```

Reply to a message:

- When user chooses Reply, outgoing messages include a snapshot in `referenceMessage`:

```ts
onSendMessage({
  type: MessageType.TEXT,
  content: { text: "Replying..." },
  referenceMessage: {
    referenceMessageId: replied.id,
    type: replied.type,
    content: replied.content,
  },
});
```

## 🧱 Message Schema

Types are defined in `src/components/chat-sdk/types/types.ts`.

```ts
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  DOCUMENT = "document",
  STICKER = "sticker",
  SYSTEM = "system",
}

export interface TextContent { text: string }
export interface ImageContent { image: string; caption: string }
export interface VideoContent { video: string; caption: string }
export interface AudioContent { audio: string; voice?: boolean }
export interface DocumentContent { document: string; fileName: string; caption: string }
export interface StickerContent { sticker: string }
export interface SystemContent { system: SystemMessageInfo | SystemMessageReminder | SystemMessageMention }

export interface MessageBase {
  id: string;
  from: string;           // sender id
  isReceived: boolean;    // true if from other user
  createdAt: number|Date|string;
  editedAt?: number|Date|string;
  status?: "pending" | "sent" | "delivered" | "read" | "failed";
  referenceMessage?: {
    referenceMessageId: string; // original message id
    type: MessageType;          // snapshot type of original
    content: TextContent | ImageContent | VideoContent | AudioContent | DocumentContent | StickerContent | SystemContent;
  };
}

export type Message =
  | (MessageBase & { type: MessageType.TEXT; content: TextContent })
  | (MessageBase & { type: MessageType.SYSTEM; content: SystemContent })
  | (MessageBase & { type: MessageType.IMAGE; content: ImageContent })
  | (MessageBase & { type: MessageType.STICKER; content: StickerContent })
  | (MessageBase & { type: MessageType.VIDEO; content: VideoContent })
  | (MessageBase & { type: MessageType.AUDIO; content: AudioContent })
  | (MessageBase & { type: MessageType.DOCUMENT; content: DocumentContent });
```

Notes:
- `referenceMessage` stores a snapshot for robust offline reply rendering. If the full original message exists in the current list, the SDK will link to it; otherwise it renders the snapshot.
- Time fields can be `number` (ms), `Date`, or ISO string.

## 🖱️ Long-Press Actions

- Available actions are context-aware (type/ownership/status):
  - Reply, Copy, Edit (own text), Delete (own), Retry (failed), Download (media), Share (media)
- The menu respects bottom safe area and includes a Cancel button.

## 🎧 Audio Behavior

- Playback uses `expo-audio` with a simple progress bar and knob.
- Exclusive playback is enforced (only one message plays at a time) via an internal coordinator.
- Voice notes recorded from the input toolbar are sent as `{ audio: uri, voice: true }`.

## 📄 Documents

- Remote files are downloaded to the app’s document directory (via `expo-file-system`) and then opened natively:
  - Android: `expo-intent-launcher`
  - iOS: `expo-sharing`

## 🔧 Custom Renderers (Optional)

You can override any message type renderer via the `messageRenderers` prop. Provide a mapping from `MessageType` to a rendering function to replace the default.

## 🌐 Performance

- Uses `@shopify/flash-list` for efficient rendering of long conversations.
- Media and heavy actions are lazy and resilient.

## 🧪 Example Data

See `dummy.ts` at project root for a comprehensive sample dataset, including images, video, audio, documents, and reply chains.

---

If you have questions or need more integration points (theming, i18n, custom action sets), you can extend the components in `src/components/chat-sdk/components/` or override renderers via props. Happy building! 🎉 # react-native-chat-sdk-ui
