const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// Models
const { User } = require("../models/user.model");
const { Product } = require("../models/product.model");
const { Cart } = require("../models/cart.model");
const { Order } = require("../models/order.model");
const { ProductInCart } = require("../models/productInCart.model");

// Utils
const { catchAsync } = require("../utils/catchAsync.util");
const { AppError } = require("../utils/appError.util");

dotenv.config({ path: "./config.env" });

// Gen random jwt signs
// require('crypto').randomBytes(64).toString('hex') -> Enter into the node console and paste the command

const createUser = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Encrypt the password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  // Remove password from response
  newUser.password = undefined;

  // 201 -> Success and a resource has been created
  res.status(201).json({
    status: "success",
    data: { newUser },
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

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
    attributes: { exclude: ["password"] },
    where: { status: "active" },
    include: [
      {
        model: Post,
        include: {
          model: Comment,
          include: { model: User },
        },
      },
      {
        model: Comment,
      },
    ],
  });

  res.status(200).json({
    status: "success",
    data: { users },
  });
});

const getAllProducstUser = catchAsync(async (req, res, next) => {
  // Get email and password from req.body
  const { sessionUser } = req;

  // Product created for user
  const productCreated = await Product.findAll({
    where: { userId: sessionUser.id },
  });

  res.status(200).json({
    status: "success",
    data: { productCreated },
  });
});
const updateUser = catchAsync(async (req, res, next) => {
  const { username, email } = req.body;
  const { user } = req;

  await user.update({ username, email });

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const { user } = req;

  // Method 1: Delete by using the model
  // User.destroy({ where: { id } })

  // Method 2: Delete by using the model's instance
  // await user.destroy();

  // Method 3: Soft delete
  await user.update({ status: "deleted" });

  res.status(204).json({ status: "success" });
});

const getAllOrdersUser = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;
  // Select all Orders
  const orders = await Order.findAll({
    attributes: ["id", "userId", "cartId", "totalPrice"],
    where: { userId: sessionUser.id },
    include: [
      {
        model: Cart,
        attributes: ["id", "status"],
        include: [
          {
            model: ProductInCart,
            attributes: ["productId"],
            where: { status: "purchased" },
            include: [
              {
                model: Product,
                attributes: ["title"],
              },
            ],
          },
        ],
      },
    ],
  });

  if (orders.length === 0) {
    return res.status(404).json({
      status: "error",
      message: "User don't have Orders ",
    });
  }

  res.status(200).json({
    status: "success",
    data: { orders: orders },
  });
});

const getOrdersUserById = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;
  const { order } = req;

  const orders = await Order.findOne({
    where: { id: order.id, userId: sessionUser.id },
    include: [
      {
        model: Cart,
        include: [
          {
            model: ProductInCart,
            where: { status: "purchased" },
            include: [
              {
                model: Product,
                attributes: ["title"],
              },
            ],
          },
        ],
      },
    ],
  });

  res.status(200).json({
    status: "success",
    data: { orders },
  });
});

module.exports = {
  getAllUsers,
  createUser,
  getAllProducstUser,
  getAllOrdersUser,
  getOrdersUserById,
  updateUser,
  deleteUser,
  login,
};
