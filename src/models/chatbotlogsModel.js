import mongoose from "mongoose";

const chatbotLogsSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    prompt: {
        type: String,
    },

    response: {
        type: String
    },

    context_type:{
        type: String,
        enum:[
            "search",
            "caption"
        ],
        required: true,
        default: "search",
    },
}, 
    {timestamps: true}
);

const ChatbotLogs = new mongoose.model("ChatbotLogs", chatbotLogsSchema)
export default ChatbotLogs