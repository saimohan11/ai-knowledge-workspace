
import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Upload,
    FileText,
    X,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    Eye,
    Download
} from "lucide-react";

import {
    uploadDocumentAPI,
    getDocumentsAPI,
    getDocumentURLAPI,
    deleteDocumentAPI,
    processDocumentAPI
} from "../services/document.service";

type UploadedDocument = {
    id: string;
    name: string;
    size: number;
    uploadedAt: Date;
    previewUrl : string
};

export default function Documents() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<"success" | "invalid-type" | "file-too-large" |"duplicate" | null>(null);

    const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()));

    useEffect(() => {
    const fetchDocuments = async () => {
        try {
            const documents = await getDocumentsAPI();

            setDocuments(
                documents.map((doc) => ({
                    id: doc.id,
                    name: doc.name,
                    size: doc.size,
                    uploadedAt: new Date(doc.createdAt),
                    previewUrl: ""
                }))
            );
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        }
    };

    fetchDocuments();
}, []);



    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0];

        console.log("Selected file:", selectedFile);
        console.log("File type:", selectedFile?.type);
        console.log("File size:", selectedFile?.size);

        if (!selectedFile) return;

        if (selectedFile.type !== "application/pdf") {
            setStatus("invalid-type");
            e.target.value = "";
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
        setStatus("file-too-large");
        e.target.value = "";
        return;
    }


        if (previewUrl) URL.revokeObjectURL(previewUrl);

        setStatus(null);
        setFile(selectedFile);
        setProgress(0);

        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
    }

    function removeFile() {
        if (previewUrl) URL.revokeObjectURL(previewUrl);

        setFile(null);
        setPreviewUrl("");
        setProgress(0);
        setStatus(null);
    }

    async function handleUpload() {
    if (!file) return;

    const alreadyExists = documents.some(
        (doc) => doc.name.toLowerCase() === file.name.toLowerCase()
    );

    if (alreadyExists) {
        setStatus("duplicate");
        return;
    }

    setUploading(true);
    setProgress(0);
    setStatus(null);

    try {
        const uploadedDocument = await uploadDocumentAPI(file);

        setDocuments((prev) => [
            ...prev,
            {
                id: uploadedDocument.id,
                name: uploadedDocument.name,
                size: uploadedDocument.size,
                uploadedAt: new Date(uploadedDocument.createdAt),
                previewUrl: ""
            }
        ]);

        try {
                await processDocumentAPI(uploadedDocument.id);
                console.log("Document processed successfully");
            } catch (error) {
                console.error("Document processing failed:", error);
                alert("Document uploaded, but processing failed. Please try again.");
            }

        setProgress(100);
        setStatus("success");
        setFile(null);
        setPreviewUrl("");

    } catch (error) {
        console.error("Document upload failed:", error);
        setStatus(null);
        alert("Failed to upload document. Please try again.");

    } finally {
        setUploading(false);
    }
}

async function handleDocumentAccess(documentId: string) {
    try {
        const response = await getDocumentURLAPI(documentId);

        return response.url;
    } catch (error) {
        console.error("Failed to access document:", error);
        alert("Unable to open document. Please try again.");
        return null;
    }
    }

