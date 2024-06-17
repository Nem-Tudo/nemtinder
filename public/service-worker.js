self.addEventListener('push', function (event) {
    const data = event.data.json();
    console.log("Received notification", data)
    event.waitUntil(
        self.registration.showNotification(data.title, data.options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const data = event.data.json();
    event.waitUntil(clients.openWindow(data.data.openURL));
});
