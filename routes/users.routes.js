const express = require("express");

// Controllers
const {
  getAllUsers,
  createUser,
  getAllProducstUser,
  getAllOrdersUser,
  getOrdersUserById,
  updateUser,
  deleteUser,
  login,
} = require("../controllers/users.controller");

// Middlewares
const { userExists } = require("../middlewares/users.middlewares");
const {
  protectSession,
  protectUsersAccount,
  protectAdmin,
} = require("../middlewares/auth.middlewares");
const {
  createUserValidators,
} = require("../middlewares/validators.middlewares");

const { orderExists } = require("../middlewares/orders.middleware");

const usersRouter = express.Router();

usersRouter.post("/", createUserValidators, createUser);

usersRouter.post("/login", login);

// Protecting below endpoints
usersRouter.use(protectSession);

usersRouter.get("/", protectAdmin, getAllUsers);

usersRouter.get("/me", getAllProducstUser);

usersRouter.patch("/:id", userExists, protectUsersAccount, updateUser);

usersRouter.delete("/:id", userExists, protectUsersAccount, deleteUser);

usersRouter.get("/orders", getAllOrdersUser);

usersRouter.get("/orders/:id", orderExists, getOrdersUserById);

module.exports = { usersRouter };
