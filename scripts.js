// === SELECTORS ===
// Buttons
const openIncomeModal = document.getElementById("openIncome");
const openExpenseModal = document.getElementById("openExpense");
const closeIncomeModal = document.getElementById("closeIncomeModal");
const closeExpenseModal = document.getElementById("closeExpenseModal");
const filterRadios = document.querySelectorAll('input[name="filter"]');
const reset = document.getElementById("reset");

// Modals
const incomeModal = document.getElementById("addIncomeModal");
const expenseModal = document.getElementById("addExpenseModal");

// Forms and Fields
const incomeForm = document.getElementById("income-form");
const incomeAmount = incomeForm.querySelector('#amount');
const incomeDescription = incomeForm.querySelector('#description');
const incomeDate = incomeForm.querySelector('#date');

const expenseForm = document.getElementById("expense-form");
const expenseAmount = expenseForm.querySelector('#amount');
const expenseDescription = expenseForm.querySelector('#description');
const expenseDate = expenseForm.querySelector('#date');

const transacts = document.getElementById("entries");
const graps = document.getElementById("graph")

// === STATE ===
const initSummary = {
    't_income': 0,
    't_expense': 0,
    'debt': 0,
    'net': 0,
};
const initTransactions = [];

let summary = JSON.parse(localStorage.getItem('summary')) || { ...initSummary };
let transactions = JSON.parse(localStorage.getItem('transactions')) || [...initTransactions];
let editIndex = null;

// === INIT ===
displaySummary();
displayGraph()

// === EVENT LISTENERS ===
// Open modals
openIncomeModal.addEventListener('click', () => { 
    incomeModal.classList.add("open-modal");
    document.getElementById("submitIncome").innerText = "Add Income";
});
openExpenseModal.addEventListener('click', () => { 
    expenseModal.classList.add("open-modal");
    document.getElementById("submitIncome").innerText = "Add Expense";
});

// Close modals
closeIncomeModal.addEventListener('click', () => incomeModal.classList.remove("open-modal"));
closeExpenseModal.addEventListener('click', () => expenseModal.classList.remove("open-modal"));

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === incomeModal) incomeModal.classList.remove("open-modal");
    if (e.target === expenseModal) expenseModal.classList.remove("open-modal");
});

// Filter Transactions
filterRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const selectedFilter = e.target.value;
        displaySummary(selectedFilter);
    });
});


// Reset app
reset.addEventListener('click', () => {
    summary = { ...initSummary };
    transactions = [...initTransactions];
    updateLocalStorage();
    displaySummary();
    displayGraph();
    location.reload(); // Optional: can be removed if displaySummary handles UI well
});

// Handle form submissions
incomeForm.addEventListener('submit', (e) => handleFormSubmit(e, 'income'));
expenseForm.addEventListener('submit', (e) => handleFormSubmit(e, 'expense'));

// === FUNCTIONS ===
function handleFormSubmit(e, type) {
    e.preventDefault();

    const isIncome = type === 'income';
    const data = {
        amount: isIncome ? incomeAmount.value : expenseAmount.value,
        description: isIncome ? incomeDescription.value : expenseDescription.value,
        date: isIncome ? incomeDate.value : expenseDate.value,
        type,
    };

    if (editIndex == null) {
        transactions.push(data);
    } else {
        transactions[editIndex] = {
            amount: data.amount, 
            description: data.description, 
            date: data.date, 
            type: data.type
        };
        editIndex = null;
    }
    const result = calculateFinanceSummary(transactions);

    summary['t_income'] = result.totalIncome;
    summary['t_expense'] = result.totalExpense;
    summary['net'] = result.netAmount;
    summary['debt'] = result.debt;

    updateLocalStorage();
    displaySummary();
    displayGraph();

    // Close modal manually (cleaner than via submitBtn click)
    if (isIncome) incomeModal.classList.remove("open-modal");
    else expenseModal.classList.remove("open-modal");

    // Reset form fields
    (isIncome ? incomeForm : expenseForm).reset();
}

function calculateCategories(transactions) {
    const incomeCategories = {};
    const expenseCategories = {};

    transactions.forEach(({ amount, description, type }) => {
        const amt = parseFloat(amount);
        if (type === 'income') {
            incomeCategories[description] = (incomeCategories[description] || 0) + amt;
        } else {
            expenseCategories[description] = (expenseCategories[description] || 0) + amt;
        }
    });

    return {
        incomeCategories,
        expenseCategories
    };
}

function calculateFinanceSummary(transactions) {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(({ amount, description, type }) => {
        const amt = parseFloat(amount);
        if (type === 'income') {
            totalIncome += amt;
        } else {
            totalExpense += amt;
        }
    });

    let netAmount = totalIncome - totalExpense;
    let debt = 0;

    if (netAmount < 0) {
        debt = Math.abs(netAmount);
        netAmount = 0;
    }

    return {
        totalIncome,
        totalExpense,
        netAmount,
        debt
    };
}

function updateLocalStorage() {
    localStorage.setItem('summary', JSON.stringify(summary));
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function displaySummary(filter = "all") {
    // Update summary
    document.getElementById('t-income').innerText = `$${summary['t_income']}`;
    document.getElementById('t-expense').innerText = `$${summary['t_expense']}`;
    document.getElementById('t-net').innerText = `$${summary['net']}`;
    document.getElementById('t-savings').innerText = `$${summary['debt']}`;

    // Clear previous entries
    transacts.innerHTML = '';

    const entries = transactions;

    entries.forEach((t, index) => {
        if (filter === "all" || t.type === filter) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="date">${t.date}</td>
                <td class="amount ${t.type}">&dollar;${t.amount}</td>
                <td class="category">${t.description}</td>
                <td>
                    <span class="material-icons" id="edit" onClick="openEditModal(${index}, '${t.type}')">edit</span>
                    <span class="material-icons" id="delete" onClick="deleteEntry(${index})">delete</span>
                </td>`;
            transacts.appendChild(tr);
        }
    });
}

function displayGraph() {
    const result = calculateCategories(transactions);
    const expensePercent = {};
    graps.innerHTML = '';

    for(const [key, value] of Object.entries(result.expenseCategories)) {
        expensePercent[key] = ((value / summary.t_expense) * 100);
    };

    for(const [key, value] of Object.entries(expensePercent)) {
        const li = document.createElement('li');
        li.style.width = `${value}%`;
        li.textContent = key;
        graps.appendChild(li);
    }
}

function openEditModal(index, type) {
    switch (type) {
        case 'income':
            incomeModal.classList.add("open-modal");
            incomeAmount.value = transactions[index].amount;
            incomeDescription.value = transactions[index].description;
            incomeDate.value = transactions[index].date;
            document.getElementById("submitIncome").innerText = "Edit Income";
            editIndex = index
            break;
        case 'expense':
            expenseModal.classList.add("open-modal");
            expenseAmount.value = transactions[index].amount;
            expenseDescription.value = transactions[index].description;
            expenseDate.value = transactions[index].date;
            document.getElementById("submitExpense").innerText = "Edit Expense";
            editIndex = index
            break;
        default:
            alert(`Type of ${type} is not found!`)
    }
}

function deleteEntry(index) {
    transactions.splice(index, 1)
    const result = calculateFinanceSummary(transactions);

    summary['t_income'] = result.totalIncome;
    summary['t_expense'] = result.totalExpense;
    summary['net'] = result.netAmount;
    summary['debt'] = result.debt;

    updateLocalStorage();
    displaySummary();
    displayGraph();
} 
