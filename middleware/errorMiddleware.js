/**
 * Centralised error handling middleware.
 * Must be registered AFTER all routes.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl} →`, err.message);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res
      .status(409)
      .json({ message: `Duplicate value for ${field}` });
  }

  // Mongoose cast error (bad ObjectId etc.)
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ message: `Invalid value for field: ${err.path}` });
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File too large (max 50 MB)" });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ message: "Unexpected file field" });
  }

  const statusCode = err.statusCode || res.statusCode === 200
    ? err.statusCode || 500
    : res.statusCode;

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * Async wrapper – removes repetitive try/catch in controllers.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
