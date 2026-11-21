import prisma from "./config/prisma";
import express from 'express';
import "dotenv/config";
import cors from 'cors';
import documentRoutes from "./routes/document.routes";
import conversationRoutes from "./routes/conversation.routes";

const app = express()
app.use(express.json({ limit: "1mb" }));


app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
    })
);

app.use("/api/documents",documentRoutes);
app.use("/api/conversations", conversationRoutes);

app.get("/",(_req,res)=>{
      res.json({
          msg: "hello world"
      })
});

app.get("/api/health/db", async(_req,res)=>{
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            success: true,
            msg: "Db is working successfully"
        })
    } catch (e) {
        console.log("Db health check failed",e)
        res.status(500).json({
            success:false,
            msg: "Database connection failed"
        })
    }
});


export default app;