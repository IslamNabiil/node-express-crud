const express = require("express");
const router = express.Router();

const invoiceController = require("../controller/invoiceController");

router.post("/", invoiceController.createInv);
router.get("/", invoiceController.getAllInv);
router.get("/:id", invoiceController.getInvById);
router.delete("/:id", invoiceController.deleteInv);
router.patch("/:id", invoiceController.updateInv);
router.post('/return/',invoiceController.createReturnInv)

module.exports = router;
