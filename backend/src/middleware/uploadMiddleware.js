const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;

// Ruta absoluta a backend/uploads, sin importar desde dónde se arranque el servidor.
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "john-empresa",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "avif"]
  }
});

const upload = multer({
  storage,
  limits:{
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = upload;

const fileFilter = (req,file,cb)=>{

    const permitidos = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif"
    ];

    if(permitidos.includes(file.mimetype))
        cb(null,true);
    else
        cb(new Error("Formato no permitido"),false);

};

const upload = multer({

    storage,

    fileFilter,

    limits:{
        fileSize:5*1024*1024
    }

});

module.exports = upload;
module.exports.UPLOADS_DIR = UPLOADS_DIR;