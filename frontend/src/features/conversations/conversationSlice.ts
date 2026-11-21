import {
    createAsyncThunk,
    createSlice,
    type PayloadAction
} from "@reduxjs/toolkit";

import {
    createConversationAPI,
    sendMessageAPI
} from "../../services/conversation.service";

export type Message = {
    text: string;
    sender: "user" | "ai";
    timestamp: string;
};

export type Conversation = {
    id: string;
    title: string;
    messages: Message[];
    createdAt: string;
    updatedAt: string;
};

interface ConversationState {
    conversations: Conversation[];
}

const initialState: ConversationState = {
    conversations: []
};

export const createConversationThunk = createAsyncThunk(
    "conversations/createConversation",
    async (payload: { title: string; documentId?: string }) => {
        const conversation = await createConversationAPI(
            payload.title,
            payload.documentId
        );

        return {
            ...conversation,
            messages: []
        };
    }
);

export const sendMessageThunk = createAsyncThunk(
    "conversations/sendMessage",
    async (payload: {
        conversationId: string;
        content: string;
    }) => {
        const response = await sendMessageAPI(
            payload.conversationId,
            payload.content
        );

        const messages = [
            response.userMessage,
            response.assistantMessage
        ]
            .filter((message) => message !== null)
            .map((message) => ({
                text: message.content,
                sender: message.role === "USER" ? "user" as const : "ai" as const,
                timestamp: message.createdAt
            }));

        return {
            conversationId: payload.conversationId,
            messages
        };
    }
);

const conversationSlice = createSlice({
    name: "conversations",
    initialState,
    reducers: {

        createConversation: (
            state,
            action: PayloadAction<{
                id: string;
                title: string;
            }>
        ) => {
            const now = new Date().toISOString();

            state.conversations.unshift({
                id: action.payload.id,
                title: action.payload.title,
                messages: [],
                createdAt: now,
                updatedAt: now
            });
        },

        addMessage: (
            state,
            action: PayloadAction<{
                conversationId: string;
                message: Message;
            }>
        ) => {
            const conversation = state.conversations.find(
                (item) => item.id === action.payload.conversationId
            );

            if (conversation) {
                conversation.messages.push(action.payload.message);
                conversation.updatedAt = new Date().toISOString();
            }
        },

        renameConversation: (
            state,
            action: PayloadAction<{
                conversationId: string;
                title: string;
            }>
        ) => {
            const conversation = state.conversations.find(
                (item) => item.id === action.payload.conversationId
            );

            if (conversation) {
                conversation.title = action.payload.title;
            }
        },

        deleteConversation: (
            state,
            action: PayloadAction<string>
        ) => {
            state.conversations = state.conversations.filter(
                (item) => item.id !== action.payload
            );
        }
    },
    extraReducers: (builder) => {
    builder.addCase(createConversationThunk.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
    });

    builder.addCase(sendMessageThunk.fulfilled, (state, action) => {
        const conversation = state.conversations.find(
            (item) => item.id === action.payload.conversationId
        );

        if (conversation) {
            conversation.messages.push(...action.payload.messages);
            conversation.updatedAt = new Date().toISOString();
        }
    });
}
});

export const {
    createConversation,
    addMessage,
    renameConversation,
    deleteConversation
} = conversationSlice.actions;

export default conversationSlice.reducer;
