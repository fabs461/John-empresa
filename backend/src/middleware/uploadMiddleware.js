const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ruta absoluta a backend/uploads, sin importar desde dónde se arranque el servidor.
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({

    destination(req, file, cb){
        cb(null, UPLOADS_DIR);
    },

    filename(req,file,cb){

        const nombre = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);

        cb(null,nombre);
    }

});

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