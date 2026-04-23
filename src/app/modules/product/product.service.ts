import { ProductModel } from "./product.model";
import { TProduct } from "./product.interface";

const generateUnique4DigitProductId = async (): Promise<number> => {
  for (let i = 0; i < 10; i++) {
    const productId = Math.floor(1000 + Math.random() * 9000);

    const exists = await ProductModel.exists({ productId });
    if (!exists) return productId;
  }

  throw new Error("All 4-digit product IDs are exhausted");
};

const createProduct = async (payload: TProduct) => {
  // console.log("product pyload", payload);
  payload.productId = await generateUnique4DigitProductId();
  const product = await ProductModel.create(payload);
  return product;
};

const updateProduct = async (productId: number, payload: Partial<TProduct>) => {


  const updatedProduct = await ProductModel.findOneAndUpdate(
    { productId: productId },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedProduct) {
    throw new Error("Product not found");
  }

  return updatedProduct;
};
const getAllProducts = async (
  page = 1,
  limit = 10,
  name?: string,
  productId?: string,
) => {
  const query: any = {};

  // Name search
  if (name) {
    query.name = { $regex: name, $options: "i" };
  }

  // Product ID filter
  if (productId) {
    query.productId = Number(productId);
  }

  const data = await ProductModel.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  return { data };
};

const deleteProduct = async (productId: number) => {
  const deletedProduct = await ProductModel.findOneAndDelete({ productId });

  if (!deletedProduct) {
    throw new Error("Product not found");
  }

  return deletedProduct;
};

export const ProductService = {
  createProduct,
  updateProduct,
  getAllProducts,
  deleteProduct,
};
