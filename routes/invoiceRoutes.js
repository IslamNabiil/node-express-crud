const express = require("express");
const router = express.Router();

const invoiceController = require("../controller/invoiceController");

router.post("/", invoiceController.createInvoice);
router.get('/', invoiceController.getAllInvoices)
router.get('/:id', invoiceController.getInvoiceById)

module.exports = router;
