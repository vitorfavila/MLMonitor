var express = require("express");
var router = express.Router();
var db = require("../db/database");
const {
  getAll,
  getAllWithHistory,
  getOne,
  removeOne,
  updatePesquisaField,
  pesquisaByID,
  addItem,
  addSearchHistory,
  addSearchHistoryBySearch,
} = require("../controllers/pesquisa");
const { sortMethods } = require("../constants");

/* GET users listing. */
router.get("/add", function (req, res, next) {
  res.render("ml/add", { title: "Novo Tracker" });
});

router.get("/", async (req, res, next) => {
  var items = await getAllWithHistory();

  res.render("ml/lista", { title: "ML Product Tracker", context: items });
});

router.get("/:id", async (req, res, next) => {
  var sortBy = sortMethods[0];
  if (req.query.sortBy) {
    var selectedMethod = sortMethods.filter((m) => m.id === req.query.sortBy);
    if (selectedMethod?.length > 0) {
      sortBy = selectedMethod[0];
    }
  }

  var allPesquisas = await getAll();
  var pesquisa = await getOne(req.params.id);
  var searchData = await pesquisaByID(pesquisa);

  // addSearchHistoryBySearch(req.params.id, searchData).catch((err) =>
  //   console.log(`${err} for id ${req.params.id}`)
  // );

  var context = {
    paging: searchData.paging,
    results: searchData.results.sort(sortBy.method),
    pesquisa,
    pesquisas: allPesquisas,
    sortMethods,
  };

  res.render("ml/search", {
    title: pesquisa.name,
    currentSortMethod: sortBy,
    context,
  });
});

router.get("/remove/:id", async (req, res, next) => {
  var removal = await removeOne(req.params.id);

  res.redirect(`/ml`);
});

router.post("/add", async (req, res, next) => {
  try {
    var newID = await addItem(
      req.body.name,
      req.body.search,
      req.body.posfilter,
      req.body.exclfilter
    );
    res.redirect(`/ml/${newID}`);
  } catch (error) {
    console.log(error);
  }
});

router.post("/:id/update/:field", async (req, res) => {
  const pesquisaID = req.params.id;
  const updateField = req.params.field;
  const value = req.body.value;

  try {
    await updatePesquisaField(pesquisaID, updateField, value);
  } catch (error) {
    console.log(error);
  }

  res.redirect(`/ml/${pesquisaID}`);
});

// TODO Criar form e rota para pesquisa sem salvar, permitindo salvar depois

// TODO criar rota para rotina de loop nos itens e atualizacao de menor parcela e menor valor
router.get("/history/run", async (req, res) => {
  var allPesquisas = await getAll();
  for (var i = 0; i < allPesquisas.length; i++) {
    try {
      await addSearchHistory(allPesquisas[i].id);
    } catch (error) {
      console.log(error);
    }
  }

  res.redirect(`/ml`);
});

module.exports = router;
