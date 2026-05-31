const elements = {
    notificationText: document.querySelector("#notification-text"),
    notificationButton: document.querySelector("#notification-button"),
    notificationStatus: document.querySelector("#notification-status")
};
let serviceWorkerRegistration = null;
const updateNotificationStatus = (message) => {
    elements.notificationStatus.textContent = message;
};
const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        updateNotificationStatus("Notifications are not supported.");
        return "denied";
    }
    if (Notification.permission === "granted") {
        updateNotificationStatus("Permission granted.");
        return "granted";
    }
    const permission = await Notification.requestPermission();
    updateNotificationStatus(`Permission: ${permission}`);
    return permission;
};
const showCustomNotification = async (text) => {
    if (!text) {
        updateNotificationStatus("Please enter a notification message.");
        return;
    }
    if (!("Notification" in window)) {
        updateNotificationStatus("Notifications are not supported.");
        return;
    }
    if (Notification.permission !== "granted") {
        const permission = await requestNotificationPermission();
        if (permission !== "granted") {
            updateNotificationStatus("Notification permission is required.");
            return;
        }
    }
    if (serviceWorkerRegistration?.showNotification) {
        try {
            await serviceWorkerRegistration.showNotification("PWA test notification", {
                body: text,
                icon: "./icons/icon-192.png",
                badge: "./icons/icon-192.png",
                data: { message: text }
            });
            updateNotificationStatus("Notification sent from service worker.");
            return;
        }
        catch {
            updateNotificationStatus("Notification failed, falling back to page notification.");
        }
    }
    try {
        new Notification("PWA test notification", {
            body: text,
            icon: "./icons/icon-192.png"
        });
        updateNotificationStatus("Notification shown.");
    }
    catch {
        updateNotificationStatus("Unable to show notification.");
    }
};
export const setNotificationServiceWorkerRegistration = (registration) => {
    serviceWorkerRegistration = registration;
};
export const initNotificationControls = () => {
    elements.notificationButton?.addEventListener("click", () => {
        const text = elements.notificationText?.value.trim() ?? "";
        void showCustomNotification(text);
    });
    if ("Notification" in window) {
        updateNotificationStatus(`Permission: ${Notification.permission}`);
    }
};
