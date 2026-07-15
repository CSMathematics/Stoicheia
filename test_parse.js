const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, 'src/components/Preview.tsx'), 'utf-8');

// I will insert a console.log(transform) so that in the browser it prints.
// But we don't have browser console access.
// Let's modify the app to display transform values on the screen!
