const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { UPLOADS_DIR } = require('../middleware/uploadMiddleware');

function deleteImageFile(imageUrl) {
  if (!imageUrl) return;

  const filename = path.basename(imageUrl);

  fs.unlink(path.join(UPLOADS_DIR, filename), (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('No se pudo borrar la imagen:', err);
    }
  });
}

exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener inventario.' });
  }
};

// Crear prenda (Protegido por Admin) — la imagen es obligatoria
exports.createProduct = async (req, res) => {
  const { id, name, size, color, description, stock } = req.body;

  if (!name || !size || !color) {
  return res.status(400).json({ error: 'Nombre, talla y color son requeridos.' });
}

  if (!req.file) {
    return res.status(400).json({ error: 'La imagen del producto es obligatoria.' });
  }
  console.log(req.file);
  const image = '/uploads/' + req.file.filename;
  const productId = id || 'p_' + Date.now().toString(36);

  try {
    await db.query(
      'INSERT INTO products (id, name, size, color, description, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [productId, name, size, color, description || '', stock || 0, image]
    );
    res.status(201).json({ message: 'Prenda añadida con éxito', id: productId, image_url: image });
  } catch (error) {
    console.error('Error al añadir producto:', error);
    res.status(500).json({ error: 'Error al guardar la prenda.' });
  }
};

// Actualizar prenda (Protegido por Admin)
// Si llega una imagen nueva, reemplaza la anterior; si no, se conserva la que ya tenía.
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, size, color, description, stock } = req.body;

  try {
    const [existingRows] = await db.query('SELECT image_url FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) {
  return res.status(404).json({ error: 'Prenda no encontrada.' });
}

    const previousImage = existingRows[0].image_url;
    const newImage = req.file ? '/uploads/' + req.file.filename : previousImage;

    await db.query(
      'UPDATE products SET name = ?, size = ?, color = ?, description = ?, stock = ?, image_url = ? WHERE id = ?',
      [name, size, color, description, stock, newImage, id]
    ); 

    res.json({ message: 'Prenda actualizada con éxito.', image_url: newImage });
  } catch (error) {
  console.error('Error al actualizar producto:', error);
  res.status(500).json({ error: 'Error al actualizar prenda.' });
}
};

// Eliminar prenda (Protegido por Admin)
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const [existingRows] = await db.query('SELECT image_url FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Prenda no encontrada.' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Prenda eliminada con éxito.' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar prenda.' });
  }
};