var db = require("../../db/database");
var axios = require("axios");
const { trim } = require("lodash");

exports.getAll = (active = 1) => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM pesquisa WHERE active = ?",
      [active],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }

        // res.render('ml/lista', { title: 'ML Product Tracker', context: result });
      }
    );
  });
};

exports.getItemLatestHistory = async (itemID) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT h.lower_price, h.lower_parcel, h.installments, h.at 
      FROM price_history h
      WHERE pesquisa_id = ?
      ORDER BY at DESC LIMIT 1`,
      [itemID],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

exports.getItemLowerHistory = async (itemID) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT min(h.lower_price) as lower_price, min(h.lower_parcel) as lower_parcel
      FROM price_history h
      WHERE pesquisa_id = ? 
      AND id NOT IN (SELECT max(id) FROM price_history WHERE pesquisa_id = ?)`,
      [itemID, itemID],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

exports.getAllWithHistory = async () => {
  var items = await exports.getAll();
  for (var i = 0; i < items.length; i++) {
    var lastHistory = await exports.getItemLatestHistory(items[i]["id"]);
    items[i]["lastHistory"] = lastHistory;

    var lowerHistory = await exports.getItemLowerHistory(items[i].id);
    items[i]["lowerHistory"] = lowerHistory;
  }

  return items;
};

exports.getOne = (pesquisaId) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM pesquisa WHERE id = ?",
      [pesquisaId],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }

        // res.render('ml/search', { title: `Tracker do Item ${result.name}`, context });
      }
    );
  });
};

exports.removeOne = (pesquisaId) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM pesquisa WHERE id = ?", [pesquisaId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }

      // res.render('ml/search', { title: `Tracker do Item ${result.name}`, context });
    });
  });
};

exports.addItem = (name, search, posfilter, exclfilter) => {
  var sql =
    "INSERT INTO pesquisa (name, search, posfilter, exclfilter) VALUES (?, ?, ?, ?)";
  return new Promise((resolve, reject) => {
    db.run(sql, [name, search, posfilter, exclfilter], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
};

exports.filterTitle = (anuncios, filtro) => {
  return anuncios.filter((a) =>
    a.title.toLowerCase().includes(filtro.toLowerCase())
  );
};

exports.exclFilterTitle = (anuncios, filtro) => {
  return anuncios.filter(
    (a) => !a.title.toLowerCase().includes(filtro.toLowerCase())
  );
};

exports.updatePesquisaField = (pesquisaID, field, value) => {
  const validUpdateFields = ["exclfilter", "posfilter"];

  return new Promise((resolve, reject) => {
    if (!validUpdateFields.includes(field)) {
      reject("invalid field");
      return;
    }

    db.run(
      `UPDATE pesquisa SET ${field} = ? WHERE id = ?`,
      [value, pesquisaID],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }

        // res.render('ml/search', { title: `Tracker do Item ${result.name}`, context });
      }
    );
  });
};

exports.searchML = async (term, category = "") => {
  var searchValue = encodeURIComponent(term);
  // searchValue = term.split(" ").join("-")
  var search = await axios.get(
    `https://api.mercadolibre.com/sites/MLB/search?q=${searchValue}&category=${category}`
  );

  // console.log(search.data.results[0]);

  return search;
};

exports.pesquisaByID = async (pesquisa) => {
  var search = await exports.searchML(pesquisa.search);

  if (pesquisa.posfilter && pesquisa.posfilter.length > 0) {
    pesquisa.posfilter = trim(pesquisa.posfilter);

    var posfilters = pesquisa.posfilter.split(" ");

    var filteredSearch = search.data.results;
    posfilters.map((pf) => {
      filteredSearch = exports.filterTitle(filteredSearch, pf);
    });

    search.data.results = filteredSearch;
  }

  if (pesquisa.exclfilter && pesquisa.exclfilter.length > 0) {
    pesquisa.exclfilter = trim(pesquisa.exclfilter);

    var exclfilters = pesquisa.exclfilter.split(" ");

    var filteredSearch = search.data.results;
    exclfilters.map((ef) => {
      filteredSearch = exports.exclFilterTitle(filteredSearch, ef);
    });

    search.data.results = filteredSearch;
  }

  return search.data;
};

exports.getLowerPriceAndParcelFromSearch = (search) => {
  var lower_price = 0;
  var lower_parcel = 0;
  var installments = 0;

  for (var i = 0; i < search.results.length; i++) {
    var result = search.results[i];
    if (i == 0) {
      lower_price = result.price;
      lower_parcel = result.installments.amount;
      installments = result.installments.quantity;
    }

    if (result.price < lower_price) {
      lower_price = result.price;
    }

    if (result.installments.amount < lower_parcel) {
      lower_parcel = result.installments.amount;
      installments = result.installments.quantity;
    }
  }

  const lowerResult = {
    lower_price,
    lower_parcel,
    installments,
  };
  return lowerResult;
};

exports.addSearchHistory = async (itemID) => {
  var item = await exports.getOne(itemID);
  var search = await exports.pesquisaByID(item);

  var lowerData = exports.getLowerPriceAndParcelFromSearch(search);

  return new Promise((resolve, reject) => {
    if (lowerData.lower_price === 0) {
      reject("no prices");
      return;
    }
    db.run(
      `INSERT INTO price_history 
        (at, pesquisa_id, lower_price, lower_parcel, installments) 
        VALUES (datetime('now','localtime'), ?, ?, ?, ?)`,
      [
        itemID,
        lowerData.lower_price,
        lowerData.lower_parcel,
        lowerData.installments,
      ],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
};

exports.addSearchHistoryBySearch = async (itemID, search) => {
  var lowerData = exports.getLowerPriceAndParcelFromSearch(search);

  return new Promise((resolve, reject) => {
    if (lowerData.lower_price === 0) {
      reject("no prices");
      return;
    }
    db.run(
      `INSERT INTO price_history 
        (at, pesquisa_id, lower_price, lower_parcel, installments) 
        VALUES (datetime('now','localtime'), ?, ?, ?, ?)`,
      [
        itemID,
        lowerData.lower_price,
        lowerData.lower_parcel,
        lowerData.installments,
      ],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
};
