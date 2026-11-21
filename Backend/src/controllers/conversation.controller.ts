
import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { searchSimilarChunks } from "../services/semantic-search.service";
import { generateAnswer } from "../services/generation.service";

export const createConversation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title, documentId } = req.body;

    // Validate the document ID if provided
    if (documentId !== undefined && documentId !== null) {
      if (typeof documentId !== "string" || !documentId.trim()) {
        res.status(400).json({
          success: false,
          message: "Invalid document ID",
        });
        return;
      }

      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { id: true },
      });

      if (!document) {
        res.status(404).json({
          success: false,
          message: "Document not found",
        });
        return;
      }
    }

    // Validate the title if provided
    if (
      title !== undefined &&
      (typeof title !== "string" || !title.trim())
    ) {
      res.status(400).json({
        success: false,
        message: "Title must be a non-empty string",
      });
      return;
    }

    const conversation = await prisma.conversation.create({
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(documentId ? { documentId } : {}),
      },
      select: {
        id: true,
        title: true,
        documentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: conversation,
    });
  } catch (error) {
    console.error("Failed to create conversation:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    });
  }
};


export const getConversations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        documentId: true,
        createdAt: true,
        updatedAt: true,
        document: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: conversations,
      total: conversations.length,
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};


export const getConversationMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        sources: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: messages,
      total: messages.length,
    });
  } catch (error) {
    console.error("Failed to fetch conversation messages:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation messages",
    });
  }
};


export const createMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const conversationId = Array.isArray(rawId)
      ? rawId[0]
      : rawId;

    const { content } = req.body;

    // 1. Validate conversation ID
    if (!conversationId) {
      res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
      return;
    }

    // 2. Validate message content
    if (typeof content !== "string" || !content.trim()) {
      res.status(400).json({
        success: false,
        message: "Message content is required",
      });
      return;
    }

    // 3. Fetch conversation and its associated document
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        documentId: true,
      },
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
      return;
    }

    // 4. Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: "USER",
        content: content.trim(),
      },
    });

    // 5. Check whether conversation has a document
    if (!conversation.documentId) {
      res.status(200).json({
        success: true,
        message: "User message saved. No document is attached to this conversation.",
        data: {
          userMessage,
          assistantMessage: null,
        },
      });
      return;
    }

    // RAG integration will be added in the next step.
    // 6. Retrieve relevant document chunks
const searchResults = await searchSimilarChunks(
  content.trim(),
  conversation.documentId,
  3,
);

if (searchResults.length === 0) {
  res.status(200).json({
    success: true,
    message: "No relevant information found in the document.",
    data: {
      userMessage,
      assistantMessage: null,
    },
  });
  return;
}

// 7. Extract context for Gemini
const context = searchResults.map((result) => result.content);

// 8. Generate AI answer
const answer = await generateAnswer({
  question: content.trim(),
  context,
});

// 9. Prepare source information
const sources = searchResults.map((result) => ({
  documentId: result.documentId,
  chunkIndex: result.chunkIndex,
  similarity: Number(result.similarity),
}));

// 10. Save assistant response
const assistantMessage = await prisma.message.create({
  data: {
    conversationId,
    role: "ASSISTANT",
    content: answer,
    sources,
  },
});

// 11. Return both messages
res.status(200).json({
  success: true,
  message: "AI response generated successfully",
  data: {
    userMessage,
    assistantMessage,
  },
});

  } catch (error) {
  console.error("Failed to process conversation message:", error);

  res.status(500).json({
    success: false,
    message: "Failed to process message or generate AI response",
  });
}
};