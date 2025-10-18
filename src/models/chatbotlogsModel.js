import mongoose from "mongoose";

const chatbotLogsSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    user_message: {
        type: String,
    },

    bot_response: {
        type: String
    },
    user_role: {
        type: String,
        enum: ['buyer', 'seller'],
        required: true,
    },

    context_data:{
        type: Object,
        default: {}
    }
}, 
    {timestamps: true}
);

const ChatbotLogs = new mongoose.model("ChatbotLogs", chatbotLogsSchema)
export default ChatbotLogs