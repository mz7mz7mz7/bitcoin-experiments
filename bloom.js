var BloomFilter = require('bloom-filter');

var falsePositiveRate = 0.01;

var b1Arr = [
    new Buffer('723926e5f2c3c079c67437da83fea1b24a7eabba', 'hex'),
    new Buffer('0efc59ff650bb1381722cc8228146243a38627e0', 'hex'),
    new Buffer('c3c01f1386d8303e6071e8a19e651b01d4c7448b', 'hex'),
    new Buffer('89db5c3d38b763d86149dcfd46b083d15bede598', 'hex'),
    new Buffer('ca868999be8f81083233c2ce5f500bf67aa194d8', 'hex'),
];
var b1 = BloomFilter.create(b1Arr.length, falsePositiveRate);
b1Arr.forEach(function(el) {b1.insert(el)});

var b2Arr = [
    new Buffer('3f6b5fdb5a732b2135f92cdc97d555d25121470f', 'hex'),
    new Buffer('49cf380abdb86449efc694988bf0f447739f73cd', 'hex'),
    new Buffer('9a58e9696fe10b44bf2c91b2cb18c2ded5930417', 'hex'),
    new Buffer('f4a101541f3d0eed6fce73222b43f753293af88d', 'hex'),
    new Buffer('304495fa9ac96028ab9d71dc5783598cdf1c30cc', 'hex'),
    new Buffer('8bc89f3d3e8016984bcea6a86a81f618fcd5c378', 'hex'),
    new Buffer('ff9baa5b596c5aeedd9c2c41ade6883ffa88bc1f', 'hex'),
];
var b2 = BloomFilter.create(b2Arr.length, falsePositiveRate);
b2Arr.forEach(function(el) {b2.insert(el)});

var b3Arr = [
    new Buffer('3f6b5fdb5a732b2135f92cdc97d555d25121470f', 'hex'),
    new Buffer('834bc94d70b63b65abb3e4b642ff621516d258d6', 'hex'),
    new Buffer('49cf380abdb86449efc694988bf0f447739f73cd', 'hex'),
    new Buffer('9a58e9696fe10b44bf2c91b2cb18c2ded5930417', 'hex'),
    new Buffer('f4a101541f3d0eed6fce73222b43f753293af88d', 'hex'),
    new Buffer('304495fa9ac96028ab9d71dc5783598cdf1c30cc', 'hex'),
    new Buffer('0df5e95de7eb5914924600fbb6b2307dea0df007', 'hex'),
    new Buffer('8bc89f3d3e8016984bcea6a86a81f618fcd5c378', 'hex'),
    new Buffer('b1ed751ef06b2793130ffb59ca8bc805d3405bfd', 'hex'),
    new Buffer('40a26f8b9187750169a461b377230fa86522a753', 'hex'),
    new Buffer('ff9baa5b596c5aeedd9c2c41ade6883ffa88bc1f', 'hex'),
];
var b3 = BloomFilter.create(b3Arr.length, falsePositiveRate);
b3Arr.forEach(function(el) {b3.insert(el)});

var b4Arr = [
    new Buffer('49cf380abdb86449efc694988bf0f447739f73cd', 'hex'),
    new Buffer('e7c1d0fc0921be651a89786b6e56b3a1280e791c', 'hex'),
    new Buffer('b9eef5457e52e00128df30a19b060e02ba51710a', 'hex'),
    new Buffer('304495fa9ac96028ab9d71dc5783598cdf1c30cc', 'hex'),
    new Buffer('0df5e95de7eb5914924600fbb6b2307dea0df007', 'hex'),
    new Buffer('8bc89f3d3e8016984bcea6a86a81f618fcd5c378', 'hex'),
    new Buffer('88a96a29b741fb93cbcb6aba5ecec48dd18c2d5f', 'hex'),
    new Buffer('ff9baa5b596c5aeedd9c2c41ade6883ffa88bc1f', 'hex'),
    new Buffer('dfa71b880f8b7eefd1b758a2e7e679a905872805', 'hex'),
];
var b4 = BloomFilter.create(b4Arr.length, falsePositiveRate);
b4Arr.forEach(function(el) {b4.insert(el)});

var bs = [b1, b2, b3, b4];
var bArrs = [b1Arr, b2Arr, b3Arr, b4Arr];

for (var i = 0; i < bs.length; i++) {
    var b = bs[i];
    for (var j = 0; j < bs.length; j++) {
        if (i == j) {
            continue;
        }
        var bArr = bArrs[j];
        var included = true;
        var howMany = 0;
        for (var k = 0; k < bArr.length; k++) {
            if (b.contains(bArr[k])) {
                howMany++;
            } else {
                included = false;
            }
        }
        if (included) {
            console.info('All elements of B' + (j+1) + ' are covered by B' + (i+1));
        } else {
            if (howMany > 0) {
                console.info((howMany) + '/' + (bArr.length) + ' elements of B' + (j+1) + ' are covered by B' + (i+1));
            } else {
                console.info('B' + (j+1) + ' and B' + (i+1) + ' appears to belong to different users');
            }
        }
    }
}


// Which addresses of B3 are covered by B2 and B4:
var b3TrueAddresses = new Array(b3Arr.length).fill(false);
for (var i = 0; i < b3Arr.length; i++) {
    if (b2.contains(b3Arr[i]) || b4.contains(b3Arr[i])) {
        b3TrueAddresses[i] = true;
    }
}
console.info('B3 arr: ' + b3TrueAddresses);
console.info('B3 false positives: ');
b3TrueAddresses.forEach(function(el, idx){if (!el) console.info(''+idx+',')});

// Which addresses of B4 are covered by B2 and B3:
var b4TrueAddresses = new Array(b4Arr.length).fill(false);
for (var i = 0; i < b4Arr.length; i++) {
    if (b2.contains(b4Arr[i]) || b3.contains(b4Arr[i])) {
        b4TrueAddresses[i] = true;
    }

}
console.info('B4 arr: ' + b4TrueAddresses);
console.info('B4 false positives: ');
b4TrueAddresses.forEach(function(el, idx){if (!el) console.info(''+idx+',')});