async function handleDeleteDocument(doc: UploadedDocument) {
    const confirmed = window.confirm(
        `Are you sure you want to delete "${doc.name}"?`
    );

    if (!confirmed) return;

    try {
        await deleteDocumentAPI(doc.id);

        setDocuments((prev) =>
            prev.filter((item) => item.id !== doc.id)
        );

    } catch (error) {
        console.error("Failed to delete document:", error);
        alert("Failed to delete document. Please try again.");
    }
}
    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
            <div className="mx-auto max-w-4xl">

                <h1 className="text-2xl font-bold text-slate-800">
                    My Documents
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Upload your documents and start chatting with AI.
                </p>

                <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">

                    <Upload size={40} className="mx-auto text-blue-600" />

                    <h2 className="mt-4 font-semibold text-slate-800">
                        Upload your PDF document
                    </h2>
                    
                    <p className="mt-2 text-sm text-slate-500">
                        PDF files only · Maximum file size: 10 MB
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                        Select a PDF file to preview before uploading.
                    </p>

                    <label className="mt-5 inline-block cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                        Choose PDF

                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                </div>

                {file && (
                    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="text-blue-600" size={28} />

                                <div>
                                    <p className="font-medium text-slate-800">
                                        {file.name}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>

                            {!uploading && (
                                <button onClick={removeFile}>
                                    <X className="text-slate-500 hover:text-red-500" />
                                </button>
                            )}
                        </div>

                        <div className="mt-5">
                            <p className="mb-2 text-sm font-semibold text-slate-700">
                                Document Preview
                            </p>

                            <iframe
                                src={previewUrl}
                                title="PDF Preview"
                                className="h-96 w-full rounded-lg border border-slate-200"
                            />
                        </div>

                        {uploading && (
                            <div className="mt-5">
                                <div className="mb-2 flex justify-between text-sm">
                                    <span>Uploading...</span>
                                    <span>{progress}%</span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className="h-full rounded-full bg-blue-600 transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {!uploading && !status && (
                            <button
                                onClick={handleUpload}
                                className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
                            >
                                Upload Document
                            </button>
                        )}

                        {status === "success" && (
                            <div className="mt-5 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                                <CheckCircle size={20} />
                                Document uploaded successfully!
                            </div>
                        )}

                          {(status === "invalid-type" || status === "file-too-large" || status === "duplicate" ) && (
                                <div className="mt-5 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    <AlertCircle size={20} />

                                    {status === "invalid-type"
                                        ? "Only PDF files are allowed."
                                        : status === "file-too-large"
                                        ? "File size must be 10 MB or less."
                                        : "A document with this filename already exists."}
                                </div>
                            )}
                    </div>
                )}

                {/* Uploaded Documents List */}
                                
                <div className="mt-8">

                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Uploaded Documents ({filteredDocuments.length})
                        </h2>

                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border text-black border-slate-300 bg-white px-4 py-2 pr-16 text-sm outline-none focus:border-blue-500"
                            />

                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="text-blue-600" size={28} />

                                    <div>
                                        <p className="font-medium text-slate-800">
                                            {doc.name}
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            {(doc.size / (1024 * 1024)).toFixed(2)} MB
                                            {" · "}
                                            {doc.uploadedAt.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">

                                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                                        Uploaded
                                    </span>

                                    {/* View PDF */}
                                    <button
                                        onClick={async () => {
                                                const url = await handleDocumentAccess(doc.id);

                                                if (url) {
                                                    window.open(url, "_blank");
                                                }
                                            }}
                                        className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                                    >
                                        <Eye size={16} />
                                        View
                                    </button>

                                    {/* Download PDF */}
                                    <button
                                        onClick={async () => {
                                            const url = await handleDocumentAccess(doc.id);

                                            if (url) {
                                                const link = document.createElement("a");
                                                link.href = url;
                                                link.download = doc.name;
                                                link.target = "_blank";
                                                link.click();
                                            }
                                        }}
                                        className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                                    >
                                        <Download size={16} />
                                        Download
                                    </button>

                                    {/* Chat with document */}
                                    <button
                                        onClick={() =>
                                            navigate("/chat/new", {
                                                state: {
                                                    documentId: doc.id,
                                                    documentName: doc.name
                                                }
                                            })
                                        }
                                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-600 hover:bg-blue-100"
                                    >
                                        <MessageSquare size={16} />
                                        Chat
                                    </button>

                                    {/* Delete document */}
                                    <button
                                        onClick={() => handleDeleteDocument(doc)}
                                        className="text-slate-400 hover:text-red-500"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Empty state */}
                        {filteredDocuments.length === 0 && (
                            <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                                {searchQuery
                                    ? "No documents found matching your search."
                                    : "No documents uploaded yet."}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


