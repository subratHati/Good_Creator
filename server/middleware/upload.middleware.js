const { upload } = require('../config/cloudinary');

const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadMultiple = (fieldName, max) => upload.array(fieldName, max);

module.exports = { uploadSingle, uploadMultiple};