import mongoose from "mongoose";

const orderItemsSchema = new mongoose.Schema({
    order_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },

    jumlah: {
        type: Number,
        required: true,
        default: 0
    },

    harga_saat_pemesanan:{
        type: Number,
        required: true,
        default: 0,
    },
});

const OrderItems = new mongoose.model("OrderItems", orderItemsSchema);
export default OrderItems;