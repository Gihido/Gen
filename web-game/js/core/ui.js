import { NotificationType } from './utils.js';

export function showNotification(message, type = NotificationType.INFO, duration = 2500) {
  const root = document.getElementById('notification-container');
  const node = document.createElement('div');
  node.className = `notification ${type}`;
  node.textContent = message;
  root.appendChild(node);
  setTimeout(() => node.remove(), duration);
}

export function openModal(contentHtml) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal">${contentHtml}</div>`;
  root.classList.remove('hidden');
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  root.classList.add('hidden');
  root.innerHTML = '';
}

export function statBar(value, max, cls = 'hp') {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, Math.floor((value / max) * 100)));
  return `<div class="progress"><span class="${cls}" style="width:${pct}%"></span></div>`;
}
