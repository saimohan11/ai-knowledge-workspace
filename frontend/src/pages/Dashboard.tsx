import { useNavigate } from "react-router-dom"

export default function Dashboard() {
    const navigate = useNavigate();
    return (
        <div className="h-full w-full flex flex-col justify-center items-center gap-2">
            <h1 className="text-3xl font-bold m-2">
            Welcome to Knowledge AI
            </h1>
            <p className="text-slate-300 text-sm">
                Your personal AI-powered knowledge workspace
            </p>
            <button onClick={()=>{
                navigate("/chat/new")
            }} className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-5 py-2 mt-4" type="button">New Chat</button>
        </div>
    )
}