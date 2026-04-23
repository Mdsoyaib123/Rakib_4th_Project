import { Schema, model } from "mongoose";
import { TProduct } from "./product.interface";

const productSchema = new Schema<TProduct>(
  {
    productId: { type: Number, required: true,  },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    name: { type: String, required: true },
    introduction: { type: String, required: true },
    poster: { type: String, required: true },
  },
  { timestamps: true }
);

export const ProductModel = model<TProduct>("Product", productSchema);
