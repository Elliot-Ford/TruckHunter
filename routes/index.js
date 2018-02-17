var express = require('express');
var router = express.Router();
var ft = require('../foodtrucks.json');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Express',
    foodtrucks: ft
  });
});

module.exports = router;
