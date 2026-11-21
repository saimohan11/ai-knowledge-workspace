import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize : 5 * 1024 * 1024, //5mb
        files: 1
    },
    fileFilter : (_req,file,callback) =>{
        const isPdf = 
        file.mimetype === "application/pdf" && 
        file.originalname.toLowerCase().endsWith(".pdf");
        if (!isPdf) {
            callback(new Error("Only pdf files are allowed"));
            return;
        }
        callback(null,true);
    },
});

export default upload;

