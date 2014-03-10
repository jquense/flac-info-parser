'use strict';

exports.getBit = function (n, off, pos){
    return !!(n[off] & (1 << pos));
}


exports.readUInt24BE = function (buf, off) {
    return (((buf[off] << 8) + buf[off + 1]) << 8) + buf[off + 2];
}

exports.readUInt24LE = function (buf, off) {
    return (((buf[off + 2] << 8) + buf[off + 1]) << 8) + buf[off];
}
