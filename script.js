const STORAGE_KEY = "gestion_budget_transactions_v1";

let transactions = loadTransactions();

const form = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const formMessage = document.getElementById("formMessage");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expenseElement = document.getElementById("expense");
const transactionList = document.getElementById("transactionList");
const transactionCount = document.getElementById("transactionCount");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const incomeBar = document.getElementById("incomeBar");
const expenseBar = document.getElementById("expenseBar");
const incomePercent = document.getElementById("incomePercent");
const expensePercent = document.getElementById("expensePercent");
const clearAllBtn = document.getElementById("clearAllBtn");

dateInput.value = getToday();

form.addEventListener("submit", addTransaction);
searchInput.addEventListener("input", render);
filterType.addEventListener("change", render);
clearAllBtn.addEventListener("click", clearAllTransactions);

function getToday() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Impossible de charger les données :", error);
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatMoney(value) {
  return `${Number(value).toLocaleString("fr-FR")} Ar`;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("fr-FR");
}

function addTransaction(event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const type = typeInput.value;
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!description || !Number.isFinite(amount) || amount <= 0 || !date) {
    showMessage("Veuillez remplir correctement tous les champs.", true);
    return;
  }

  const transaction = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    description,
    amount,
    type,
    category,
    date
  };

  transactions.unshift(transaction);
  saveTransactions();
  form.reset();
  dateInput.value = getToday();
  typeInput.value = "income";
  categoryInput.value = "Travail";

  showMessage("Transaction ajoutée avec succès.");
  render();
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.style.color = isError ? "var(--danger)" : "var(--success)";
}

function calculateTotals() {
  return transactions.reduce(
    (totals, transaction) => {
      if (transaction.type === "income") {
        totals.income += transaction.amount;
      } else {
        totals.expense += transaction.amount;
      }
      return totals;
    },
    { income: 0, expense: 0 }
  );
}

function updateSummary() {
  const { income, expense } = calculateTotals();
  const balance = income - expense;
  const total = income + expense;

  balanceElement.textContent = formatMoney(balance);
  incomeElement.textContent = formatMoney(income);
  expenseElement.textContent = formatMoney(expense);

  balanceElement.style.color = balance < 0 ? "var(--danger)" : "var(--text)";

  const incomeWidth = total ? (income / total) * 100 : 0;
  const expenseWidth = total ? (expense / total) * 100 : 0;

  incomeBar.style.width = `${incomeWidth}%`;
  expenseBar.style.width = `${expenseWidth}%`;
  incomePercent.textContent = `${Math.round(incomeWidth)}%`;
  expensePercent.textContent = `${Math.round(expenseWidth)}%`;
}

function getFilteredTransactions() {
  const search = searchInput.value.trim().toLowerCase();
  const selectedType = filterType.value;

  return transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(search) ||
      transaction.category.toLowerCase().includes(search);

    const matchesType =
      selectedType === "all" || transaction.type === selectedType;

    return matchesSearch && matchesType;
  });
}

function render() {
  updateSummary();

  const filtered = getFilteredTransactions();
  transactionList.innerHTML = "";

  transactionCount.textContent =
    `${filtered.length} ${filtered.length > 1 ? "opérations" : "opération"}`;

  emptyState.style.display = filtered.length ? "none" : "block";

  filtered.forEach((transaction) => {
    const row = document.createElement("tr");

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = transaction.description;

    const categoryCell = document.createElement("td");
    const categoryBadge = document.createElement("span");
    categoryBadge.className = "type-badge";
    categoryBadge.textContent = transaction.category;
    categoryCell.appendChild(categoryBadge);

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(transaction.date);

    const amountCell = document.createElement("td");
    amountCell.className =
      transaction.type === "income" ? "amount-income" : "amount-expense";
    amountCell.textContent =
      `${transaction.type === "income" ? "+" : "-"}${formatMoney(transaction.amount)}`;

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "Supprimer";
    deleteButton.addEventListener("click", () => deleteTransaction(transaction.id));
    actionCell.appendChild(deleteButton);

    row.append(
      descriptionCell,
      categoryCell,
      dateCell,
      amountCell,
      actionCell
    );

    transactionList.appendChild(row);
  });
}

function deleteTransaction(id) {
  const confirmed = confirm("Voulez-vous supprimer cette transaction ?");
  if (!confirmed) return;

  transactions = transactions.filter((transaction) => transaction.id !== id);
  saveTransactions();
  render();
  showMessage("Transaction supprimée.");
}

function clearAllTransactions() {
  if (!transactions.length) {
    showMessage("Aucune transaction à effacer.", true);
    return;
  }

  const confirmed = confirm(
    "Attention : toutes les transactions seront supprimées. Continuer ?"
  );

  if (!confirmed) return;

  transactions = [];
  saveTransactions();
  render();
  showMessage("Toutes les transactions ont été supprimées.");
}

render();
