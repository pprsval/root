<script>
  fetch('../data/writings.json')
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(data => {
      console.log('JSON betöltve:', data);   // <‑ Nézd meg a konzolt!
      document.body.insertAdjacentHTML('beforeend',
        '<pre>' + JSON.stringify(data, null, 2) + '</pre>');
    })
    .catch(err => console.error('Hiba:', err));
</script>