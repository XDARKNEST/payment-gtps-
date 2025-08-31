import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, onSnapshot, query, where, orderBy, onSnapshot as onSnapQuery } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnXwWJMS65N45KU-tFe6dbhOkqoLPjHek",
  authDomain: "gtpspaymentv1.firebaseapp.com",
  projectId: "gtpspaymentv1",
  storageBucket: "gtpspaymentv1.appspot.com",
  messagingSenderId: "109225654371",
  appId: "1:109225654371:web:a7f3a05b97183e3f9ee056"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("orderForm");
const summaryBox = document.getElementById("summaryBox");
const loader = document.getElementById("loader");
const historyBox = document.getElementById("historyBox");

const hargaList = {
  "2 Premium WLS - 1 WLS": {unit:"WLS", value:1},
  "5 Premium WLS - 2 WLS": {unit:"WLS", value:2},
  "10 Premium WLS - 4 WLS": {unit:"WLS", value:4},
  "20 Premium WLS - 7 WLS": {unit:"WLS", value:7},
  "VIP - 1 DL": {unit:"DL", value:1},
  "SUPER VIP - 3 DL": {unit:"DL", value:3},
  "MODS - 5 DL": {unit:"DL", value:5},
  "ADMIN - 8 DL": {unit:"DL", value:8},
  "COMMUNITY MANAGER - 13 DL": {unit:"DL", value:13},
  "CREATOR - 15 DL": {unit:"DL", value:15},
  "GOD - 20 DL": {unit:"DL", value:20}
};

// Ringkasan
form.addEventListener("change", () => {
  const username = document.getElementById("username").value;
  const item = document.getElementById("item").value;
  const payment = document.getElementById("payment").value;

  if(username && item && payment){
    const harga = hargaList[item];
    const konversiWLS = harga.unit === "DL" ? harga.value * 100 : harga.value;

    summaryBox.style.display = "block";
    summaryBox.innerHTML = `
      <strong>Ringkasan Order:</strong><br><br>
      👤 Username: <b>${username}</b><br>
      🎁 Item: <b>${item}</b><br>
      💳 Pembayaran: <b>${payment}</b><br>
      💰 Total: <b>${harga.value} ${harga.unit}</b> 
      <small>(≈ ${konversiWLS} WLS)</small><br><br>
      <span id="orderStatus">📌 Status: <b>Pending...</b></span>
    `;
  } else {
    summaryBox.style.display = "none";
  }
});

// Submit order
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  loader.style.display = "flex";

  const username = document.getElementById("username").value;
  const item = document.getElementById("item").value;
  const payment = document.getElementById("payment").value;
  const harga = hargaList[item];
  const konversiWLS = harga.unit === "DL" ? harga.value * 100 : harga.value;

  try {
    const docRef = await addDoc(collection(db, "orders"), {
      username,
      item,
      payment,
      total: `${harga.value} ${harga.unit} (≈ ${konversiWLS} WLS)`,
      status: "pending",
      createdAt: new Date()
    });

    loader.style.display = "none";

    // Pantau realtime status
    onSnapshot(doc(db, "orders", docRef.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const statusEl = document.getElementById("orderStatus");
        if(statusEl){
          statusEl.innerHTML = `📌 Status: <b class="status ${data.status}">${data.status}</b>`;
        }
      }
    });

    // Redirect WhatsApp admin
    const adminWA = "6281649561209";
    const pesan = `Halo Admin, saya ingin order:\n\n👤 Username: ${username}\n🎁 Item: ${item}\n💳 Payment: ${payment}\n💰 Total: ${harga.value} ${harga.unit} (≈ ${konversiWLS} WLS)\n\n📌 Status: Pending...`;
    window.open(`https://wa.me/${adminWA}?text=${encodeURIComponent(pesan)}`, "_blank");

    // Tampilkan riwayat user
    loadHistory(username);

  } catch (err) {
    loader.style.display = "none";
    console.error(err);
    alert("❌ Gagal menyimpan order.");
  }
});

// Load riwayat transaksi user
function loadHistory(username){
  const q = query(collection(db,"orders"), where("username","==",username), orderBy("createdAt","desc"));
  onSnapQuery(q,(snapshot)=>{
    if(snapshot.empty){
      historyBox.innerHTML = "<p>Belum ada transaksi.</p>";
    }else{
      historyBox.innerHTML = "";
      snapshot.forEach(doc=>{
        const d = doc.data();
        historyBox.innerHTML += `
          <div class="history-item">
            🎁 <b>${d.item}</b> - 💳 ${d.payment}<br>
            💰 ${d.total}<br>
            📌 Status: <span class="status ${d.status}">${d.status}</span><br>
            🕒 ${d.createdAt.toDate().toLocaleString()}
          </div>
        `;
      });
    }
  });
                                                 }
