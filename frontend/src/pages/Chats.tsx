
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { SendHorizontal, FileText } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { isValidElement } from "react";

import { useAppDispatch, useAppSelector } from "../store/hooks";

import {
    createConversationThunk,
    sendMessageThunk
} from "../features/conversations/conversationSlice";

export default function Chat() {
    const dispatch = useAppDispatch();

    const conversations = useAppSelector(
        (state) => state.conversations.conversations
    );

    const { conversationId } = useParams();

    const currentConversation = conversations.find(
        (conversation) => conversation.id === conversationId
    );

   const messages = useMemo(
        () => currentConversation?.messages ?? [],
        [currentConversation]
    );

    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const messagesRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const navigate = useNavigate();

    const { documentName } = location.state || {};

    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTo({
                top: messagesRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages, isTyping]);


    async function handleSendMessage() {
        const trimmedMessage = message.trim();

        if (!trimmedMessage) return;

        let activeConversationId = conversationId;

            if (!activeConversationId || activeConversationId === "new") {
                const newConversation = await dispatch(
                    createConversationThunk({
                        title: trimmedMessage.slice(0, 40),
                        documentId: location.state?.documentId
                    })
                ).unwrap();

                activeConversationId = newConversation.id;

                navigate(`/chat/${activeConversationId}`, {
                    replace: true,
                    state: location.state
                });
            }

                if (!activeConversationId) return;

                setMessage("");
                setIsTyping(true);

                try {
                    await dispatch(
                        sendMessageThunk({
                            conversationId: activeConversationId,
                            content: trimmedMessage
                        })
                    ).unwrap();
                } catch (error) {
                    console.error("Failed to send message:", error);
                    setMessage(trimmedMessage);
                } finally {
                    setIsTyping(false);
                }
    }

    return (
        <div className="h-full min-h-0 w-full flex flex-col overflow-hidden">
            <div className="shrink-0 p-4 border-b bg-white">
                {documentName ? (
                    <div className="flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" />
                        <div>
                            <h2 className="font-semibold text-slate-800">
                                Chat with Document
                            </h2>
                            <p className="text-xs text-slate-500">
                                {documentName}
                            </p>
                        </div>
                    </div>
                ) : (
                    <h2 className="font-semibold text-slate-800">
                        Chat ID: {conversationId}
                    </h2>
                )}
            </div>

            <div
                ref={messagesRef}
                className="flex-1 min-h-0 bg-slate-100 p-4 overflow-y-auto"
            >
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-800">
                            {documentName
                                ? "Ask anything about your document"
                                : "How can I help you today?"}
                        </h1>

                        <p className="text-slate-500 text-sm">
                            {documentName
                                ? `You are chatting with ${documentName}`
                                : "Ask questions, explore ideas, or upload a document to get started."}
                        </p>

                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                            {(documentName
                                ? [
                                    "Summarize this document",
                                    "What are the key points?",
                                    "Explain the important concepts"
                                ]
                                : [
                                    "Explain React hooks",
                                    "What is REST API?",
                                    "Explain database indexing"
                                ]
                            ).map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => setMessage(prompt)}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`p-3 rounded-xl mb-2 w-fit ${
                            msg.sender === "user"
                                ? "bg-blue-600 text-white ml-auto"
                                : "bg-white text-slate-800 mr-auto"
                        }`}
                    >
                        <div className="wrap-break-word">
                            {msg.sender === "ai" ? (
                                <ReactMarkdown
                                    components={{
                                        h1: ({ children }) => (
                                            <h1 className="text-2xl font-bold mb-3">
                                                {children}
                                            </h1>
                                        ),

                                        h3: ({ children }) => (
                                            <h3 className="text-lg font-semibold mt-3 mb-2">
                                                {children}
                                            </h3>
                                        ),

                                        ul: ({ children }) => (
                                            <ul className="list-disc pl-6 my-2">
                                                {children}
                                            </ul>
                                        ),

                                        li: ({ children }) => (
                                            <li className="mb-1">
                                                {children}
                                            </li>
                                        ),

                                        pre: ({ children }) => {
                                            const codeElement = Array.isArray(children)
                                                ? children[0]
                                                : children;

                                            const codeText = isValidElement(codeElement)
                                                ? String(
                                                    (codeElement.props as {
                                                        children?: unknown
                                                    }).children ?? ""
                                                )
                                                : "";

                                            return <CodeBlock>{codeText}
                                                </CodeBlock>;
                                        },

                                        code: ({ children, className, ...props }) => {
                                            const isInline = !className;

                                            return isInline ? (
                                                <code className="rounded bg-slate-200 px-1.5 py-0.5 text-sm text-blue-700">
                                                    {children}
                                                </code>
                                            ) : (
                                                <code className="text-slate-100" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        },

                                        ol: ({ children }) => (
                                            <ol className="list-decimal pl-6 my-2 space-y-1">
                                                {children}
                                            </ol>
                                        ),

                                        a: ({ children, href }) => (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline hover:text-blue-800"
                                            >
                                                {children}
                                            </a>
                                        )
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            ) : (
                                <div className="whitespace-pre-wrap">
                                    {msg.text}
                                </div>
                            )}
                        </div>

                        <div className="text-xs mt-1 opacity-70 text-right">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                            })}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="bg-white text-slate-500 p-3 rounded-xl w-fit">
                        AI is typing...
                    </div>
                )}
            </div>

            <div className="shrink-0 bg-white border-t p-4 flex gap-2 items-center">
                <input
                    className="text-black flex-1 rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    placeholder="Ask anything..."
                    value={message}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSendMessage();
                        }
                    }}
                    onChange={(e) => setMessage(e.target.value)}
                />

                <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isTyping}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
                    type="button"
                >
                    {isTyping ? (
                        "Sending..."
                    ) : (
                        <SendHorizontal size={20} />
                    )}
                </button>
            </div>
        </div>
    );
}

function CodeBlock({ children }: { children: string }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        await navigator.clipboard.writeText(children);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }

    return (
        <div className="my-3">
            <div className="flex justify-end rounded-t-lg bg-slate-800 px-3 py-2">
                <button
                    onClick={handleCopy}
                    className="rounded px-3 py-1 text-xs text-white hover:bg-slate-700"
                >
                    {copied ? "✓ Copied!" : "Copy"}
                </button>
            </div>

            <pre className="overflow-x-auto rounded-b-lg bg-slate-900 p-4 text-sm text-slate-100">
                <code>{children}</code>
            </pre>
        </div>
    );
}