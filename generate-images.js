const fs = require('fs');

const files = fs.readdirSync('./assets/photo')
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort()
    .reverse();

fs.writeFileSync(
    './images.js',
    `const images = ${JSON.stringify(files, null, 2)};`
);

console.log("images.js frissítve");