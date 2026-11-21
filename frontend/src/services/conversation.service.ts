import api from "./api";

export interface Conversation {
    id: string;
    title: string;
    documentId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ChatMessage {
    id: string;
    role: "USER" | "ASSISTANT";
    content: string;
    sources: unknown;
    createdAt: string;
}

export const createConversationAPI = async (
    title: string,
    documentId?: string
) => {
    const response = await api.post("/conversations", {
        title,
        documentId
    });

    return response.data.data as Conversation;
};

export const getConversationsAPI = async () => {
    const response = await api.get("/conversations");

    return response.data.data as Conversation[];
};

export const getMessagesAPI = async (conversationId: string) => {
    const response = await api.get(
        `/conversations/${conversationId}/messages`
    );

    return response.data.data as ChatMessage[];
};

export const sendMessageAPI = async (
    conversationId: string,
    content: string
) => {
    const response = await api.post(
        `/conversations/${conversationId}/messages`,
        { content }
    );

    return response.data.data as {
        userMessage: ChatMessage;
        assistantMessage: ChatMessage | null;
    };
};