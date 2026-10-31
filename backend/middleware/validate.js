function validate(schema) {
  return async (req, res, next) => {
    try {
      req.body = await schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      next();
    } catch (err) {
      const errors = (err.inner && err.inner.length ? err.inner : [err]).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      res.status(422).json({ message: errors[0]?.message || "Validation failed", errors });
    }
  };
}

module.exports = validate;
