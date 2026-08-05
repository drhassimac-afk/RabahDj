// مخزن إشعارات مركزي بسيط (بدون مكتبات خارجية)
let items = [];
let listeners = [];

export function addNotification(type, text) {
  const n = { id: Date.now().toString() + Math.random().toString(36).slice(2), type, text, time: new Date() };
  items = [n, ...items].slice(0, 100);
  listeners.forEach((cb) => cb(items));
}

export function getNotifications() {
  return items;
}

export function subscribe(cb) {
  listeners.push(cb);
  return () => { listeners = listeners.filter((l) => l !== cb); };
}

export function clearNotifications() {
  items = [];
  listeners.forEach((cb) => cb(items));
}

export function removeNotification(id) {
  items = items.filter((n) => n.id !== id);
  listeners.forEach((cb) => cb(items));
}
