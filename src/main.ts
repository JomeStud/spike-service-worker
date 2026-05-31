/// <reference lib="dom" />

import { initNotificationControls, setNotificationServiceWorkerRegistration } from "./notification.js";

export {};

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

type DisplayMode = "browser" | "standalone";

type OfflineState = {
  counter: number;
  notes: string;
  visits: number;
  lastVisit: string;
};

const STORAGE_KEY = "offline-pwa-spike-state";

const elements = {
  networkStatus: document.querySelector<HTMLParagraphElement>("#network-status"),
  displayMode: document.querySelector<HTMLParagraphElement>("#display-mode"),
  serviceWorkerStatus: document.querySelector<HTMLParagraphElement>("#service-worker-status"),
  visitCount: document.querySelector<HTMLParagraphElement>("#visit-count"),
  lastVisit: document.querySelector<HTMLParagraphElement>("#last-visit"),
  counterButton: document.querySelector<HTMLButtonElement>("#counter-button"),
  counterValue: document.querySelector<HTMLParagraphElement>("#counter-value"),
  notesInput: document.querySelector<HTMLTextAreaElement>("#notes-input"),
  probeButton: document.querySelector<HTMLButtonElement>("#probe-button"),
  probeOutput: document.querySelector<HTMLPreElement>("#probe-output")
};

const getDisplayMode = (): DisplayMode => {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;

  return isStandalone ? "standalone" : "browser";
};

const readState = (): OfflineState => {
  const emptyState: OfflineState = {
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
  } catch {
    return emptyState;
  }
};

const writeState = (state: OfflineState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

let state = readState();

const render = (): void => {
  elements.networkStatus!.textContent = navigator.onLine ? "Online" : "Offline";
  elements.displayMode!.textContent = getDisplayMode() === "standalone" ? "Standalone" : "Browser tab";
  elements.visitCount!.textContent = String(state.visits);
  elements.lastVisit!.textContent = state.lastVisit || "First visit in this browser";
  elements.counterValue!.textContent = `Counter: ${state.counter}`;
  elements.notesInput!.value = state.notes;
};

const updateStatus = (message: string): void => {
  elements.serviceWorkerStatus!.textContent = message;
};

const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!("serviceWorker" in navigator)) {
    updateStatus("Not supported in this browser");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("./service-worker.js");
    if (registration.installing) {
      updateStatus("Installing…");
    } else if (registration.waiting) {
      updateStatus("Waiting to activate…");
    } else {
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
    setNotificationServiceWorkerRegistration(registration);
    updateStatus("Ready");
    return registration;
  } catch {
    updateStatus("Registration failed");
    return null;
  }
};

const loadProbe = async (): Promise<void> => {
  if (!elements.probeOutput) {
    return;
  }

  elements.probeOutput.textContent = "Loading probe…";

  try {
    const response = await fetch("./offline-data.json");
    const probeData = (await response.json()) as { message: string; checkpoints: string[] };

    elements.probeOutput.textContent = [
      probeData.message,
      "",
      ...probeData.checkpoints.map((checkpoint, index) => `${index + 1}. ${checkpoint}`)
    ].join("\n");
  } catch {
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
    notes: (event.target as HTMLTextAreaElement).value
  };
  writeState(state);
});

elements.probeButton?.addEventListener("click", () => {
  void loadProbe();
});

window.addEventListener("online", render);
window.addEventListener("offline", render);
window.matchMedia("(display-mode: standalone)").addEventListener("change", render);

void initNotificationControls();
void registerServiceWorker();
