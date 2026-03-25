// =====================================
// 🔥 FIREBASE INIT (SAFE ADD)
// =====================================
(function () {
    const firebaseConfig = {
        apiKey: "AIzaSyCfQTN7UTRcW9lBm-rhRqyAOcT5gFZDJIs",
        authDomain: "sss-qr-system-39b59.firebaseapp.com",
        projectId: "sss-qr-system-39b59",
        storageBucket: "sss-qr-system-39b59.firebasestorage.app",
        messagingSenderId: "81090026028",
        appId: "1:81090026028:web:91dfd833462e2d95434f89"
    };

    if (typeof firebase !== "undefined") {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        window.db = firebase.firestore();
    } else {
        console.warn("⚠️ Firebase not loaded");
    }
})();


// =====================================
// 🔥 FIREBASE AUTO SAVE FUNCTION
// =====================================
async function autoSaveToFirebase(formData) {
    try {
        if (!window.db) return;

        const draftId =
            localStorage.getItem("form1DraftId") ||
            "DRAFT_" + Date.now();

        await window.db.collection("sss-drafts").doc(draftId).set({
            ...formData,
            updatedAt: new Date().toISOString()
        });

        localStorage.setItem("form1DraftId", draftId);

        console.log("☁️ Firebase synced:", draftId);
    } catch (error) {
        console.error("❌ Firebase error:", error);
    }
}


// =====================================
// 🔥 EXTEND EXISTING AUTO SAVE
// (NON-DESTRUCTIVE PATCH)
// =====================================
(function () {
    const originalSetItem = localStorage.setItem;

    localStorage.setItem = function (key, value) {
        // tawagin original
        originalSetItem.apply(this, arguments);

        // 🔥 trigger Firebase kapag form1 save
        if (key === "form1AutoSave") {
            try {
                const parsed = JSON.parse(value);
                autoSaveToFirebase(parsed);
            } catch (e) {
                console.warn("⚠️ JSON parse error");
            }
        }
    };
})();


// =====================================
// 🔥 OPTIONAL: LOAD INDICATOR
// =====================================
function showAutoSaveStatus(message = "Saved ✔") {
    let el = document.getElementById("autosaveStatus");

    if (!el) {
        el = document.createElement("div");
        el.id = "autosaveStatus";
        el.style.position = "fixed";
        el.style.bottom = "20px";
        el.style.right = "20px";
        el.style.background = "#003c8f";
        el.style.color = "#fff";
        el.style.padding = "8px 15px";
        el.style.borderRadius = "20px";
        el.style.fontSize = "12px";
        el.style.zIndex = "9999";
        document.body.appendChild(el);
    }

    el.textContent = message;
    el.style.opacity = "1";

    setTimeout(() => {
        el.style.opacity = "0";
    }, 1500);
}


// =====================================
// 🔥 HOOK STATUS SA FIREBASE SAVE
// =====================================
(async function () {
    const originalAutoSave = autoSaveToFirebase;

    autoSaveToFirebase = async function (data) {
        showAutoSaveStatus("Saving...");
        await originalAutoSave(data);
        showAutoSaveStatus("Saved ✔");
    };
})();