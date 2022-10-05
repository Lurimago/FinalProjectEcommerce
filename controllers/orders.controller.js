// Models
const { Cart } = require("../models/cart.model");
const { Product } = require("../models/product.model");
const { ProductInCart } = require("../models/productInCart.model");
const { Order } = require("../models/order.model");

// Utils
const { catchAsync } = require("../utils/catchAsync.util");
const { AppError } = require("../utils/appError.util");

const getUserCart = catchAsync(async (req, res, next) => {});

const addProductCart = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;
  const { productId, quantity } = req.body;

  // Validate that requested qty doesnt exceed the available qty
  const product = await Product.findOne({
    where: { id: productId, status: "active" },
  });

  if (!product) {
    return next(new AppError("Product does not exists", 404));
  } else if (quantity > product.quantity) {
    return next(
      new AppError(`This product only has ${product.quantity} items.`, 400)
    );
  }

  const cart = await Cart.findOne({
    where: { userId: sessionUser.id, status: "active" },
  });

  if (!cart) {
    // Assign cart to user (create cart)
    const newCart = await Cart.create({ userId: sessionUser.id });

    await ProductInCart.create({ cartId: newCart.id, productId, quantity });
  } else {
    // Cart already exists
    const productInCart = await ProductInCart.findOne({
      where: { productId, cartId: cart.id },
    });

    if (!productInCart) {
      // Add product to current cart
      await ProductInCart.create({ cartId: cart.id, productId, quantity });
    } else if (productInCart.status === "active") {
      return next(
        new AppError("This product is already active in your cart", 400)
      );
    } else if (productInCart.status === "removed") {
      await productInCart.update({ status: "active", quantity });
    }
  }

  res.status(200).json({
    status: "success",
  });
});

const updateProductInCart = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;
  const { productId, newQty } = req.body;

  const cart = await Cart.findOne({
    where: { userId: sessionUser.id, status: "active" },
  });

  if (!cart) {
    return next(new AppError("You do not have a cart active.", 400));
  }

  // Validate that requested qty doesnt exceed the available qty
  const product = await Product.findOne({
    where: { id: productId, status: "active" },
  });

  if (!product) {
    return next(new AppError("Product does not exists", 404));
  } else if (newQty > product.quantity) {
    return next(
      new AppError(`This product only has ${product.quantity} items.`, 400)
    );
  } else if (0 > newQty) {
    return next(new AppError("Cannot send negative values", 400));
  }

  const productInCart = await ProductInCart.findOne({
    where: { cartId: cart.id, productId, status: "active" },
  });

  if (!productInCart) {
    return next(new AppError("This product is not in your cart", 404));
  }

  if (newQty === 0) {
    // Remove product from cart
    await productInCart.update({ quantity: 0, status: "removed" });
  } else if (newQty > 0) {
    await productInCart.update({ quantity: newQty });
  }

  res.status(200).json({
    status: "success",
  });
});

const removeProductFromCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  // search product active in cart
  const productInCart = await ProductInCart.findOne({
    where: {
      productId,
      status: "active",
    },
  });

  // if not have product active
  if (!productInCart) {
    return next(new AppError("the product not have in cart", 400));
  }

  await productInCart.update({ quantity: 0, status: "removed" });

  res.status(204).json({ status: "success" });
});

const purchaseCart = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;

  // Get user's cart and get products in cart
  const cart = await Cart.findOne({
    where: { status: "active", userId: sessionUser.id },
    include: [
      {
        model: ProductInCart,
        where: { status: "active" },
        include: [{ model: Product }],
      },
    ],
  });

  if (!cart) {
    return next(new AppError("This user does not have a cart yet.", 400));
  }

  // await ProductInCart.findAll({ where: { cartId: cart.id } });

  // Loop products in cart to do the following (map async)
  let totalPrice = 0;

  const cartPromises = cart.productInCarts.map(async (productInCart) => {
    //  Substract to stock
    const updatedQty = productInCart.product.quantity - productInCart.quantity;

    await productInCart.product.update({ quantity: updatedQty });

    //  Calculate total price
    const productPrice = productInCart.quantity * +productInCart.product.price;
    totalPrice += productPrice;

    //  Mark products to status purchased
    return await productInCart.update({ status: "purchased" });
  });

  await Promise.all(cartPromises);

  // Create order to user
  const newOrder = await Order.create({
    userId: sessionUser.id,
    cartId: cart.id,
    totalPrice,
  });

  await cart.update({ status: "purchased" });

  res.status(200).json({ status: "success", newOrder });
});
module.exports = {
  addProductCart,
  updateProductInCart,
  purchaseCart,
  removeProductFromCart,
  getUserCart,
};
