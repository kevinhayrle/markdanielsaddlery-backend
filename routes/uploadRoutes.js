const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

router.post('/custom-fit', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    success: true,
    imageUrl: `/uploads/custom-fit/${req.file.filename}`
  });
});

module.exports = router;
