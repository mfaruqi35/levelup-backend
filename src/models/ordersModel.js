import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

    umkm_id:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

    total_harga:{
        type: Number,
        required: true,
        default: 0,
    },

    status_order: {
        type: String,
        enum: [
            "pending",
            "paid",
            'cancelled',
            "completed",
            "waiting_pickup"
        ],
        default: "pending",
        required: true,
    },
    payment_status:{
        type: String,
        enum: [
            "unpaid", "paid", "expired", "refund"
        ],
        default: "unpaid",
        required: true,
    },
    created_at:{
        type: Date,
        default: Date.now
    },

    updated_at:{
        type:Date,
        default: Date.now
    },

});

const Order = new mongoose.model("Order", orderSchema);
export default Order;