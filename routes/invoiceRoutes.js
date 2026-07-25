const express = require("express");
const router = express.Router();

const invoiceController = require("../controller/invoiceController");

// 1️⃣ المسارات الثابتة أولاً (Static Routes)
router.get("/return", invoiceController.getAllReturnInv);
router.post("/return", invoiceController.createReturnInv);

// 2️⃣ المسارات العامة بدون Parameters
router.get("/", invoiceController.getAllInv);
router.post("/", invoiceController.createInv);

// 3️⃣ المسارات المتغيرة بالـ ID دائماً في الآخر (Dynamic Routes)
router.get("/:id", invoiceController.getInvById);
router.patch("/:id", invoiceController.updateInv);
router.delete("/:id", invoiceController.deleteInv);

module.exports = router;
