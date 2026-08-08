const db = require('../config/db');

// Listar puntos de venta (público)
exports.getAllPoints = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM points_of_sale ORDER BY created_at ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener puntos de venta:', error);
    res.status(500).json({ error: 'Error al obtener puntos de venta.' });
  }
};

// Crear punto de venta (protegido por Admin)
exports.createPoint = async (req, res) => {
  const { name, address, maps_query } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO points_of_sale (name, address, maps_query) VALUES (?, ?, ?)',
      [name, address || '', maps_query || name]
    );
    res.status(201).json({ message: 'Punto de venta añadido con éxito.', id: result.insertId });
  } catch (error) {
    console.error('Error al añadir punto de venta:', error);
    res.status(500).json({ error: 'Error al guardar el punto de venta.' });
  }
};

// Eliminar punto de venta (protegido por Admin)
exports.deletePoint = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM points_of_sale WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Punto de venta no encontrado.' });
    }
    res.json({ message: 'Punto de venta eliminado con éxito.' });
  } catch (error) {
    console.error('Error al eliminar punto de venta:', error);
    res.status(500).json({ error: 'Error al eliminar punto de venta.' });
  }
};