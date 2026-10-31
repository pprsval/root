// Local previews must not record visits.
if (['peresvalentin.xyz','www.peresvalentin.xyz'].includes(location.hostname)) {
 const script = document.createElement('script');
 script.dataset.goatcounter = 'https://vpe.goatcounter.com/count';
 script.async = true; script.src = 'https://gc.zgo.at/count.js'; document.head.append(script);
}
