const express = require("express");
const router = express.Router();

const invoiceController = require("../controller/invoiceController");

router.post("/", invoiceController.createInv);
router.get("/", invoiceController.getAllInv);
router.get("/:id", invoiceController.getInvById);
// router.delete("/:id", invoiceController.deleteInvoice);

module.exports = router;
