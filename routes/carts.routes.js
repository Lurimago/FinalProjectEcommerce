const express = require("express");

// Controllers
const {
  addProductCart,
  updateProductInCart,
  purchaseCart,
  removeProductFromCart,
  getUserCart,
} = require("../controllers/orders.controller");

// Middlewares
const { cartExists } = require("../middlewares/carts.middlewares");

const { protectSession } = require("../middlewares/auth.middlewares");

const cartsRouter = express.Router();

cartsRouter.use(protectSession);
cartsRouter.get("/", getUserCart);
cartsRouter.post("/add-product", addProductCart);
cartsRouter.patch("/update-cart", cartExists, updateProductInCart);
cartsRouter.delete("/:productId", cartExists, removeProductFromCart);
cartsRouter.post("/purchase", purchaseCart);

module.exports = { cartsRouter };
