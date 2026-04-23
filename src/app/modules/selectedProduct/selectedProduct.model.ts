import mongoose, { Schema, model } from "mongoose";
import { TSelectedProducts } from "./selectedProduct.interface";

const selectedProductItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    commission: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed"], // change if needed
      default: "pending",
    },
  },
);

const selectedProductsSchema = new Schema<TSelectedProducts>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: {
      type: [selectedProductItemSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const SelectedProducts = model<TSelectedProducts>(
  "SelectedProducts",
  selectedProductsSchema
);