const input = document.querySelector('[data-search-index]');
const list = document.querySelector('#search-results');
const status = document.querySelector('#search-status');

interface SearchRecord {
  title: string;
  description: string;
  url: string;
  normalized: string;
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CO').replace(/[^a-z0-9ñ]+/g, ' ').trim();
}

if (input instanceof HTMLInputElement && list instanceof HTMLOListElement && status instanceof HTMLElement) {
  let records: SearchRecord[] | null = null;
  input.addEventListener('input', async () => {
    const query = normalize(input.value);
    list.replaceChildren();
    if (!query) { status.textContent = 'Escribe una palabra para comenzar.'; return; }
    if (!records) {
      const indexUrl = input.dataset.searchIndex;
      if (!indexUrl) { status.textContent = 'La búsqueda no está disponible.'; return; }
      const response = await fetch(indexUrl, { credentials: 'same-origin' });
      if (!response.ok) { status.textContent = 'La búsqueda no está disponible.'; return; }
      records = await response.json() as SearchRecord[];
    }
    const tokens = query.split(/\s+/);
    const matches = records.filter(record => tokens.every(token => record.normalized.includes(token))).slice(0, 20);
    for (const record of matches) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = record.url;
      link.textContent = record.title;
      const description = document.createElement('p');
      description.textContent = record.description;
      item.append(link, description);
      list.append(item);
    }
    status.textContent = `${matches.length} resultado${matches.length === 1 ? '' : 's'}.`;
  });
}
