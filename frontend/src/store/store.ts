import type { Conversation } from "../features/conversations/conversationSlice";
import { configureStore } from "@reduxjs/toolkit";
import conversationReducer from "../features/conversations/conversationSlice";

const STORAGE_KEY = "knowledge-ai-conversations";

function loadConversations(): Conversation[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) as Conversation[] : [];
    } catch {
        return [];
    }
}

export const store = configureStore({
    reducer: {
        conversations: conversationReducer
    },
    preloadedState: {
        conversations: {
            conversations: loadConversations()
        }
    }
});

store.subscribe(() => {
    const conversations = store.getState().conversations.conversations;

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(conversations)
    );
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;