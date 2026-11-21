
import { Router } from "express";
import { createConversation,getConversations,getConversationMessages,createMessage  } from "../controllers/conversation.controller";

const router = Router();

router.post("/", createConversation);
router.get("/", getConversations);
router.get("/:id/messages", getConversationMessages);
router.post("/:id/messages", createMessage);

export default router;
