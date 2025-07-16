  const firebaseConfig = {
    apiKey: "AIzaSyDKMNlXG2WeR6rF4LsDrPgdReGLE1I9d9s",
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

// Referências para os elementos do HTML que vamos usar
const itemForm = document.getElementById('item-form');
const historyLog = document.getElementById('history-log');
const gabrielItemsDiv = document.getElementById('gabriel-items');
const rafaelItemsDiv = document.getElementById('rafael-items');
const itemSuggestions = document.getElementById('item-suggestions');

// --- FUNÇÃO PRINCIPAL: REGISTRAR UMA AÇÃO ---
itemForm.addEventListener('submit', (e) => {
e.preventDefault(); // Impede que a página recarregue ao enviar

// Pega os valores do formulário
const user = document.getElementById('user-select').value;
const action = document.getElementById('action-select').value;
const itemName = document.getElementById('item-name').value.trim();
const quantity = parseInt(document.getElementById('item-quantity').value);

// Validação simples
if (!itemName || quantity <= 0) {
alert('Por favor, preencha o nome do item e a quantidade corretamente.');
return;
}

// Adiciona a nova transação ao banco de dados
db.collection('transacoes').add({
user: user,
action: action,
itemName: itemName,
quantity: quantity,
timestamp: firebase.firestore.FieldValue.serverTimestamp() // Pega a hora do servidor
}).then(() => {
console.log('Transação registrada com sucesso!');
// Limpa os campos do formulário após o envio
itemForm.reset();
}).catch((error) => {
console.error("Erro ao registrar transação: ", error);
alert('Ocorreu um erro ao registrar. Tente novamente.');
});
});
