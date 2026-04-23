import { Types } from "mongoose";

export interface TProductItem {
    productId: Types.ObjectId;
    price: number;
    commission: number;
    status: "pending" | "completed";
}

export interface TSelectedProducts {
    userId: Types.ObjectId;
    type: 'trial' | 'normal' | 'group'
    products: TProductItem[];
}