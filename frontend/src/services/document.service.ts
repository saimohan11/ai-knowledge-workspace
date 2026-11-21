import api from "./api";

export interface Document {
    id: string;
    name: string;
    storagePath: string;
    mimeType: string;
    size: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const uploadDocumentAPI = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/documents", formData);

    return response.data.data as Document;
};


export const getDocumentsAPI = async () => {
    const response = await api.get("/documents");

    return response.data.data as Document[];
};

export const getDocumentURLAPI = async (documentId: string) => {
    const response = await api.get(`/documents/${documentId}/url`);

    return response.data.data;
};

export const deleteDocumentAPI = async (documentId: string) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
};

export const processDocumentAPI = async (documentId: string) => {
    const response = await api.post(`/documents/${documentId}/process`);

    return response.data.data;
};