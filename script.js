// =================================================================
// PASSO IMPORTANTE: COLE AQUI A CONFIGURAÇÃO DO SEU FIREBASE
// Substitua todo este bloco pelas chaves que você pegou do site.
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

// Referências para os elementos do HTML
const itemForm = document.getElementById('item-form');
const historyLog = document.getElementById('history-log');
const bielItemsDiv = document.getElementById('biel-items');
const rafitosItemsDiv = document.getElementById('rafitos-items'); // MUDANÇA DE NOME
const suggestionButtonsDiv = document.getElementById('suggestion-buttons');
const userSelector = document.getElementById('user-selector');
const actionSelector = document.getElementById('action-selector');

// Lógica dos botões de seleção
userSelector.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        userSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
    }
});

actionSelector.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        actionSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
    }
});

// Variáveis para guardar o estado do inventário
let bielItems = {};
let rafitosItems = {}; // MUDANÇA DE NOME

// FUNÇÃO PRINCIPAL: REGISTRAR UMA AÇÃO
itemForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const user = userSelector.querySelector('.selected').dataset.user;
    const action = actionSelector.querySelector('.selected').dataset.action;
    const itemName = document.getElementById('item-name').value.trim();
    const quantity = parseInt(document.getElementById('item-quantity').value);

    if (!itemName || quantity <= 0) {
        alert('Por favor, preencha o nome do item e a quantidade corretamente.');
        return;
    }

    if (action === 'tirou') {
        const currentInventory = (user === 'Biel') ? bielItems : rafitosItems; // MUDANÇA DE NOME
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
        itemForm.reset();
        document.getElementById('item-name').focus();
    }).catch((error) => {
        console.error("Erro ao registrar transação: ", error);
        alert('Ocorreu um erro ao registrar. Tente novamente.');
    });
});


// FUNÇÃO MÁGICA: OUVIR E ATUALIZAR TUDO EM TEMPO REAL
db.collection('transacoes').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
    // Limpeza inicial
    historyLog.innerHTML = '';
    bielItemsDiv.innerHTML = '';
    rafitosItemsDiv.innerHTML = ''; // MUDANÇA DE NOME
    suggestionButtonsDiv.innerHTML = '';
    bielItems = {};
    rafitosItems = {}; // MUDANÇA DE NOME
    const itemFrequencies = {};

    // Primeiro loop: preenche o histórico e conta a frequência dos itens
    snapshot.docs.forEach(doc => {
        const transacao = doc.data();
        const logEntry = document.createElement('p');
        logEntry.innerHTML = `<span>${transacao.user}</span> ${transacao.action} <span>${transacao.quantity}x ${transacao.itemName}</span>`;
        historyLog.appendChild(logEntry);
        itemFrequencies[transacao.itemName] = (itemFrequencies[transacao.itemName] || 0) + 1;
    });
    
    // Segundo loop: calcula o inventário final
    snapshot.docs.slice().reverse().forEach(doc => {
        const transacao = doc.data();
        const itemsList = transacao.user === 'Biel' ? bielItems : rafitosItems; // MUDANÇA DE NOME
        const currentQty = itemsList[transacao.itemName] || 0;

        if (transacao.action === 'colocou') {
            itemsList[transacao.itemName] = currentQty + transacao.quantity;
        } else {
            itemsList[transacao.itemName] = currentQty - transacao.quantity;
        }
    });

    // Função para exibir os itens nas caixas
    function displayItems(player, playerItems, divElement) {
        Object.keys(playerItems).sort().forEach(itemName => {
            const quantity = playerItems[itemName];
            if (quantity > 0) {
                const itemEntry = document.createElement('p');
                itemEntry.textContent = `${quantity}x ${itemName}`;
                
                // Evento de clique para preencher o formulário
                itemEntry.addEventListener('click', () => {
                    userSelector.querySelectorAll('button').forEach(btn => {
                        btn.classList.toggle('selected', btn.dataset.user === player);
                    });
                    actionSelector.querySelectorAll('button').forEach(btn => {
                        btn.classList.toggle('selected', btn.dataset.action === 'tirou');
                    });
                    document.getElementById('item-name').value = itemName;
                    // --- MUDANÇA PRINCIPAL AQUI ---
                    // Preenche com a quantidade total disponível do item
                    document.getElementById('item-quantity').value = quantity; 
                    document.getElementById('item-quantity').focus(); // Foca no campo de quantidade
                });

                divElement.appendChild(itemEntry);
            }
        });
    }

    displayItems('Biel', bielItems, bielItemsDiv);
    displayItems('Rafitos', rafitosItems, rafitosItemsDiv); // MUDANÇA DE NOME
    
    // Gerar botões de sugestão
    const sortedItems = Object.entries(itemFrequencies).sort((a, b) => b[1] - a[1]);
    const topItems = sortedItems.slice(0, 4);

    topItems.forEach(([itemName, count]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn-suggestion';
        button.textContent = itemName;
        button.addEventListener('click', () => {
            document.getElementById('item-name').value = itemName;
            document.getElementById('item-name').focus();
        });
        suggestionButtonsDiv.appendChild(button);
    });
});