const express              = require('express')
const router               = express.Router()
const promocodesController = require('../controller/promocodesController')

// POST /api/promocodes/validate
router.post('/validate', promocodesController.validate)

module.exports = router
