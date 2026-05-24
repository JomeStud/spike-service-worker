/// <reference lib="dom" />
const STORAGE_KEY = "offline-pwa-spike-state";
const elements = {
    networkStatus: document.querySelector("#network-status"),
    displayMode: document.querySelector("#display-mode"),
    serviceWorkerStatus: document.querySelector("#service-worker-status"),
    visitCount: document.querySelector("#visit-count"),
    lastVisit: document.querySelector("#last-visit"),
    counterButton: document.querySelector("#counter-button"),
    counterValue: document.querySelector("#counter-value"),
    notesInput: document.querySelector("#notes-input"),
    probeButton: document.querySelector("#probe-button"),
    probeOutput: document.querySelector("#probe-output")
};
const getDisplayMode = () => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone === true;
    return isStandalone ? "standalone" : "browser";
};
const readState = () => {
    const emptyState = {
        counter: 0,
        notes: "",
        visits: 0,
        lastVisit: ""
    };
    try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (!savedState) {
            return emptyState;
        }
        return {
            ...emptyState,
            ...JSON.parse(savedState)
        };
    }
    catch {
        return emptyState;
    }
};
const writeState = (state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};
let state = readState();
const render = () => {
    elements.networkStatus.textContent = navigator.onLine ? "Online" : "Offline";
    elements.displayMode.textContent = getDisplayMode() === "standalone" ? "Standalone" : "Browser tab";
    elements.visitCount.textContent = String(state.visits);
    elements.lastVisit.textContent = state.lastVisit || "First visit in this browser";
    elements.counterValue.textContent = `Counter: ${state.counter}`;
    elements.notesInput.value = state.notes;
};
const updateStatus = (message) => {
    elements.serviceWorkerStatus.textContent = message;
};
const registerServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
        updateStatus("Not supported in this browser");
        return;
    }
    try {
        const registration = await navigator.serviceWorker.register("./service-worker.js");
        if (registration.installing) {
            updateStatus("Installing…");
        }
        else if (registration.waiting) {
            updateStatus("Waiting to activate…");
        }
        else {
            updateStatus("Ready");
        }
        registration.addEventListener("updatefound", () => {
            updateStatus("Updating cache…");
            const worker = registration.installing;
            worker?.addEventListener("statechange", () => {
                updateStatus(worker.state === "activated" ? "Ready" : `Worker state: ${worker.state}`);
            });
        });
        await navigator.serviceWorker.ready;
        updateStatus("Ready");
    }
    catch {
        updateStatus("Registration failed");
    }
};
const loadProbe = async () => {
    if (!elements.probeOutput) {
        return;
    }
    elements.probeOutput.textContent = "Loading probe…";
    try {
        const response = await fetch("./offline-data.json");
        const probeData = (await response.json());
        elements.probeOutput.textContent = [
            probeData.message,
            "",
            ...probeData.checkpoints.map((checkpoint, index) => `${index + 1}. ${checkpoint}`)
        ].join("\n");
    }
    catch {
        elements.probeOutput.textContent = "Probe fetch failed. If this happens online, the app shell is not cached yet.";
    }
};
state = {
    ...state,
    visits: state.visits + 1,
    lastVisit: new Date().toLocaleString()
};
writeState(state);
render();
elements.counterButton?.addEventListener("click", () => {
    state = {
        ...state,
        counter: state.counter + 1
    };
    writeState(state);
    render();
});
elements.notesInput?.addEventListener("input", (event) => {
    state = {
        ...state,
        notes: event.target.value
    };
    writeState(state);
});
elements.probeButton?.addEventListener("click", () => {
    void loadProbe();
});
window.addEventListener("online", render);
window.addEventListener("offline", render);
window.matchMedia("(display-mode: standalone)").addEventListener("change", render);
void registerServiceWorker();
export {};
