// Firebase Cloud Messaging service worker (background notifications).
// The web app config below is public client configuration (it ships to every
// browser anyway). Replace it with your own project's config when self-hosting.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBRaBQgY04tqQIpKAiJEBhX0rO5Rq6MwcQ',
  authDomain: 'sales-order-management-730ed.firebaseapp.com',
  projectId: 'sales-order-management-730ed',
  storageBucket: 'sales-order-management-730ed.firebasestorage.app',
  messagingSenderId: '502919990343',
  appId: '1:502919990343:web:c22cf7c304703db414f562',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(() => {
  // Data-only handling: the app refetches orders when it is in the foreground.
  // In the background, the notification payload is displayed by FCM directly.
});
