const fs = require('fs');
const pdfPackage = require('pdf-parse');

console.log('Package:', pdfPackage);

const dataBuffer = fs.readFileSync('/Users/chiuyongren/Desktop/AI dev/附件3-建議書徵求文件.pdf');

if (typeof pdfPackage === 'function') {
    pdfPackage(dataBuffer).then(function (data) {
        console.log('Text Content Length:', data.text.length);
        console.log(data.text.substring(0, 1000)); // Print first 1000 chars
    }).catch(console.error);
} else {
    console.log("Package is not a function");
}
