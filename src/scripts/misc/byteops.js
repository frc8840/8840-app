
function convertIntToBinaryString(int) {
    //add on 0s to the front of the string until it is 8 characters long
    let binaryString = int.toString(2);
    while (binaryString.length < 8) {
        binaryString = "0" + binaryString;
    }
    return binaryString;
}

function convertBinaryToHexadecimalString(binaryArray=new Array(8).fill('00000000')) {
    //Convert a 8 byte binary array to a hexadecimal string
    //Example input: ["00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000"]
    //Example output: 0x0000000000000000
    let hexString = "0x";
    for (let i = 0; i < binaryArray.length; i++) {
        hexString += parseInt(binaryArray[i], 2).toString(16);
    }
    return hexString;
}

function convertByteArrayToDouble(byteArray) {
    var buffer = new ArrayBuffer(8);
    var view = new DataView(buffer);
    for (var i = 0; i < 8; i++) {
        view.setUint8(i, byteArray[i]);
    }
    return view.getFloat64(0);
}

function libConvertByteArrayToDouble(byteArray) {
    if (byteArray.length != 9) return 0;

    let binaryTotals = [];
    for (let i = 0; i < 9; i++) {
        binaryTotals.push(byteArray[i].charCodeAt(0));
    }

    console.log(binaryTotals[0])

    let binaryStringArray = [];
    for (let i = 0; i < binaryTotals.length; i++) {
        binaryStringArray.push(convertIntToBinaryString(binaryTotals[i]));
    }

    console.log(binaryStringArray)

    //Now we have a list of binary strings, we need to convert it to a single string
    binaryStringArray = binaryStringArray.join("");

    //check the first bit to see if it's negative
    let isNegative = binaryStringArray[0] == "1";

    //get the exponent
    let exponent = binaryStringArray.slice(1, 12);
    exponent = parseInt(exponent, 2);

    //get the mantissa
    let mantissa = binaryStringArray.slice(12, 64);
    mantissa = parseInt(mantissa, 2);
    
    //calculate the value
    let value = 0;
    if (exponent == 0) {
        value = mantissa * Math.pow(2, -1022);
    } else {
        value = (1 + mantissa * Math.pow(2, -52)) * Math.pow(2, exponent - 1023);
    }

    if (isNegative) {
        value *= -1;
    }

    return value;
}

function convertByteArrayToInt(byteArray) {
    //Byte array is a list of bytes encoded in java from an int
    //We need to convert it to a string, then parse it as an int

    //GET char code from string at each index
    let binaryTotals = [];
    for (let i = 0; i < byteArray.length; i++) {
        binaryTotals.push(byteArray[i].charCodeAt(0));
    }

    let binaryStringArray = [];
    for (let i = 0; i < binaryTotals.length; i++) {
        binaryStringArray.push(convertIntToBinaryString(binaryTotals[i]));
    }
    //Now we have a list of binary strings, we need to convert it to a single string
    binaryStringArray = binaryStringArray.join("");

    //Now we have a single string of binary, we need to convert it to an int32
    return parseInt(binaryStringArray, 2);
}

function convertByteArrayToBoolean(byteArray) {
    return byteArray[0] == 1;
}

function convertByteArrayToString(byteArray) {
    return String.fromCharCode.apply(null, byteArray);
}

function splitByteArray(byteArray, chunkSize) {
    var chunks = [];
    for (var i = 0; i < byteArray.length; i += chunkSize) {
        chunks.push(byteArray.slice(i, i + chunkSize));
    }
    return chunks;
}

export default { convertByteArrayToDouble, convertByteArrayToInt, convertByteArrayToBoolean, convertByteArrayToString, splitByteArray, libConvertByteArrayToDouble };
export { convertByteArrayToDouble, convertByteArrayToInt, convertByteArrayToBoolean, convertByteArrayToString, splitByteArray, libConvertByteArrayToDouble };