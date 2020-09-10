var express = require('express');
var router = express.Router();
var axios = require('axios');
var db = require('../db/database');
const { getAll, getOne, removeOne, filterTitle } = require('../controllers/pesquisa');
const { trim } = require('lodash');

function sortByValue(a, b) {
  if (a.price < b.price) {
      return -1;
  }
  if (a.price > b.price) {
      return 1;
  }

  return 0;
}

const searchML = async (term, category = "") => {
  var search = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(term)}&category=${category}`)

  // console.log(search.data.results[0])

  return search
}

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.render('ml/index', { title: 'ML Product Tracker' });
});

router.get('/pesquisas', async (req, res, next) => {
  var result = await getAll()

  res.render('ml/lista', { title: 'ML Product Tracker', context: result });
});

router.get('/pesquisas/:id', async (req, res, next) => {

  var allPesquisas = await getAll()

  var pesquisa = await getOne(req.params.id)

  var search = await searchML(pesquisa.search)

  if (pesquisa.posfilter && pesquisa.posfilter.length > 0) {
    pesquisa.posfilter = trim(pesquisa.posfilter)

    var posfilters = pesquisa.posfilter.split(' ')

    var filteredSearch = search.data.results
    posfilters.map(pf => {
      filteredSearch = filterTitle(filteredSearch, pf)
    })

    search.data.results = filteredSearch
  }

  var context = {
    paging: search.data.paging,
    results: search.data.results.sort(sortByValue),
    pesquisa,
    pesquisas: allPesquisas
  }

  res.render('ml/search', { title: `Tracker do Item ${pesquisa.name}`, context });
});

router.get('/remove/:id', async (req, res, next) => {

  var removal = await removeOne(req.params.id)

  res.redirect(`/ml/pesquisas`);
});

router.post('/add', (req, res, next) => {
  var sql ='INSERT INTO pesquisa (name, search, posfilter) VALUES (?,?, ?)'
  db.run(sql, [req.body.name, req.body.search, req.body.posfilter], (err, insert) => {
    if (err) {
      console.log(err)
      return
    }

    res.redirect(`/ml/pesquisas/${this.lastID}`);
  }) 
})

router.post('/', function (req, res, next) {
  if (req.body.search && req.body.search.length > 0) {
    axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(req.body.search)}`)
      .then(response => {
        console.log(response.data.results[0].address)
        console.log(response.data.results[0].seller_address)

        var context = {
          query: req.body.search,
          paging: response.data.paging,
          results: response.data.results
        }

        res.render('ml/search', { title: 'ML Product Tracker - Results', context });
      })
  } else {
    res.send('Informe um produto para busca')
  }


});

module.exports = router;
