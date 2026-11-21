
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import prisma from "../config/prisma";
import supabase from "../config/supabase";
import { extractPdfText } from "../services/pdf.service";
import { processPdfDocument } from "../services/document-processing.service";


const BUCKET = process.env.SUPABASE_BUCKET || "documents";

export const uploadDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  let storagePath: string | undefined;

  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
      return;
    }

    // Check the PDF file signature.
    if (file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      res.status(400).json({
        success: false,
        message: "Invalid PDF file",
      });
      return;
    }

    storagePath = `${randomUUID()}.pdf`;
    console.log("Supabase URL:", process.env.SUPABASE_URL);
    console.log("Supabase bucket:", BUCKET);
    console.log("Storage path:", storagePath);


    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload failed:", uploadError.message);

      res.status(502).json({
        success: false,
        message: "Failed to upload document to storage",
      });
      return;
    }

    try {
      const document = await prisma.document.create({
        data: {
          name: file.originalname,
          storagePath,
          mimeType: "application/pdf",
          size: file.size,
        },
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: document,
      });
    } catch (dbError) {
      // Remove the stored file if saving metadata fails.
      const { error: cleanupError } = await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);

      if (cleanupError) {
        console.error("Storage cleanup failed:", cleanupError.message);
      }

      throw dbError;
    }
  } catch (error) {
    console.error("Document upload failed:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to save document",
      });
    }
  }
};


export const getDocumentUrl = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id)? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
      return;
    }

    // 1. Find the document metadata in PostgreSQL.
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: "Document not found",
      });
      return;
    }

    // 2. Generate a signed URL for the private PDF.
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(document.storagePath, 300);

    if (error || !data?.signedUrl) {
      console.error(
        "Failed to create signed URL:",
        error?.message,
      );

      res.status(502).json({
        success: false,
        message: "Failed to generate document URL",
      });
      return;
    }

    // 3. Return the temporary URL to the client.
    res.status(200).json({
      success: true,
      message: "Signed URL generated successfully",
      data: {
        id: document.id,
        name: document.name,
        mimeType: document.mimeType,
        url: data.signedUrl,
        expiresInSeconds: 300,
      },
    });
  } catch (error) {
    console.error("Failed to get document URL:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate document URL",
    });
  }
};

export const deleteDocument = async (req: Request, res: Response):Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if(!id) {
      res.status(400).json({
        success: false,
        message: "document id is required"
      });
      return;
    };
    const document = await prisma.document.findUnique({
      where: {id},
    });
    if (!document) {
      res.status(404).json({
        success: false,
        message : "document not found"
      });
      return;
    };
    const {error: storageError} = await supabase.storage
    .from(BUCKET)
    .remove([document.storagePath]);
    if(storageError) {
      console.error("supabase delete failed", storageError.message);
      res.status(502).json(
        {
          success: false,
          message: "Failed to delete document from the storage",
        });
        return;
    }
    await prisma.document.delete({
      where: {id}
    });
    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      data: {
        id: document.id,
        name: document.name,
      }
    });
  } catch(e) {
    console.error("document deletion failed", e);
    res.status(500).json({
      success: false,
      message : "failed to delete document",
    });
  }
};


export const extractDocumentText = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
      return;
    }

    // 1. Find document in PostgreSQL
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: "Document not found",
      });
      return;
    }

    // 2. Download PDF from Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(document.storagePath);

    if (error || !data) {
      console.error("PDF download failed:", error?.message);

      res.status(502).json({
        success: false,
        message: "Failed to download PDF from storage",
      });
      return;
    }

    // 3. Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Extract PDF text
    const result = await extractPdfText(buffer);

    // 5. Return extracted text
    res.status(200).json({
      success: true,
      message: "PDF text extracted successfully",
      data: {
        documentId: document.id,
        documentName: document.name,
        totalPages: result.totalPages,
        text: result.text,
      },
    });
  } catch (error) {
    console.error("PDF extraction failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to extract PDF text",
    });
  }
};


export const processDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  let documentId: string | undefined;

  try {
    // Step 1: Validate document ID.
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
      return;
    }

    documentId = id;

    // Step 2: Find document in PostgreSQL.
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: "Document not found",
      });
      return;
    }

    // Step 3: Update document status.
    await prisma.document.update({
      where: { id },
      data: { status: "PROCESSING" },
    });

    // Step 4: Download PDF from Supabase.
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(document.storagePath);

    if (error || !data) {
      throw new Error(
        error?.message || "Failed to download PDF from storage",
      );
    }

    // Step 5: Convert Blob to Buffer.
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 6: Run the complete document processing pipeline.
    const result = await processPdfDocument(id, buffer);

    // Step 7: Mark document as processed.
    await prisma.document.update({
      where: { id },
      data: { status: "PROCESSED" },
    });

    // Step 8: Return processing details.
    res.status(200).json({
      success: true,
      message: "Document processed successfully",
      data: {
        documentId: id,
        documentName: document.name,
        status: "PROCESSED",
        totalPages: result.totalPages,
        totalChunks: result.chunks.length,
      },
    });
  } catch (error) {
    console.error("Document processing failed:", error);

    // Mark document as failed if processing fails.
    if (documentId) {
      try {
        await prisma.document.updateMany({
          where: { id: documentId },
          data: { status: "FAILED" },
        });
      } catch (statusError) {
        console.error("Failed to update document status:", statusError);
      }
    }

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to process document",
      });
    }
  }
};
