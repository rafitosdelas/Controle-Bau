// =================================================================
// PASSO IMPORTANTE: COLE AQUI A CONFIGURAÇÃO DO SEU FIREBASE
// =================================================================
const firebaseConfig = {
    apiKey: "AIzaSyDKMNlXG2WER6rF4LsDrPgdReGLE1I9d9s",
    authDomain: "registro-bau.firebaseapp.com",
    projectId: "registro-bau",
    storageBucket: "registro-bau.firebasestorage.app",
    messagingSenderId: "854687018755",
    appId: "1:854687018755:web:9a0d48b1ec97784a2b8336",
    measurementId: "G-ZBWW6VSJLB"
};

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// VALORES ATUALIZADOS
const ITEM_VALUES = {
    "Filé de Peixe-Boi": 4200,
    "Filé de Jacaré": 5100,
    "Filé de Tartaruga": 1700,
};

// Referências para os elementos do HTML
const itemForm = document.getElementById('item-form');
const userSelector = document.getElementById('user-selector');
const actionSelector = document.getElementById('action-selector');
const itemSelector = document.getElementById('item-selector');

// Elementos do DOM para Biel
const bielItemsDiv = document.getElementById('biel-items');
const bielCalculator = {
    filesValue: document.getElementById('biel-files-value'),
    grandTotal: document.getElementById('biel-grand-total'),
    finalWashed: document.getElementById('biel-final-washed-value')
};

// Elementos do DOM para Rafitos
const rafitosItemsDiv = document.getElementById('rafitos-items');
const rafitosCalculator = {
    filesValue: document.getElementById('rafitos-files-value'),
    grandTotal: document.getElementById('rafitos-grand-total'),
    finalWashed: document.getElementById('rafitos-final-washed-value')
};


// Função genérica para lidar com a seleção de botões
function handleSelector(selectorElement) {
    selectorElement.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.closest('.item-selector-group, .button-group')) {
            selectorElement.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    });
}

handleSelector(userSelector);
handleSelector(actionSelector);
handleSelector(itemSelector);

// Variáveis para guardar o estado do inventário
let bielItems = {};
let rafitosItems = {};

// FUNÇÃO PRINCIPAL: REGISTRAR UMA AÇÃO
itemForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const user = userSelector.querySelector('.selected').dataset.user;
    const action = actionSelector.querySelector('.selected').dataset.action;
    const itemName = itemSelector.querySelector('.selected').dataset.item;
    const quantity = parseInt(document.getElementById('item-quantity').value);

    if (!itemName || quantity <= 0) {
        alert('Por favor, preencha a quantidade corretamente.');
        return;
    }

    if (action === 'tirou') {
        const currentInventory = (user === 'Biel') ? bielItems : rafitosItems;
        const availableQuantity = currentInventory[itemName] || 0;

        if (availableQuantity < quantity) {
            alert(`Ação inválida! ${user} não tem ${quantity}x ${itemName} para tirar. (Possui apenas ${availableQuantity})`);
            return;
        }
    }

    db.collection('transacoes').add({
        user: user,
        action: action,
        itemName: itemName,
        quantity: quantity,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        console.log('Transação registrada com sucesso!');
        document.getElementById('item-quantity').value = 1;
        document.getElementById('item-quantity').focus();
    }).catch((error) => {
        console.error("Erro ao registrar transação: ", error);
        alert('Ocorreu um erro ao registrar. Tente novamente.');
    });
});


// FUNÇÃO MÁGICA: OUVIR E ATUALIZAR TUDO EM TEMPO REAL
db.collection('transacoes').orderBy('timestamp', 'asc').onSnapshot((snapshot) => {
    bielItemsDiv.innerHTML = '';
    rafitosItemsDiv.innerHTML = '';
    bielItems = {};
    rafitosItems = {};

    snapshot.docs.forEach(doc => {
        const transacao = doc.data();
        const itemsList = transacao.user === 'Biel' ? bielItems : rafitosItems;
        const currentQty = itemsList[transacao.itemName] || 0;

        if (transacao.action === 'colocou') {
            itemsList[transacao.itemName] = currentQty + transacao.quantity;
        } else {
            itemsList[transacao.itemName] = currentQty - transacao.quantity;
        }
    });

    function displayItems(player, playerItems, divElement) {
        Object.keys(playerItems).sort().forEach(itemName => {
            const quantity = playerItems[itemName];
            if (quantity > 0) {
                const itemEntry = document.createElement('p');
                itemEntry.textContent = `${quantity}x ${itemName}`;
                itemEntry.addEventListener('click', () => {
                    userSelector.querySelectorAll('button').forEach(btn => btn.classList.toggle('selected', btn.dataset.user === player));
                    actionSelector.querySelector('[data-action="tirou"]').classList.add('selected');
                    actionSelector.querySelector('[data-action="colocou"]').classList.remove('selected');
                    itemSelector.querySelectorAll('button').forEach(btn => btn.classList.toggle('selected', btn.dataset.item === itemName));
                    document.getElementById('item-quantity').value = quantity;
                    document.getElementById('item-quantity').focus();
                });
                divElement.appendChild(itemEntry);
            }
        });
    }

    function updatePlayerCalculator(playerItems, calculatorElements) {
        let grossFilesValue = 0;
        const dirtyMoneyValue = playerItems['Dinheiro Sujo'] || 0;

        // Calcula o valor bruto dos filés
        for (const itemName in playerItems) {
            if (ITEM_VALUES[itemName]) {
                grossFilesValue += playerItems[itemName] * ITEM_VALUES[itemName];
            }
        }
        
        // O valor total ANTES de qualquer lavagem
        const totalGrossValue = grossFilesValue + dirtyMoneyValue;

        // O valor final DEPOIS de aplicar a taxa de 15% sobre TUDO
        const finalWashedValue = totalGrossValue * 0.85;

        const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Atualiza a interface
        calculatorElements.filesValue.textContent = formatCurrency(grossFilesValue);
        calculatorElements.grandTotal.textContent = formatCurrency(totalGrossValue);
        calculatorElements.finalWashed.textContent = formatCurrency(finalWashedValue);
    }

    displayItems('Biel', bielItems, bielItemsDiv);
    displayItems('Rafitos', rafitosItems, rafitosItemsDiv);
    
    updatePlayerCalculator(bielItems, bielCalculator);
    updatePlayerCalculator(rafitosItems, rafitosCalculator);
});