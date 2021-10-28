const express = require('express')
const router = express.Router()
const adminController = require('../../controllers/admin-controller')
router.get('/restaurants/create', adminController.createRestaurant) // 刪除 authenticatedAdmin
router.get('/restaurants', adminController.getRestaurants) // 刪除 authenticatedAdmin
router.post('/restaurants', adminController.postRestaurant) // 新增這行
router.get('', (req, res) => res.redirect('/admin/restaurants'))
module.exports = router
