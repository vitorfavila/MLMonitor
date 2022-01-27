function sortByValue(a, b) {
  if (a.price < b.price) {
    return -1;
  }
  if (a.price > b.price) {
    return 1;
  }

  return 0;
}

function sortByInstallmentValue(a, b) {
  if (a.installments.amount < b.installments.amount) {
    return -1;
  }
  if (a.installments.amount > b.installments.amount) {
    return 1;
  }

  return 0;
}

exports.sortMethods = [
  {
    id: "parcela",
    name: "Valor da Parcela",
    method: sortByInstallmentValue,
  },
  {
    id: "valor",
    name: "Valor Total",
    method: sortByValue,
  },
];
