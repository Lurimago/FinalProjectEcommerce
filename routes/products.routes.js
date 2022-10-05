const express = require("express");

// Controllers
const {
  getAllActiveProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByID,
  createCategory,
  getAllActiveCategories,
  updateCategory,
} = require("../controllers/products.controller");

// Middlewares
const { productExists } = require("../middlewares/products.middlewares");
const { categoryExists } = require("../middlewares/categories.middlewares");
const {
  protectSession,
  protectProductsOwners,
} = require("../middlewares/auth.middlewares");
const {
  createProductValidators,
  createCategoriesValidators,
} = require("../middlewares/validators.middlewares");

// Utils
const { upload } = require("../utils/multer.util");

const productsRouter = express.Router();

productsRouter.use(protectSession);

productsRouter.get("/", getAllActiveProducts);
productsRouter.get("/categories", getAllActiveCategories);
productsRouter.get("/:id", productExists, getProductByID);

// Get only 1 img
// postsRouter.post('/', upload.single('postImg'), createPost);

productsRouter.post(
  "/",
  upload.array("productImg", 5),
  createProductValidators,
  createProduct
);

productsRouter.patch(
  "/:id",
  productExists,
  updateProduct
);

productsRouter.delete(
  "/:id",
  productExists,
  deleteProduct
);
productsRouter.post("/categories", createCategoriesValidators, createCategory);

productsRouter.patch("/categories/:id", categoryExists, updateCategory);
module.exports = { productsRouter };
