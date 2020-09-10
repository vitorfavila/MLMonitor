var db = require('../../db/database')

exports.getAll = (active = 1) => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM pesquisa WHERE active = ?", [active], (err, result) => {

            if (err) {
                reject(err)
            } else {
                resolve(result)
            }

            // res.render('ml/lista', { title: 'ML Product Tracker', context: result });
        })
    })

}

exports.getOne = (pesquisaId) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM pesquisa WHERE id = ?", [pesquisaId], (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }

            // res.render('ml/search', { title: `Tracker do Item ${result.name}`, context });
        })
    })
}

exports.removeOne = (pesquisaId) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM pesquisa WHERE id = ?", [pesquisaId], (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }

            // res.render('ml/search', { title: `Tracker do Item ${result.name}`, context });
        })
    })
}

exports.filterTitle = (anuncios, filtro) => {
    return anuncios.filter((a) => a.title.toLowerCase().includes(filtro.toLowerCase()))
}