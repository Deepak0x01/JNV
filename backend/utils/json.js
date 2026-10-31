function applyJson(schema, keyField) {
  schema.set("toJSON", {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = keyField ? ret[keyField] : String(ret._id);
      if (keyField) delete ret[keyField];
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
}

module.exports = applyJson;
