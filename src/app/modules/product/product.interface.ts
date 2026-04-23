export interface TProduct {
  productId: number;
  status: "Active" | "Inactive";
  name: string;

  introduction: string;
  poster: string; // image URL or filename
}
