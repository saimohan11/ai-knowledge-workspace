
import { Router } from "express";
import prisma from "../config/prisma";
import upload from "../middleware/upload";

import {
  uploadDocument,
  getDocumentUrl,
  deleteDocument,
  extractDocumentText,
  processDocument,
} from "../controllers/document.controller";

const router = Router();

// GET all documents
router.get("/", async (_req, res) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (e) {
    console.error("Failed to fetch documents:", e);

    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
});

// GET document signed URL
router.get("/:id/url", getDocumentUrl);

// POST upload document
router.post("/", upload.single("file"), uploadDocument);

// POST extract PDF text
router.post("/:id/extract", extractDocumentText);

// POST process document (extract + chunk + embed + store)
router.post("/:id/process", processDocument);

// DELETE document
router.delete("/:id", deleteDocument);

export default router;
