const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// Models
const { Product } = require("../models/product.model");
const { User } = require("../models/user.model");
const { ProductImg } = require("../models/productImg.model");
const { Category } = require("../models/category.model");

// Utils
const { catchAsync } = require("../utils/catchAsync.util");
const { AppError } = require("../utils/appError.util");
const {
  uploadProductImgs,
  getProductsImgsUrls,
} = require("../utils/firebase.util");

dotenv.config({ path: "./config.env" });

// Gen random jwt signs
// require('crypto').randomBytes(64).toString('hex') -> Enter into the node console and paste the command

const createProduct = catchAsync(async (req, res, next) => {
  const { title, description, price, categoryId, quantity } = req.body;
  const { sessionUser } = req;

  const newProduct = await Product.create({
    title,
    description,
    price,
    categoryId,
    quantity,
    userId: sessionUser.id,
  });

  await uploadProductImgs(req.files, newProduct.id);
  // 201 -> Success and a resource has been created
  res.status(201).json({
    status: "success",
    data: { newProduct },
  });
});

const getAllActiveProducts = catchAsync(async (req, res, next) => {
  const products = await Product.findAll({
    where: { status: "active" },
    attributes: [
      "id",
      "title",
      "description",
      "quantity",
      "price",
      "categoryId",
      "userId",
      "status",
    ],
    include: [
      { model: User, attributes: ["id", "username"] },
      {
        model: ProductImg,
      },
    ],
  });

  const productsWithImgs = await getProductsImgsUrls(products);

  res.status(200).json({
    status: "success",
    data: { products: productsWithImgs },
  });
});

const getProductById = catchAsync(async (req, res, next) => {
  const { product } = req;

  const id = product.id;

  const productId = await Product.findOne({
    where: { status: "active", id: id },
    //   attributes: ['id', 'title', 'description', 'quantity', 'price', 'categoryId', 'userId', 'status'],
    include: [
      {
        model: Product,
        required: false,
        where: { status: "active" },
        //   attributes: ["id", "name", "address", "rating", "status"],
      },
    ],
  });

  res.status(201).json({
    status: "success",
    productId,
  });
});

const login = catchAsync(async (req, res, next) => {
  // Get email and password from req.body
  const { email, password } = req.body;

  // Validate if the user exist with given email
  const user = await User.findOne({
    where: { email, status: "active" },
  });

  // Compare passwords (entered password vs db password)
  // If user doesn't exists or passwords doesn't match, send error
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Wrong credentials", 400));
  }

  // Remove password from response
  user.password = undefined;

  // Generate JWT (payload, secretOrPrivateKey, options)
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.status(200).json({
    status: "success",
    data: { user, token },
  });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const { product, sessionUser } = req;
  const { title, description, price, quantity } = req.body;

  if (sessionUser.id !== product.userId) {
    return next(new AppError("You're not own this product", 400));
  }

  await product.update({
    title,
    description,
    price,
    quantity,
  });

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const { product, sessionUser} = req;
  if (sessionUser.id !== product.userId) {
    return next(new AppError("You're not own this product", 400));
  }
  await product.update({ status: "deleted" });

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

const createCategory = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  const newCategory = await Category.create({
    name,
  });

  res.status(201).json({
    status: "success",
    newCategory,
  });
});

const getAllActiveCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.findAll({
    where: { status: "active" },
    attributes: ["id", "name", "status"],
  });

  res.status(201).json({
    status: "success",
    categories,
  });
});
const updateCategory = catchAsync(async (req, res, next) => {
  const { category } = req;
  const { name } = req.body;

  await category.update({ name });

  res.status(200).json({
    status: "success",
    data: { category },
  });
});
module.exports = {
  createProduct,
  getAllActiveProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createCategory,
  getAllActiveCategories,
  updateCategory,
};
