(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff
var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined' && object.buffer instanceof ArrayBuffer) {
    return fromTypedArray(that, object)
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = String(string)

  if (string.length === 0) return 0

  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      return string.length
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return string.length * 2
    case 'hex':
      return string.length >>> 1
    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(string).length
    case 'base64':
      return base64ToBytes(string).length
    default:
      return string.length
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function toString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []
  var i = 0

  for (; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (leadSurrogate) {
        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        } else {
          // valid surrogate pair
          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
          leadSurrogate = null
        }
      } else {
        // no lead yet

        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else {
          // valid lead
          leadSurrogate = codePoint
          continue
        }
      }
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      leadSurrogate = null
    }

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x200000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":2,"ieee754":3,"is-array":4}],2:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],5:[function(require,module,exports){
/* jshint ignore:start */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _names = require('./names');

var _names2 = _interopRequireDefault(_names);

var _world = require('./world');

var _world2 = _interopRequireDefault(_world);

var _hq = require('./hq');

var _hq2 = _interopRequireDefault(_hq);

var _unit = require('./unit');

var _unit2 = _interopRequireDefault(_unit);

var _officers = require('./officers');

var _officers2 = _interopRequireDefault(_officers);

var Army = (function () {
  function Army() {
    _classCallCheck(this, Army);

    this.HQ = new _hq2['default']();
    this.HQ.officers = new _officers2['default'](this.HQ);

    this._unitId = 2;
    this.units = {
      corps: []
    };

    this.id = 1;
    this.generate('corp', _config2['default'].unitDepth);

    this.HQ.world = new _world2['default'](this.HQ);
  }

  _createClass(Army, [{
    key: 'generate',
    value: function generate(type, quantity, parent) {
      if (quantity === 0) {
        return;
      } else {
        var unit = new _unit2['default']();

        unit.id = this._unitId;
        this._unitId++;

        unit.type = type;

        if (parent) {
          unit.parentId = parent.id;
        } else {
          unit.parentId = 1;
        }

        switch (type) {
          case 'corp':
            unit.name = _names2['default'].corps[0];
            _names2['default'].corps.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('lgeneral', unit.id);

            this.units.corps.push(unit);

            this.generate('division', _config2['default'].unitDepth, unit);
            this.generate('corp', quantity - 1, parent);
            break;

          case 'division':
            unit.name = _names2['default'].divisions[0];
            _names2['default'].divisions.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('dgeneral', unit.id);

            parent.subunits.push(unit);

            this.generate('brigade', _config2['default'].unitDepth, unit);
            this.generate('division', quantity - 1, parent);
            break;

          case 'brigade':
            unit.name = _names2['default'].brigades[0];
            _names2['default'].brigades.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('bgeneral', unit.id);

            parent.subunits.push(unit);

            this.generate('regiment', _config2['default'].unitDepth, unit);
            this.generate('brigade', quantity - 1, parent);
            break;

          case 'regiment':
            unit.name = _names2['default'].regiments[0];
            _names2['default'].regiments.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('coronel', unit.id);

            parent.subunits.push(unit);

            this.generate('battalion', _config2['default'].unitDepth, unit);
            this.generate('regiment', quantity - 1, parent);
            break;

          case 'battalion':
            unit.name = _names2['default'].battalions[0];
            _names2['default'].battalions.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('lcoronel', unit.id);

            parent.subunits.push(unit);

            this.generate('company', _config2['default'].unitDepth, unit);
            this.generate('battalion', quantity - 1, parent);
            break;

          case 'company':
            unit.name = _names2['default'].companies[0];
            _names2['default'].companies.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('major', unit.id);

            parent.subunits.push(unit);

            this.generate('platoon', _config2['default'].unitDepth, unit);
            this.generate('company', quantity - 1, parent);
            break;

          case 'platoon':
            unit.name = _names2['default'].platoons[0];
            _names2['default'].platoons.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('captain', unit.id);

            parent.subunits.push(unit);

            this.generate('squad', _config2['default'].unitDepth, unit);
            this.generate('platoon', quantity - 1, parent);
            break;

          case 'squad':
            unit.name = _names2['default'].squads[0];
            _names2['default'].squads.shift();
            unit.commander = this.HQ.officers.recruit('lieutenant', unit.id);

            parent.subunits.push(unit);

            this.generate('squad', quantity - 1, parent);
            break;
        };

        this.HQ.add(unit);
      }
    }
  }]);

  return Army;
})();

exports['default'] = Army;
module.exports = exports['default'];

},{"./config":8,"./hq":12,"./names":13,"./officers":15,"./unit":19,"./world":20}],6:[function(require,module,exports){
(function (Buffer){
'use strict';(function(){var MAX_INT=9007199254740992;var MIN_INT=-MAX_INT;var NUMBERS='0123456789';var CHARS_LOWER='abcdefghijklmnopqrstuvwxyz';var CHARS_UPPER=CHARS_LOWER.toUpperCase();var HEX_POOL=NUMBERS + 'abcdef';var slice=Array.prototype.slice;function Chance(seed){if(!(this instanceof Chance)){return seed == null?new Chance():new Chance(seed);}if(typeof seed === 'function'){this.random = seed;return this;}var seedling;if(arguments.length){this.seed = 0;}for(var i=0; i < arguments.length; i++) {seedling = 0;if(typeof arguments[i] === 'string'){for(var j=0; j < arguments[i].length; j++) {seedling += (arguments[i].length - j) * arguments[i].charCodeAt(j);}}else {seedling = arguments[i];}this.seed += (arguments.length - i) * seedling;}this.mt = this.mersenne_twister(this.seed);this.bimd5 = this.blueimp_md5();this.random = function(){return this.mt.random(this.seed);};return this;}Chance.prototype.VERSION = '0.7.6';function initOptions(options, defaults){options || (options = {});if(defaults){for(var i in defaults) {if(typeof options[i] === 'undefined'){options[i] = defaults[i];}}}return options;}function testRange(test, errorMessage){if(test){throw new RangeError(errorMessage);}}var base64=function base64(){throw new Error('No Base64 encoder available.');};(function determineBase64Encoder(){if(typeof btoa === 'function'){base64 = btoa;}else if(typeof Buffer === 'function'){base64 = function(input){return new Buffer(input).toString('base64');};}})();Chance.prototype.bool = function(options){options = initOptions(options, {likelihood:50});testRange(options.likelihood < 0 || options.likelihood > 100, 'Chance: Likelihood accepts values from 0 to 100.');return this.random() * 100 < options.likelihood;};Chance.prototype.character = function(options){options = initOptions(options);testRange(options.alpha && options.symbols, 'Chance: Cannot specify both alpha and symbols.');var symbols='!@#$%^&*()[]', letters, pool;if(options.casing === 'lower'){letters = CHARS_LOWER;}else if(options.casing === 'upper'){letters = CHARS_UPPER;}else {letters = CHARS_LOWER + CHARS_UPPER;}if(options.pool){pool = options.pool;}else if(options.alpha){pool = letters;}else if(options.symbols){pool = symbols;}else {pool = letters + NUMBERS + symbols;}return pool.charAt(this.natural({max:pool.length - 1}));};Chance.prototype.floating = function(options){options = initOptions(options, {fixed:4});testRange(options.fixed && options.precision, 'Chance: Cannot specify both fixed and precision.');var num;var fixed=Math.pow(10, options.fixed);var max=MAX_INT / fixed;var min=-max;testRange(options.min && options.fixed && options.min < min, 'Chance: Min specified is out of range with fixed. Min should be, at least, ' + min);testRange(options.max && options.fixed && options.max > max, 'Chance: Max specified is out of range with fixed. Max should be, at most, ' + max);options = initOptions(options, {min:min, max:max});num = this.integer({min:options.min * fixed, max:options.max * fixed});var num_fixed=(num / fixed).toFixed(options.fixed);return parseFloat(num_fixed);};Chance.prototype.integer = function(options){options = initOptions(options, {min:MIN_INT, max:MAX_INT});testRange(options.min > options.max, 'Chance: Min cannot be greater than Max.');return Math.floor(this.random() * (options.max - options.min + 1) + options.min);};Chance.prototype.natural = function(options){options = initOptions(options, {min:0, max:MAX_INT});testRange(options.min < 0, 'Chance: Min cannot be less than zero.');return this.integer(options);};Chance.prototype.string = function(options){options = initOptions(options, {length:this.natural({min:5, max:20})});testRange(options.length < 0, 'Chance: Length cannot be less than zero.');var length=options.length, text=this.n(this.character, length, options);return text.join('');};Chance.prototype.capitalize = function(word){return word.charAt(0).toUpperCase() + word.substr(1);};Chance.prototype.mixin = function(obj){for(var func_name in obj) {Chance.prototype[func_name] = obj[func_name];}return this;};Chance.prototype.unique = function(fn, num, options){testRange(typeof fn !== 'function', 'Chance: The first argument must be a function.');options = initOptions(options, {comparator:function comparator(arr, val){return arr.indexOf(val) !== -1;}});var arr=[], count=0, result, MAX_DUPLICATES=num * 50, params=slice.call(arguments, 2);while(arr.length < num) {result = fn.apply(this, params);if(!options.comparator(arr, result)){arr.push(result);count = 0;}if(++count > MAX_DUPLICATES){throw new RangeError('Chance: num is likely too large for sample set');}}return arr;};Chance.prototype.n = function(fn, n){testRange(typeof fn !== 'function', 'Chance: The first argument must be a function.');if(typeof n === 'undefined'){n = 1;}var i=n, arr=[], params=slice.call(arguments, 2);i = Math.max(0, i);for(null; i--; null) {arr.push(fn.apply(this, params));}return arr;};Chance.prototype.pad = function(number, width, pad){pad = pad || '0';number = number + '';return number.length >= width?number:new Array(width - number.length + 1).join(pad) + number;};Chance.prototype.pick = function(arr, count){if(arr.length === 0){throw new RangeError('Chance: Cannot pick() from an empty array');}if(!count || count === 1){return arr[this.natural({max:arr.length - 1})];}else {return this.shuffle(arr).slice(0, count);}};Chance.prototype.shuffle = function(arr){var old_array=arr.slice(0), new_array=[], j=0, length=Number(old_array.length);for(var i=0; i < length; i++) {j = this.natural({max:old_array.length - 1});new_array[i] = old_array[j];old_array.splice(j, 1);}return new_array;};Chance.prototype.weighted = function(arr, weights){if(arr.length !== weights.length){throw new RangeError('Chance: length of array and weights must match');}for(var weightIndex=weights.length - 1; weightIndex >= 0; --weightIndex) {if(weights[weightIndex] <= 0){arr.splice(weightIndex, 1);weights.splice(weightIndex, 1);}}if(weights.some(function(weight){return weight < 1;})){var min=weights.reduce(function(min, weight){return weight < min?weight:min;}, weights[0]);var scaling_factor=1 / min;weights = weights.map(function(weight){return weight * scaling_factor;});}var sum=weights.reduce(function(total, weight){return total + weight;}, 0);var selected=this.natural({min:1, max:sum});var total=0;var chosen;weights.some(function(weight, index){if(selected <= total + weight){chosen = arr[index];return true;}total += weight;return false;});return chosen;};Chance.prototype.paragraph = function(options){options = initOptions(options);var sentences=options.sentences || this.natural({min:3, max:7}), sentence_array=this.n(this.sentence, sentences);return sentence_array.join(' ');};Chance.prototype.sentence = function(options){options = initOptions(options);var words=options.words || this.natural({min:12, max:18}), text, word_array=this.n(this.word, words);text = word_array.join(' ');text = this.capitalize(text) + '.';return text;};Chance.prototype.syllable = function(options){options = initOptions(options);var length=options.length || this.natural({min:2, max:3}), consonants='bcdfghjklmnprstvwz', vowels='aeiou', all=consonants + vowels, text='', chr;for(var i=0; i < length; i++) {if(i === 0){chr = this.character({pool:all});}else if(consonants.indexOf(chr) === -1){chr = this.character({pool:consonants});}else {chr = this.character({pool:vowels});}text += chr;}return text;};Chance.prototype.word = function(options){options = initOptions(options);testRange(options.syllables && options.length, 'Chance: Cannot specify both syllables AND length.');var syllables=options.syllables || this.natural({min:1, max:3}), text='';if(options.length){do {text += this.syllable();}while(text.length < options.length);text = text.substring(0, options.length);}else {for(var i=0; i < syllables; i++) {text += this.syllable();}}return text;};Chance.prototype.age = function(options){options = initOptions(options);var ageRange;switch(options.type){case 'child':ageRange = {min:1, max:12};break;case 'teen':ageRange = {min:13, max:19};break;case 'adult':ageRange = {min:18, max:65};break;case 'senior':ageRange = {min:65, max:100};break;case 'all':ageRange = {min:1, max:100};break;default:ageRange = {min:18, max:65};break;}return this.natural(ageRange);};Chance.prototype.birthday = function(options){options = initOptions(options, {year:new Date().getFullYear() - this.age(options)});return this.date(options);};Chance.prototype.cpf = function(){var n=this.n(this.natural, 9, {max:9});var d1=n[8] * 2 + n[7] * 3 + n[6] * 4 + n[5] * 5 + n[4] * 6 + n[3] * 7 + n[2] * 8 + n[1] * 9 + n[0] * 10;d1 = 11 - d1 % 11;if(d1 >= 10){d1 = 0;}var d2=d1 * 2 + n[8] * 3 + n[7] * 4 + n[6] * 5 + n[5] * 6 + n[4] * 7 + n[3] * 8 + n[2] * 9 + n[1] * 10 + n[0] * 11;d2 = 11 - d2 % 11;if(d2 >= 10){d2 = 0;}return '' + n[0] + n[1] + n[2] + '.' + n[3] + n[4] + n[5] + '.' + n[6] + n[7] + n[8] + '-' + d1 + d2;};Chance.prototype.first = function(options){options = initOptions(options, {gender:this.gender()});return this.pick(this.get('firstNames')[options.gender.toLowerCase()]);};Chance.prototype.gender = function(){return this.pick(['Male', 'Female']);};Chance.prototype.last = function(){return this.pick(this.get('lastNames'));};Chance.prototype.mrz = function(options){var checkDigit=function checkDigit(input){var alpha='<ABCDEFGHIJKLMNOPQRSTUVWXYXZ'.split(''), multipliers=[7, 3, 1], runningTotal=0;if(typeof input !== 'string'){input = input.toString();}input.split('').forEach(function(character, idx){var pos=alpha.indexOf(character);if(pos !== -1){character = pos === 0?0:pos + 9;}else {character = parseInt(character, 10);}character *= multipliers[idx % multipliers.length];runningTotal += character;});return runningTotal % 10;};var generate=function generate(opts){var pad=function pad(length){return new Array(length + 1).join('<');};var number=['P<', opts.issuer, opts.last.toUpperCase(), '<<', opts.first.toUpperCase(), pad(39 - (opts.last.length + opts.first.length + 2)), opts.passportNumber, checkDigit(opts.passportNumber), opts.nationality, opts.dob, checkDigit(opts.dob), opts.gender, opts.expiry, checkDigit(opts.expiry), pad(14), checkDigit(pad(14))].join('');return number + checkDigit(number.substr(44, 10) + number.substr(57, 7) + number.substr(65, 7));};var that=this;options = initOptions(options, {first:this.first(), last:this.last(), passportNumber:this.integer({min:100000000, max:999999999}), dob:(function(){var date=that.birthday({type:'adult'});return [date.getFullYear().toString().substr(2), that.pad(date.getMonth() + 1, 2), that.pad(date.getDate(), 2)].join('');})(), expiry:(function(){var date=new Date();return [(date.getFullYear() + 5).toString().substr(2), that.pad(date.getMonth() + 1, 2), that.pad(date.getDate(), 2)].join('');})(), gender:this.gender() === 'Female'?'F':'M', issuer:'GBR', nationality:'GBR'});return generate(options);};Chance.prototype.name = function(options){options = initOptions(options);var first=this.first(options), last=this.last(), name;if(options.middle){name = first + ' ' + this.first(options) + ' ' + last;}else if(options.middle_initial){name = first + ' ' + this.character({alpha:true, casing:'upper'}) + '. ' + last;}else {name = first + ' ' + last;}if(options.prefix){name = this.prefix(options) + ' ' + name;}if(options.suffix){name = name + ' ' + this.suffix(options);}return name;};Chance.prototype.name_prefixes = function(gender){gender = gender || 'all';gender = gender.toLowerCase();var prefixes=[{name:'Doctor', abbreviation:'Dr.'}];if(gender === 'male' || gender === 'all'){prefixes.push({name:'Mister', abbreviation:'Mr.'});}if(gender === 'female' || gender === 'all'){prefixes.push({name:'Miss', abbreviation:'Miss'});prefixes.push({name:'Misses', abbreviation:'Mrs.'});}return prefixes;};Chance.prototype.prefix = function(options){return this.name_prefix(options);};Chance.prototype.name_prefix = function(options){options = initOptions(options, {gender:'all'});return options.full?this.pick(this.name_prefixes(options.gender)).name:this.pick(this.name_prefixes(options.gender)).abbreviation;};Chance.prototype.ssn = function(options){options = initOptions(options, {ssnFour:false, dashes:true});var ssn_pool='1234567890', ssn, dash=options.dashes?'-':'';if(!options.ssnFour){ssn = this.string({pool:ssn_pool, length:3}) + dash + this.string({pool:ssn_pool, length:2}) + dash + this.string({pool:ssn_pool, length:4});}else {ssn = this.string({pool:ssn_pool, length:4});}return ssn;};Chance.prototype.name_suffixes = function(){var suffixes=[{name:'Doctor of Osteopathic Medicine', abbreviation:'D.O.'}, {name:'Doctor of Philosophy', abbreviation:'Ph.D.'}, {name:'Esquire', abbreviation:'Esq.'}, {name:'Junior', abbreviation:'Jr.'}, {name:'Juris Doctor', abbreviation:'J.D.'}, {name:'Master of Arts', abbreviation:'M.A.'}, {name:'Master of Business Administration', abbreviation:'M.B.A.'}, {name:'Master of Science', abbreviation:'M.S.'}, {name:'Medical Doctor', abbreviation:'M.D.'}, {name:'Senior', abbreviation:'Sr.'}, {name:'The Third', abbreviation:'III'}, {name:'The Fourth', abbreviation:'IV'}, {name:'Bachelor of Engineering', abbreviation:'B.E'}, {name:'Bachelor of Technology', abbreviation:'B.TECH'}];return suffixes;};Chance.prototype.suffix = function(options){return this.name_suffix(options);};Chance.prototype.name_suffix = function(options){options = initOptions(options);return options.full?this.pick(this.name_suffixes()).name:this.pick(this.name_suffixes()).abbreviation;};Chance.prototype.android_id = function(){return 'APA91' + this.string({pool:'0123456789abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_', length:178});};Chance.prototype.apple_token = function(){return this.string({pool:'abcdef1234567890', length:64});};Chance.prototype.wp8_anid2 = function(){return base64(this.hash({length:32}));};Chance.prototype.wp7_anid = function(){return 'A=' + this.guid().replace(/-/g, '').toUpperCase() + '&E=' + this.hash({length:3}) + '&W=' + this.integer({min:0, max:9});};Chance.prototype.bb_pin = function(){return this.hash({length:8});};Chance.prototype.avatar = function(options){var url=null;var URL_BASE='//www.gravatar.com/avatar/';var PROTOCOLS={http:'http', https:'https'};var FILE_TYPES={bmp:'bmp', gif:'gif', jpg:'jpg', png:'png'};var FALLBACKS={'404':'404', mm:'mm', identicon:'identicon', monsterid:'monsterid', wavatar:'wavatar', retro:'retro', blank:'blank'};var RATINGS={g:'g', pg:'pg', r:'r', x:'x'};var opts={protocol:null, email:null, fileExtension:null, size:null, fallback:null, rating:null};if(!options){opts.email = this.email();options = {};}else if(typeof options === 'string'){opts.email = options;options = {};}else if(typeof options !== 'object'){return null;}else if(options.constructor === 'Array'){return null;}opts = initOptions(options, opts);if(!opts.email){opts.email = this.email();}opts.protocol = PROTOCOLS[opts.protocol]?opts.protocol + ':':'';opts.size = parseInt(opts.size, 0)?opts.size:'';opts.rating = RATINGS[opts.rating]?opts.rating:'';opts.fallback = FALLBACKS[opts.fallback]?opts.fallback:'';opts.fileExtension = FILE_TYPES[opts.fileExtension]?opts.fileExtension:'';url = opts.protocol + URL_BASE + this.bimd5.md5(opts.email) + (opts.fileExtension?'.' + opts.fileExtension:'') + (opts.size || opts.rating || opts.fallback?'?':'') + (opts.size?'&s=' + opts.size.toString():'') + (opts.rating?'&r=' + opts.rating:'') + (opts.fallback?'&d=' + opts.fallback:'');return url;};Chance.prototype.color = function(options){function gray(value, delimiter){return [value, value, value].join(delimiter || '');}options = initOptions(options, {format:this.pick(['hex', 'shorthex', 'rgb', 'rgba', '0x']), grayscale:false, casing:'lower'});var isGrayscale=options.grayscale;var colorValue;if(options.format === 'hex'){colorValue = '#' + (isGrayscale?gray(this.hash({length:2})):this.hash({length:6}));}else if(options.format === 'shorthex'){colorValue = '#' + (isGrayscale?gray(this.hash({length:1})):this.hash({length:3}));}else if(options.format === 'rgb'){if(isGrayscale){colorValue = 'rgb(' + gray(this.natural({max:255}), ',') + ')';}else {colorValue = 'rgb(' + this.natural({max:255}) + ',' + this.natural({max:255}) + ',' + this.natural({max:255}) + ')';}}else if(options.format === 'rgba'){if(isGrayscale){colorValue = 'rgba(' + gray(this.natural({max:255}), ',') + ',' + this.floating({min:0, max:1}) + ')';}else {colorValue = 'rgba(' + this.natural({max:255}) + ',' + this.natural({max:255}) + ',' + this.natural({max:255}) + ',' + this.floating({min:0, max:1}) + ')';}}else if(options.format === '0x'){colorValue = '0x' + (isGrayscale?gray(this.hash({length:2})):this.hash({length:6}));}else {throw new RangeError('Invalid format provided. Please provide one of "hex", "shorthex", "rgb", "rgba", or "0x".');}if(options.casing === 'upper'){colorValue = colorValue.toUpperCase();}return colorValue;};Chance.prototype.domain = function(options){options = initOptions(options);return this.word() + '.' + (options.tld || this.tld());};Chance.prototype.email = function(options){options = initOptions(options);return this.word({length:options.length}) + '@' + (options.domain || this.domain());};Chance.prototype.fbid = function(){return parseInt('10000' + this.natural({max:100000000000}), 10);};Chance.prototype.google_analytics = function(){var account=this.pad(this.natural({max:999999}), 6);var property=this.pad(this.natural({max:99}), 2);return 'UA-' + account + '-' + property;};Chance.prototype.hashtag = function(){return '#' + this.word();};Chance.prototype.ip = function(){return this.natural({max:255}) + '.' + this.natural({max:255}) + '.' + this.natural({max:255}) + '.' + this.natural({max:255});};Chance.prototype.ipv6 = function(){var ip_addr=this.n(this.hash, 8, {length:4});return ip_addr.join(':');};Chance.prototype.klout = function(){return this.natural({min:1, max:99});};Chance.prototype.tlds = function(){return ['com', 'org', 'edu', 'gov', 'co.uk', 'net', 'io'];};Chance.prototype.tld = function(){return this.pick(this.tlds());};Chance.prototype.twitter = function(){return '@' + this.word();};Chance.prototype.url = function(options){options = initOptions(options, {protocol:'http', domain:this.domain(options), domain_prefix:'', path:this.word(), extensions:[]});var extension=options.extensions.length > 0?'.' + this.pick(options.extensions):'';var domain=options.domain_prefix?options.domain_prefix + '.' + options.domain:options.domain;return options.protocol + '://' + domain + '/' + options.path + extension;};Chance.prototype.address = function(options){options = initOptions(options);return this.natural({min:5, max:2000}) + ' ' + this.street(options);};Chance.prototype.altitude = function(options){options = initOptions(options, {fixed:5, min:0, max:8848});return this.floating({min:options.min, max:options.max, fixed:options.fixed});};Chance.prototype.areacode = function(options){options = initOptions(options, {parens:true});var areacode=this.natural({min:2, max:9}).toString() + this.natural({min:0, max:8}).toString() + this.natural({min:0, max:9}).toString();return options.parens?'(' + areacode + ')':areacode;};Chance.prototype.city = function(){return this.capitalize(this.word({syllables:3}));};Chance.prototype.coordinates = function(options){return this.latitude(options) + ', ' + this.longitude(options);};Chance.prototype.countries = function(){return this.get('countries');};Chance.prototype.country = function(options){options = initOptions(options);var country=this.pick(this.countries());return options.full?country.name:country.abbreviation;};Chance.prototype.depth = function(options){options = initOptions(options, {fixed:5, min:-2550, max:0});return this.floating({min:options.min, max:options.max, fixed:options.fixed});};Chance.prototype.geohash = function(options){options = initOptions(options, {length:7});return this.string({length:options.length, pool:'0123456789bcdefghjkmnpqrstuvwxyz'});};Chance.prototype.geojson = function(options){return this.latitude(options) + ', ' + this.longitude(options) + ', ' + this.altitude(options);};Chance.prototype.latitude = function(options){options = initOptions(options, {fixed:5, min:-90, max:90});return this.floating({min:options.min, max:options.max, fixed:options.fixed});};Chance.prototype.longitude = function(options){options = initOptions(options, {fixed:5, min:-180, max:180});return this.floating({min:options.min, max:options.max, fixed:options.fixed});};Chance.prototype.phone = function(options){var self=this, numPick, ukNum=function ukNum(parts){var section=[];parts.sections.forEach(function(n){section.push(self.string({pool:'0123456789', length:n}));});return parts.area + section.join(' ');};options = initOptions(options, {formatted:true, country:'us', mobile:false});if(!options.formatted){options.parens = false;}var phone;switch(options.country){case 'fr':if(!options.mobile){numPick = this.pick(['01' + this.pick(['30', '34', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '53', '55', '56', '58', '60', '64', '69', '70', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83']) + self.string({pool:'0123456789', length:6}), '02' + this.pick(['14', '18', '22', '23', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '40', '41', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '56', '57', '61', '62', '69', '72', '76', '77', '78', '85', '90', '96', '97', '98', '99']) + self.string({pool:'0123456789', length:6}), '03' + this.pick(['10', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '39', '44', '45', '51', '52', '54', '55', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90']) + self.string({pool:'0123456789', length:6}), '04' + this.pick(['11', '13', '15', '20', '22', '26', '27', '30', '32', '34', '37', '42', '43', '44', '50', '56', '57', '63', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '88', '89', '90', '91', '92', '93', '94', '95', '97', '98']) + self.string({pool:'0123456789', length:6}), '05' + this.pick(['08', '16', '17', '19', '24', '31', '32', '33', '34', '35', '40', '45', '46', '47', '49', '53', '55', '56', '57', '58', '59', '61', '62', '63', '64', '65', '67', '79', '81', '82', '86', '87', '90', '94']) + self.string({pool:'0123456789', length:6}), '09' + self.string({pool:'0123456789', length:8})]);phone = options.formatted?numPick.match(/../g).join(' '):numPick;}else {numPick = this.pick(['06', '07']) + self.string({pool:'0123456789', length:8});phone = options.formatted?numPick.match(/../g).join(' '):numPick;}break;case 'uk':if(!options.mobile){numPick = this.pick([{area:'01' + this.character({pool:'234569'}) + '1 ', sections:[3, 4]}, {area:'020 ' + this.character({pool:'378'}), sections:[3, 4]}, {area:'023 ' + this.character({pool:'89'}), sections:[3, 4]}, {area:'024 7', sections:[3, 4]}, {area:'028 ' + this.pick(['25', '28', '37', '71', '82', '90', '92', '95']), sections:[2, 4]}, {area:'012' + this.pick(['04', '08', '54', '76', '97', '98']) + ' ', sections:[5]}, {area:'013' + this.pick(['63', '64', '84', '86']) + ' ', sections:[5]}, {area:'014' + this.pick(['04', '20', '60', '61', '80', '88']) + ' ', sections:[5]}, {area:'015' + this.pick(['24', '27', '62', '66']) + ' ', sections:[5]}, {area:'016' + this.pick(['06', '29', '35', '47', '59', '95']) + ' ', sections:[5]}, {area:'017' + this.pick(['26', '44', '50', '68']) + ' ', sections:[5]}, {area:'018' + this.pick(['27', '37', '84', '97']) + ' ', sections:[5]}, {area:'019' + this.pick(['00', '05', '35', '46', '49', '63', '95']) + ' ', sections:[5]}]);phone = options.formatted?ukNum(numPick):ukNum(numPick).replace(' ', '', 'g');}else {numPick = this.pick([{area:'07' + this.pick(['4', '5', '7', '8', '9']), sections:[2, 6]}, {area:'07624 ', sections:[6]}]);phone = options.formatted?ukNum(numPick):ukNum(numPick).replace(' ', '');}break;case 'us':var areacode=this.areacode(options).toString();var exchange=this.natural({min:2, max:9}).toString() + this.natural({min:0, max:9}).toString() + this.natural({min:0, max:9}).toString();var subscriber=this.natural({min:1000, max:9999}).toString();phone = options.formatted?areacode + ' ' + exchange + '-' + subscriber:areacode + exchange + subscriber;}return phone;};Chance.prototype.postal = function(){var pd=this.character({pool:'XVTSRPNKLMHJGECBA'});var fsa=pd + this.natural({max:9}) + this.character({alpha:true, casing:'upper'});var ldu=this.natural({max:9}) + this.character({alpha:true, casing:'upper'}) + this.natural({max:9});return fsa + ' ' + ldu;};Chance.prototype.provinces = function(){return this.get('provinces');};Chance.prototype.province = function(options){return options && options.full?this.pick(this.provinces()).name:this.pick(this.provinces()).abbreviation;};Chance.prototype.state = function(options){return options && options.full?this.pick(this.states(options)).name:this.pick(this.states(options)).abbreviation;};Chance.prototype.states = function(options){options = initOptions(options);var states, us_states_and_dc=this.get('us_states_and_dc'), territories=this.get('territories'), armed_forces=this.get('armed_forces');states = us_states_and_dc;if(options.territories){states = states.concat(territories);}if(options.armed_forces){states = states.concat(armed_forces);}return states;};Chance.prototype.street = function(options){options = initOptions(options);var street=this.word({syllables:2});street = this.capitalize(street);street += ' ';street += options.short_suffix?this.street_suffix().abbreviation:this.street_suffix().name;return street;};Chance.prototype.street_suffix = function(){return this.pick(this.street_suffixes());};Chance.prototype.street_suffixes = function(){return this.get('street_suffixes');};Chance.prototype.zip = function(options){var zip=this.n(this.natural, 5, {max:9});if(options && options.plusfour === true){zip.push('-');zip = zip.concat(this.n(this.natural, 4, {max:9}));}return zip.join('');};Chance.prototype.ampm = function(){return this.bool()?'am':'pm';};Chance.prototype.date = function(options){var date_string, date;if(options && (options.min || options.max)){options = initOptions(options, {american:true, string:false});var min=typeof options.min !== 'undefined'?options.min.getTime():1;var max=typeof options.max !== 'undefined'?options.max.getTime():8640000000000000;date = new Date(this.natural({min:min, max:max}));}else {var m=this.month({raw:true});var daysInMonth=m.days;if(options && options.month){daysInMonth = this.get('months')[(options.month % 12 + 12) % 12].days;}options = initOptions(options, {year:parseInt(this.year(), 10), month:m.numeric - 1, day:this.natural({min:1, max:daysInMonth}), hour:this.hour(), minute:this.minute(), second:this.second(), millisecond:this.millisecond(), american:true, string:false});date = new Date(options.year, options.month, options.day, options.hour, options.minute, options.second, options.millisecond);}if(options.american){date_string = date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear();}else {date_string = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();}return options.string?date_string:date;};Chance.prototype.hammertime = function(options){return this.date(options).getTime();};Chance.prototype.hour = function(options){options = initOptions(options, {min:1, max:options && options.twentyfour?24:12});testRange(options.min < 1, 'Chance: Min cannot be less than 1.');testRange(options.twentyfour && options.max > 24, 'Chance: Max cannot be greater than 24 for twentyfour option.');testRange(!options.twentyfour && options.max > 12, 'Chance: Max cannot be greater than 12.');testRange(options.min > options.max, 'Chance: Min cannot be greater than Max.');return this.natural({min:options.min, max:options.max});};Chance.prototype.millisecond = function(){return this.natural({max:999});};Chance.prototype.minute = Chance.prototype.second = function(options){options = initOptions(options, {min:0, max:59});testRange(options.min < 0, 'Chance: Min cannot be less than 0.');testRange(options.max > 59, 'Chance: Max cannot be greater than 59.');testRange(options.min > options.max, 'Chance: Min cannot be greater than Max.');return this.natural({min:options.min, max:options.max});};Chance.prototype.month = function(options){options = initOptions(options, {min:1, max:12});testRange(options.min < 1, 'Chance: Min cannot be less than 1.');testRange(options.max > 12, 'Chance: Max cannot be greater than 12.');testRange(options.min > options.max, 'Chance: Min cannot be greater than Max.');var month=this.pick(this.months().slice(options.min - 1, options.max));return options.raw?month:month.name;};Chance.prototype.months = function(){return this.get('months');};Chance.prototype.second = function(){return this.natural({max:59});};Chance.prototype.timestamp = function(){return this.natural({min:1, max:parseInt(new Date().getTime() / 1000, 10)});};Chance.prototype.year = function(options){options = initOptions(options, {min:new Date().getFullYear()});options.max = typeof options.max !== 'undefined'?options.max:options.min + 100;return this.natural(options).toString();};Chance.prototype.cc = function(options){options = initOptions(options);var type, number, to_generate;type = options.type?this.cc_type({name:options.type, raw:true}):this.cc_type({raw:true});number = type.prefix.split('');to_generate = type.length - type.prefix.length - 1;number = number.concat(this.n(this.integer, to_generate, {min:0, max:9}));number.push(this.luhn_calculate(number.join('')));return number.join('');};Chance.prototype.cc_types = function(){return this.get('cc_types');};Chance.prototype.cc_type = function(options){options = initOptions(options);var types=this.cc_types(), type=null;if(options.name){for(var i=0; i < types.length; i++) {if(types[i].name === options.name || types[i].short_name === options.name){type = types[i];break;}}if(type === null){throw new RangeError('Credit card type \'' + options.name + '\'\' is not supported');}}else {type = this.pick(types);}return options.raw?type:type.name;};Chance.prototype.currency_types = function(){return this.get('currency_types');};Chance.prototype.currency = function(){return this.pick(this.currency_types());};Chance.prototype.currency_pair = function(returnAsString){var currencies=this.unique(this.currency, 2, {comparator:function comparator(arr, val){return arr.reduce(function(acc, item){return acc || item.code === val.code;}, false);}});if(returnAsString){return currencies[0].code + '/' + currencies[1].code;}else {return currencies;}};Chance.prototype.dollar = function(options){options = initOptions(options, {max:10000, min:0});var dollar=this.floating({min:options.min, max:options.max, fixed:2}).toString(), cents=dollar.split('.')[1];if(cents === undefined){dollar += '.00';}else if(cents.length < 2){dollar = dollar + '0';}if(dollar < 0){return '-$' + dollar.replace('-', '');}else {return '$' + dollar;}};Chance.prototype.exp = function(options){options = initOptions(options);var exp={};exp.year = this.exp_year();if(exp.year === new Date().getFullYear().toString()){exp.month = this.exp_month({future:true});}else {exp.month = this.exp_month();}return options.raw?exp:exp.month + '/' + exp.year;};Chance.prototype.exp_month = function(options){options = initOptions(options);var month, month_int, curMonth=new Date().getMonth() + 1;if(options.future){do {month = this.month({raw:true}).numeric;month_int = parseInt(month, 10);}while(month_int <= curMonth);}else {month = this.month({raw:true}).numeric;}return month;};Chance.prototype.exp_year = function(){return this.year({max:new Date().getFullYear() + 10});};function diceFn(range){return function(){return this.natural(range);};}Chance.prototype.d4 = diceFn({min:1, max:4});Chance.prototype.d6 = diceFn({min:1, max:6});Chance.prototype.d8 = diceFn({min:1, max:8});Chance.prototype.d10 = diceFn({min:1, max:10});Chance.prototype.d12 = diceFn({min:1, max:12});Chance.prototype.d20 = diceFn({min:1, max:20});Chance.prototype.d30 = diceFn({min:1, max:30});Chance.prototype.d100 = diceFn({min:1, max:100});Chance.prototype.rpg = function(thrown, options){options = initOptions(options);if(!thrown){throw new RangeError('A type of die roll must be included');}else {var bits=thrown.toLowerCase().split('d'), rolls=[];if(bits.length !== 2 || !parseInt(bits[0], 10) || !parseInt(bits[1], 10)){throw new Error('Invalid format provided. Please provide #d# where the first # is the number of dice to roll, the second # is the max of each die');}for(var i=bits[0]; i > 0; i--) {rolls[i - 1] = this.natural({min:1, max:bits[1]});}return typeof options.sum !== 'undefined' && options.sum?rolls.reduce(function(p, c){return p + c;}):rolls;}};Chance.prototype.guid = function(options){options = initOptions(options, {version:5});var guid_pool='abcdef1234567890', variant_pool='ab89', guid=this.string({pool:guid_pool, length:8}) + '-' + this.string({pool:guid_pool, length:4}) + '-' + options.version + this.string({pool:guid_pool, length:3}) + '-' + this.string({pool:variant_pool, length:1}) + this.string({pool:guid_pool, length:3}) + '-' + this.string({pool:guid_pool, length:12});return guid;};Chance.prototype.hash = function(options){options = initOptions(options, {length:40, casing:'lower'});var pool=options.casing === 'upper'?HEX_POOL.toUpperCase():HEX_POOL;return this.string({pool:pool, length:options.length});};Chance.prototype.luhn_check = function(num){var str=num.toString();var checkDigit=+str.substring(str.length - 1);return checkDigit === this.luhn_calculate(+str.substring(0, str.length - 1));};Chance.prototype.luhn_calculate = function(num){var digits=num.toString().split('').reverse();var sum=0;var digit;for(var i=0, l=digits.length; l > i; ++i) {digit = +digits[i];if(i % 2 === 0){digit *= 2;if(digit > 9){digit -= 9;}}sum += digit;}return sum * 9 % 10;};Chance.prototype.md5 = function(options){var opts={str:'', key:null, raw:false};if(!options){opts.str = this.string();options = {};}else if(typeof options === 'string'){opts.str = options;options = {};}else if(typeof options !== 'object'){return null;}else if(options.constructor === 'Array'){return null;}opts = initOptions(options, opts);if(!opts.str){throw new Error('A parameter is required to return an md5 hash.');}return this.bimd5.md5(opts.str, opts.key, opts.raw);};var data={firstNames:{'male':['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Charles', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'George', 'Donald', 'Anthony', 'Paul', 'Mark', 'Edward', 'Steven', 'Kenneth', 'Andrew', 'Brian', 'Joshua', 'Kevin', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Frank', 'Gary', 'Ryan', 'Nicholas', 'Eric', 'Stephen', 'Jacob', 'Larry', 'Jonathan', 'Scott', 'Raymond', 'Justin', 'Brandon', 'Gregory', 'Samuel', 'Benjamin', 'Patrick', 'Jack', 'Henry', 'Walter', 'Dennis', 'Jerry', 'Alexander', 'Peter', 'Tyler', 'Douglas', 'Harold', 'Aaron', 'Jose', 'Adam', 'Arthur', 'Zachary', 'Carl', 'Nathan', 'Albert', 'Kyle', 'Lawrence', 'Joe', 'Willie', 'Gerald', 'Roger', 'Keith', 'Jeremy', 'Terry', 'Harry', 'Ralph', 'Sean', 'Jesse', 'Roy', 'Louis', 'Billy', 'Austin', 'Bruce', 'Eugene', 'Christian', 'Bryan', 'Wayne', 'Russell', 'Howard', 'Fred', 'Ethan', 'Jordan', 'Philip', 'Alan', 'Juan', 'Randy', 'Vincent', 'Bobby', 'Dylan', 'Johnny', 'Phillip', 'Victor', 'Clarence', 'Ernest', 'Martin', 'Craig', 'Stanley', 'Shawn', 'Travis', 'Bradley', 'Leonard', 'Earl', 'Gabriel', 'Jimmy', 'Francis', 'Todd', 'Noah', 'Danny', 'Dale', 'Cody', 'Carlos', 'Allen', 'Frederick', 'Logan', 'Curtis', 'Alex', 'Joel', 'Luis', 'Norman', 'Marvin', 'Glenn', 'Tony', 'Nathaniel', 'Rodney', 'Melvin', 'Alfred', 'Steve', 'Cameron', 'Chad', 'Edwin', 'Caleb', 'Evan', 'Antonio', 'Lee', 'Herbert', 'Jeffery', 'Isaac', 'Derek', 'Ricky', 'Marcus', 'Theodore', 'Elijah', 'Luke', 'Jesus', 'Eddie', 'Troy', 'Mike', 'Dustin', 'Ray', 'Adrian', 'Bernard', 'Leroy', 'Angel', 'Randall', 'Wesley', 'Ian', 'Jared', 'Mason', 'Hunter', 'Calvin', 'Oscar', 'Clifford', 'Jay', 'Shane', 'Ronnie', 'Barry', 'Lucas', 'Corey', 'Manuel', 'Leo', 'Tommy', 'Warren', 'Jackson', 'Isaiah', 'Connor', 'Don', 'Dean', 'Jon', 'Julian', 'Miguel', 'Bill', 'Lloyd', 'Charlie', 'Mitchell', 'Leon', 'Jerome', 'Darrell', 'Jeremiah', 'Alvin', 'Brett', 'Seth', 'Floyd', 'Jim', 'Blake', 'Micheal', 'Gordon', 'Trevor', 'Lewis', 'Erik', 'Edgar', 'Vernon', 'Devin', 'Gavin', 'Jayden', 'Chris', 'Clyde', 'Tom', 'Derrick', 'Mario', 'Brent', 'Marc', 'Herman', 'Chase', 'Dominic', 'Ricardo', 'Franklin', 'Maurice', 'Max', 'Aiden', 'Owen', 'Lester', 'Gilbert', 'Elmer', 'Gene', 'Francisco', 'Glen', 'Cory', 'Garrett', 'Clayton', 'Sam', 'Jorge', 'Chester', 'Alejandro', 'Jeff', 'Harvey', 'Milton', 'Cole', 'Ivan', 'Andre', 'Duane', 'Landon'], 'female':['Mary', 'Emma', 'Elizabeth', 'Minnie', 'Margaret', 'Ida', 'Alice', 'Bertha', 'Sarah', 'Annie', 'Clara', 'Ella', 'Florence', 'Cora', 'Martha', 'Laura', 'Nellie', 'Grace', 'Carrie', 'Maude', 'Mabel', 'Bessie', 'Jennie', 'Gertrude', 'Julia', 'Hattie', 'Edith', 'Mattie', 'Rose', 'Catherine', 'Lillian', 'Ada', 'Lillie', 'Helen', 'Jessie', 'Louise', 'Ethel', 'Lula', 'Myrtle', 'Eva', 'Frances', 'Lena', 'Lucy', 'Edna', 'Maggie', 'Pearl', 'Daisy', 'Fannie', 'Josephine', 'Dora', 'Rosa', 'Katherine', 'Agnes', 'Marie', 'Nora', 'May', 'Mamie', 'Blanche', 'Stella', 'Ellen', 'Nancy', 'Effie', 'Sallie', 'Nettie', 'Della', 'Lizzie', 'Flora', 'Susie', 'Maud', 'Mae', 'Etta', 'Harriet', 'Sadie', 'Caroline', 'Katie', 'Lydia', 'Elsie', 'Kate', 'Susan', 'Mollie', 'Alma', 'Addie', 'Georgia', 'Eliza', 'Lulu', 'Nannie', 'Lottie', 'Amanda', 'Belle', 'Charlotte', 'Rebecca', 'Ruth', 'Viola', 'Olive', 'Amelia', 'Hannah', 'Jane', 'Virginia', 'Emily', 'Matilda', 'Irene', 'Kathryn', 'Esther', 'Willie', 'Henrietta', 'Ollie', 'Amy', 'Rachel', 'Sara', 'Estella', 'Theresa', 'Augusta', 'Ora', 'Pauline', 'Josie', 'Lola', 'Sophia', 'Leona', 'Anne', 'Mildred', 'Ann', 'Beulah', 'Callie', 'Lou', 'Delia', 'Eleanor', 'Barbara', 'Iva', 'Louisa', 'Maria', 'Mayme', 'Evelyn', 'Estelle', 'Nina', 'Betty', 'Marion', 'Bettie', 'Dorothy', 'Luella', 'Inez', 'Lela', 'Rosie', 'Allie', 'Millie', 'Janie', 'Cornelia', 'Victoria', 'Ruby', 'Winifred', 'Alta', 'Celia', 'Christine', 'Beatrice', 'Birdie', 'Harriett', 'Mable', 'Myra', 'Sophie', 'Tillie', 'Isabel', 'Sylvia', 'Carolyn', 'Isabelle', 'Leila', 'Sally', 'Ina', 'Essie', 'Bertie', 'Nell', 'Alberta', 'Katharine', 'Lora', 'Rena', 'Mina', 'Rhoda', 'Mathilda', 'Abbie', 'Eula', 'Dollie', 'Hettie', 'Eunice', 'Fanny', 'Ola', 'Lenora', 'Adelaide', 'Christina', 'Lelia', 'Nelle', 'Sue', 'Johanna', 'Lilly', 'Lucinda', 'Minerva', 'Lettie', 'Roxie', 'Cynthia', 'Helena', 'Hilda', 'Hulda', 'Bernice', 'Genevieve', 'Jean', 'Cordelia', 'Marian', 'Francis', 'Jeanette', 'Adeline', 'Gussie', 'Leah', 'Lois', 'Lura', 'Mittie', 'Hallie', 'Isabella', 'Olga', 'Phoebe', 'Teresa', 'Hester', 'Lida', 'Lina', 'Winnie', 'Claudia', 'Marguerite', 'Vera', 'Cecelia', 'Bess', 'Emilie', 'John', 'Rosetta', 'Verna', 'Myrtie', 'Cecilia', 'Elva', 'Olivia', 'Ophelia', 'Georgie', 'Elnora', 'Violet', 'Adele', 'Lily', 'Linnie', 'Loretta', 'Madge', 'Polly', 'Virgie', 'Eugenia', 'Lucile', 'Lucille', 'Mabelle', 'Rosalie']}, lastNames:['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward', 'Torres', 'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly', 'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins', 'Perry', 'Powell', 'Long', 'Patterson', 'Hughes', 'Flores', 'Washington', 'Butler', 'Simmons', 'Foster', 'Gonzales', 'Bryant', 'Alexander', 'Russell', 'Griffin', 'Diaz', 'Hayes', 'Myers', 'Ford', 'Hamilton', 'Graham', 'Sullivan', 'Wallace', 'Woods', 'Cole', 'West', 'Jordan', 'Owens', 'Reynolds', 'Fisher', 'Ellis', 'Harrison', 'Gibson', 'McDonald', 'Cruz', 'Marshall', 'Ortiz', 'Gomez', 'Murray', 'Freeman', 'Wells', 'Webb', 'Simpson', 'Stevens', 'Tucker', 'Porter', 'Hunter', 'Hicks', 'Crawford', 'Henry', 'Boyd', 'Mason', 'Morales', 'Kennedy', 'Warren', 'Dixon', 'Ramos', 'Reyes', 'Burns', 'Gordon', 'Shaw', 'Holmes', 'Rice', 'Robertson', 'Hunt', 'Black', 'Daniels', 'Palmer', 'Mills', 'Nichols', 'Grant', 'Knight', 'Ferguson', 'Rose', 'Stone', 'Hawkins', 'Dunn', 'Perkins', 'Hudson', 'Spencer', 'Gardner', 'Stephens', 'Payne', 'Pierce', 'Berry', 'Matthews', 'Arnold', 'Wagner', 'Willis', 'Ray', 'Watkins', 'Olson', 'Carroll', 'Duncan', 'Snyder', 'Hart', 'Cunningham', 'Bradley', 'Lane', 'Andrews', 'Ruiz', 'Harper', 'Fox', 'Riley', 'Armstrong', 'Carpenter', 'Weaver', 'Greene', 'Lawrence', 'Elliott', 'Chavez', 'Sims', 'Austin', 'Peters', 'Kelley', 'Franklin', 'Lawson', 'Fields', 'Gutierrez', 'Ryan', 'Schmidt', 'Carr', 'Vasquez', 'Castillo', 'Wheeler', 'Chapman', 'Oliver', 'Montgomery', 'Richards', 'Williamson', 'Johnston', 'Banks', 'Meyer', 'Bishop', 'McCoy', 'Howell', 'Alvarez', 'Morrison', 'Hansen', 'Fernandez', 'Garza', 'Harvey', 'Little', 'Burton', 'Stanley', 'Nguyen', 'George', 'Jacobs', 'Reid', 'Kim', 'Fuller', 'Lynch', 'Dean', 'Gilbert', 'Garrett', 'Romero', 'Welch', 'Larson', 'Frazier', 'Burke', 'Hanson', 'Day', 'Mendoza', 'Moreno', 'Bowman', 'Medina', 'Fowler', 'Brewer', 'Hoffman', 'Carlson', 'Silva', 'Pearson', 'Holland', 'Douglas', 'Fleming', 'Jensen', 'Vargas', 'Byrd', 'Davidson', 'Hopkins', 'May', 'Terry', 'Herrera', 'Wade', 'Soto', 'Walters', 'Curtis', 'Neal', 'Caldwell', 'Lowe', 'Jennings', 'Barnett', 'Graves', 'Jimenez', 'Horton', 'Shelton', 'Barrett', 'Obrien', 'Castro', 'Sutton', 'Gregory', 'McKinney', 'Lucas', 'Miles', 'Craig', 'Rodriquez', 'Chambers', 'Holt', 'Lambert', 'Fletcher', 'Watts', 'Bates', 'Hale', 'Rhodes', 'Pena', 'Beck', 'Newman', 'Haynes', 'McDaniel', 'Mendez', 'Bush', 'Vaughn', 'Parks', 'Dawson', 'Santiago', 'Norris', 'Hardy', 'Love', 'Steele', 'Curry', 'Powers', 'Schultz', 'Barker', 'Guzman', 'Page', 'Munoz', 'Ball', 'Keller', 'Chandler', 'Weber', 'Leonard', 'Walsh', 'Lyons', 'Ramsey', 'Wolfe', 'Schneider', 'Mullins', 'Benson', 'Sharp', 'Bowen', 'Daniel', 'Barber', 'Cummings', 'Hines', 'Baldwin', 'Griffith', 'Valdez', 'Hubbard', 'Salazar', 'Reeves', 'Warner', 'Stevenson', 'Burgess', 'Santos', 'Tate', 'Cross', 'Garner', 'Mann', 'Mack', 'Moss', 'Thornton', 'Dennis', 'McGee', 'Farmer', 'Delgado', 'Aguilar', 'Vega', 'Glover', 'Manning', 'Cohen', 'Harmon', 'Rodgers', 'Robbins', 'Newton', 'Todd', 'Blair', 'Higgins', 'Ingram', 'Reese', 'Cannon', 'Strickland', 'Townsend', 'Potter', 'Goodwin', 'Walton', 'Rowe', 'Hampton', 'Ortega', 'Patton', 'Swanson', 'Joseph', 'Francis', 'Goodman', 'Maldonado', 'Yates', 'Becker', 'Erickson', 'Hodges', 'Rios', 'Conner', 'Adkins', 'Webster', 'Norman', 'Malone', 'Hammond', 'Flowers', 'Cobb', 'Moody', 'Quinn', 'Blake', 'Maxwell', 'Pope', 'Floyd', 'Osborne', 'Paul', 'McCarthy', 'Guerrero', 'Lindsey', 'Estrada', 'Sandoval', 'Gibbs', 'Tyler', 'Gross', 'Fitzgerald', 'Stokes', 'Doyle', 'Sherman', 'Saunders', 'Wise', 'Colon', 'Gill', 'Alvarado', 'Greer', 'Padilla', 'Simon', 'Waters', 'Nunez', 'Ballard', 'Schwartz', 'McBride', 'Houston', 'Christensen', 'Klein', 'Pratt', 'Briggs', 'Parsons', 'McLaughlin', 'Zimmerman', 'French', 'Buchanan', 'Moran', 'Copeland', 'Roy', 'Pittman', 'Brady', 'McCormick', 'Holloway', 'Brock', 'Poole', 'Frank', 'Logan', 'Owen', 'Bass', 'Marsh', 'Drake', 'Wong', 'Jefferson', 'Park', 'Morton', 'Abbott', 'Sparks', 'Patrick', 'Norton', 'Huff', 'Clayton', 'Massey', 'Lloyd', 'Figueroa', 'Carson', 'Bowers', 'Roberson', 'Barton', 'Tran', 'Lamb', 'Harrington', 'Casey', 'Boone', 'Cortez', 'Clarke', 'Mathis', 'Singleton', 'Wilkins', 'Cain', 'Bryan', 'Underwood', 'Hogan', 'McKenzie', 'Collier', 'Luna', 'Phelps', 'McGuire', 'Allison', 'Bridges', 'Wilkerson', 'Nash', 'Summers', 'Atkins'], countries:[{'name':'Afghanistan', 'abbreviation':'AF'}, {'name':'Albania', 'abbreviation':'AL'}, {'name':'Algeria', 'abbreviation':'DZ'}, {'name':'American Samoa', 'abbreviation':'AS'}, {'name':'Andorra', 'abbreviation':'AD'}, {'name':'Angola', 'abbreviation':'AO'}, {'name':'Anguilla', 'abbreviation':'AI'}, {'name':'Antarctica', 'abbreviation':'AQ'}, {'name':'Antigua and Barbuda', 'abbreviation':'AG'}, {'name':'Argentina', 'abbreviation':'AR'}, {'name':'Armenia', 'abbreviation':'AM'}, {'name':'Aruba', 'abbreviation':'AW'}, {'name':'Australia', 'abbreviation':'AU'}, {'name':'Austria', 'abbreviation':'AT'}, {'name':'Azerbaijan', 'abbreviation':'AZ'}, {'name':'Bahamas', 'abbreviation':'BS'}, {'name':'Bahrain', 'abbreviation':'BH'}, {'name':'Bangladesh', 'abbreviation':'BD'}, {'name':'Barbados', 'abbreviation':'BB'}, {'name':'Belarus', 'abbreviation':'BY'}, {'name':'Belgium', 'abbreviation':'BE'}, {'name':'Belize', 'abbreviation':'BZ'}, {'name':'Benin', 'abbreviation':'BJ'}, {'name':'Bermuda', 'abbreviation':'BM'}, {'name':'Bhutan', 'abbreviation':'BT'}, {'name':'Bolivia', 'abbreviation':'BO'}, {'name':'Bosnia and Herzegovina', 'abbreviation':'BA'}, {'name':'Botswana', 'abbreviation':'BW'}, {'name':'Bouvet Island', 'abbreviation':'BV'}, {'name':'Brazil', 'abbreviation':'BR'}, {'name':'British Antarctic Territory', 'abbreviation':'BQ'}, {'name':'British Indian Ocean Territory', 'abbreviation':'IO'}, {'name':'British Virgin Islands', 'abbreviation':'VG'}, {'name':'Brunei', 'abbreviation':'BN'}, {'name':'Bulgaria', 'abbreviation':'BG'}, {'name':'Burkina Faso', 'abbreviation':'BF'}, {'name':'Burundi', 'abbreviation':'BI'}, {'name':'Cambodia', 'abbreviation':'KH'}, {'name':'Cameroon', 'abbreviation':'CM'}, {'name':'Canada', 'abbreviation':'CA'}, {'name':'Canton and Enderbury Islands', 'abbreviation':'CT'}, {'name':'Cape Verde', 'abbreviation':'CV'}, {'name':'Cayman Islands', 'abbreviation':'KY'}, {'name':'Central African Republic', 'abbreviation':'CF'}, {'name':'Chad', 'abbreviation':'TD'}, {'name':'Chile', 'abbreviation':'CL'}, {'name':'China', 'abbreviation':'CN'}, {'name':'Christmas Island', 'abbreviation':'CX'}, {'name':'Cocos [Keeling] Islands', 'abbreviation':'CC'}, {'name':'Colombia', 'abbreviation':'CO'}, {'name':'Comoros', 'abbreviation':'KM'}, {'name':'Congo - Brazzaville', 'abbreviation':'CG'}, {'name':'Congo - Kinshasa', 'abbreviation':'CD'}, {'name':'Cook Islands', 'abbreviation':'CK'}, {'name':'Costa Rica', 'abbreviation':'CR'}, {'name':'Croatia', 'abbreviation':'HR'}, {'name':'Cuba', 'abbreviation':'CU'}, {'name':'Cyprus', 'abbreviation':'CY'}, {'name':'Czech Republic', 'abbreviation':'CZ'}, {'name':'Côte d’Ivoire', 'abbreviation':'CI'}, {'name':'Denmark', 'abbreviation':'DK'}, {'name':'Djibouti', 'abbreviation':'DJ'}, {'name':'Dominica', 'abbreviation':'DM'}, {'name':'Dominican Republic', 'abbreviation':'DO'}, {'name':'Dronning Maud Land', 'abbreviation':'NQ'}, {'name':'East Germany', 'abbreviation':'DD'}, {'name':'Ecuador', 'abbreviation':'EC'}, {'name':'Egypt', 'abbreviation':'EG'}, {'name':'El Salvador', 'abbreviation':'SV'}, {'name':'Equatorial Guinea', 'abbreviation':'GQ'}, {'name':'Eritrea', 'abbreviation':'ER'}, {'name':'Estonia', 'abbreviation':'EE'}, {'name':'Ethiopia', 'abbreviation':'ET'}, {'name':'Falkland Islands', 'abbreviation':'FK'}, {'name':'Faroe Islands', 'abbreviation':'FO'}, {'name':'Fiji', 'abbreviation':'FJ'}, {'name':'Finland', 'abbreviation':'FI'}, {'name':'France', 'abbreviation':'FR'}, {'name':'French Guiana', 'abbreviation':'GF'}, {'name':'French Polynesia', 'abbreviation':'PF'}, {'name':'French Southern Territories', 'abbreviation':'TF'}, {'name':'French Southern and Antarctic Territories', 'abbreviation':'FQ'}, {'name':'Gabon', 'abbreviation':'GA'}, {'name':'Gambia', 'abbreviation':'GM'}, {'name':'Georgia', 'abbreviation':'GE'}, {'name':'Germany', 'abbreviation':'DE'}, {'name':'Ghana', 'abbreviation':'GH'}, {'name':'Gibraltar', 'abbreviation':'GI'}, {'name':'Greece', 'abbreviation':'GR'}, {'name':'Greenland', 'abbreviation':'GL'}, {'name':'Grenada', 'abbreviation':'GD'}, {'name':'Guadeloupe', 'abbreviation':'GP'}, {'name':'Guam', 'abbreviation':'GU'}, {'name':'Guatemala', 'abbreviation':'GT'}, {'name':'Guernsey', 'abbreviation':'GG'}, {'name':'Guinea', 'abbreviation':'GN'}, {'name':'Guinea-Bissau', 'abbreviation':'GW'}, {'name':'Guyana', 'abbreviation':'GY'}, {'name':'Haiti', 'abbreviation':'HT'}, {'name':'Heard Island and McDonald Islands', 'abbreviation':'HM'}, {'name':'Honduras', 'abbreviation':'HN'}, {'name':'Hong Kong SAR China', 'abbreviation':'HK'}, {'name':'Hungary', 'abbreviation':'HU'}, {'name':'Iceland', 'abbreviation':'IS'}, {'name':'India', 'abbreviation':'IN'}, {'name':'Indonesia', 'abbreviation':'ID'}, {'name':'Iran', 'abbreviation':'IR'}, {'name':'Iraq', 'abbreviation':'IQ'}, {'name':'Ireland', 'abbreviation':'IE'}, {'name':'Isle of Man', 'abbreviation':'IM'}, {'name':'Israel', 'abbreviation':'IL'}, {'name':'Italy', 'abbreviation':'IT'}, {'name':'Jamaica', 'abbreviation':'JM'}, {'name':'Japan', 'abbreviation':'JP'}, {'name':'Jersey', 'abbreviation':'JE'}, {'name':'Johnston Island', 'abbreviation':'JT'}, {'name':'Jordan', 'abbreviation':'JO'}, {'name':'Kazakhstan', 'abbreviation':'KZ'}, {'name':'Kenya', 'abbreviation':'KE'}, {'name':'Kiribati', 'abbreviation':'KI'}, {'name':'Kuwait', 'abbreviation':'KW'}, {'name':'Kyrgyzstan', 'abbreviation':'KG'}, {'name':'Laos', 'abbreviation':'LA'}, {'name':'Latvia', 'abbreviation':'LV'}, {'name':'Lebanon', 'abbreviation':'LB'}, {'name':'Lesotho', 'abbreviation':'LS'}, {'name':'Liberia', 'abbreviation':'LR'}, {'name':'Libya', 'abbreviation':'LY'}, {'name':'Liechtenstein', 'abbreviation':'LI'}, {'name':'Lithuania', 'abbreviation':'LT'}, {'name':'Luxembourg', 'abbreviation':'LU'}, {'name':'Macau SAR China', 'abbreviation':'MO'}, {'name':'Macedonia', 'abbreviation':'MK'}, {'name':'Madagascar', 'abbreviation':'MG'}, {'name':'Malawi', 'abbreviation':'MW'}, {'name':'Malaysia', 'abbreviation':'MY'}, {'name':'Maldives', 'abbreviation':'MV'}, {'name':'Mali', 'abbreviation':'ML'}, {'name':'Malta', 'abbreviation':'MT'}, {'name':'Marshall Islands', 'abbreviation':'MH'}, {'name':'Martinique', 'abbreviation':'MQ'}, {'name':'Mauritania', 'abbreviation':'MR'}, {'name':'Mauritius', 'abbreviation':'MU'}, {'name':'Mayotte', 'abbreviation':'YT'}, {'name':'Metropolitan France', 'abbreviation':'FX'}, {'name':'Mexico', 'abbreviation':'MX'}, {'name':'Micronesia', 'abbreviation':'FM'}, {'name':'Midway Islands', 'abbreviation':'MI'}, {'name':'Moldova', 'abbreviation':'MD'}, {'name':'Monaco', 'abbreviation':'MC'}, {'name':'Mongolia', 'abbreviation':'MN'}, {'name':'Montenegro', 'abbreviation':'ME'}, {'name':'Montserrat', 'abbreviation':'MS'}, {'name':'Morocco', 'abbreviation':'MA'}, {'name':'Mozambique', 'abbreviation':'MZ'}, {'name':'Myanmar [Burma]', 'abbreviation':'MM'}, {'name':'Namibia', 'abbreviation':'NA'}, {'name':'Nauru', 'abbreviation':'NR'}, {'name':'Nepal', 'abbreviation':'NP'}, {'name':'Netherlands', 'abbreviation':'NL'}, {'name':'Netherlands Antilles', 'abbreviation':'AN'}, {'name':'Neutral Zone', 'abbreviation':'NT'}, {'name':'New Caledonia', 'abbreviation':'NC'}, {'name':'New Zealand', 'abbreviation':'NZ'}, {'name':'Nicaragua', 'abbreviation':'NI'}, {'name':'Niger', 'abbreviation':'NE'}, {'name':'Nigeria', 'abbreviation':'NG'}, {'name':'Niue', 'abbreviation':'NU'}, {'name':'Norfolk Island', 'abbreviation':'NF'}, {'name':'North Korea', 'abbreviation':'KP'}, {'name':'North Vietnam', 'abbreviation':'VD'}, {'name':'Northern Mariana Islands', 'abbreviation':'MP'}, {'name':'Norway', 'abbreviation':'NO'}, {'name':'Oman', 'abbreviation':'OM'}, {'name':'Pacific Islands Trust Territory', 'abbreviation':'PC'}, {'name':'Pakistan', 'abbreviation':'PK'}, {'name':'Palau', 'abbreviation':'PW'}, {'name':'Palestinian Territories', 'abbreviation':'PS'}, {'name':'Panama', 'abbreviation':'PA'}, {'name':'Panama Canal Zone', 'abbreviation':'PZ'}, {'name':'Papua New Guinea', 'abbreviation':'PG'}, {'name':'Paraguay', 'abbreviation':'PY'}, {'name':'People\'s Democratic Republic of Yemen', 'abbreviation':'YD'}, {'name':'Peru', 'abbreviation':'PE'}, {'name':'Philippines', 'abbreviation':'PH'}, {'name':'Pitcairn Islands', 'abbreviation':'PN'}, {'name':'Poland', 'abbreviation':'PL'}, {'name':'Portugal', 'abbreviation':'PT'}, {'name':'Puerto Rico', 'abbreviation':'PR'}, {'name':'Qatar', 'abbreviation':'QA'}, {'name':'Romania', 'abbreviation':'RO'}, {'name':'Russia', 'abbreviation':'RU'}, {'name':'Rwanda', 'abbreviation':'RW'}, {'name':'Réunion', 'abbreviation':'RE'}, {'name':'Saint Barthélemy', 'abbreviation':'BL'}, {'name':'Saint Helena', 'abbreviation':'SH'}, {'name':'Saint Kitts and Nevis', 'abbreviation':'KN'}, {'name':'Saint Lucia', 'abbreviation':'LC'}, {'name':'Saint Martin', 'abbreviation':'MF'}, {'name':'Saint Pierre and Miquelon', 'abbreviation':'PM'}, {'name':'Saint Vincent and the Grenadines', 'abbreviation':'VC'}, {'name':'Samoa', 'abbreviation':'WS'}, {'name':'San Marino', 'abbreviation':'SM'}, {'name':'Saudi Arabia', 'abbreviation':'SA'}, {'name':'Senegal', 'abbreviation':'SN'}, {'name':'Serbia', 'abbreviation':'RS'}, {'name':'Serbia and Montenegro', 'abbreviation':'CS'}, {'name':'Seychelles', 'abbreviation':'SC'}, {'name':'Sierra Leone', 'abbreviation':'SL'}, {'name':'Singapore', 'abbreviation':'SG'}, {'name':'Slovakia', 'abbreviation':'SK'}, {'name':'Slovenia', 'abbreviation':'SI'}, {'name':'Solomon Islands', 'abbreviation':'SB'}, {'name':'Somalia', 'abbreviation':'SO'}, {'name':'South Africa', 'abbreviation':'ZA'}, {'name':'South Georgia and the South Sandwich Islands', 'abbreviation':'GS'}, {'name':'South Korea', 'abbreviation':'KR'}, {'name':'Spain', 'abbreviation':'ES'}, {'name':'Sri Lanka', 'abbreviation':'LK'}, {'name':'Sudan', 'abbreviation':'SD'}, {'name':'Suriname', 'abbreviation':'SR'}, {'name':'Svalbard and Jan Mayen', 'abbreviation':'SJ'}, {'name':'Swaziland', 'abbreviation':'SZ'}, {'name':'Sweden', 'abbreviation':'SE'}, {'name':'Switzerland', 'abbreviation':'CH'}, {'name':'Syria', 'abbreviation':'SY'}, {'name':'São Tomé and Príncipe', 'abbreviation':'ST'}, {'name':'Taiwan', 'abbreviation':'TW'}, {'name':'Tajikistan', 'abbreviation':'TJ'}, {'name':'Tanzania', 'abbreviation':'TZ'}, {'name':'Thailand', 'abbreviation':'TH'}, {'name':'Timor-Leste', 'abbreviation':'TL'}, {'name':'Togo', 'abbreviation':'TG'}, {'name':'Tokelau', 'abbreviation':'TK'}, {'name':'Tonga', 'abbreviation':'TO'}, {'name':'Trinidad and Tobago', 'abbreviation':'TT'}, {'name':'Tunisia', 'abbreviation':'TN'}, {'name':'Turkey', 'abbreviation':'TR'}, {'name':'Turkmenistan', 'abbreviation':'TM'}, {'name':'Turks and Caicos Islands', 'abbreviation':'TC'}, {'name':'Tuvalu', 'abbreviation':'TV'}, {'name':'U.S. Minor Outlying Islands', 'abbreviation':'UM'}, {'name':'U.S. Miscellaneous Pacific Islands', 'abbreviation':'PU'}, {'name':'U.S. Virgin Islands', 'abbreviation':'VI'}, {'name':'Uganda', 'abbreviation':'UG'}, {'name':'Ukraine', 'abbreviation':'UA'}, {'name':'Union of Soviet Socialist Republics', 'abbreviation':'SU'}, {'name':'United Arab Emirates', 'abbreviation':'AE'}, {'name':'United Kingdom', 'abbreviation':'GB'}, {'name':'United States', 'abbreviation':'US'}, {'name':'Unknown or Invalid Region', 'abbreviation':'ZZ'}, {'name':'Uruguay', 'abbreviation':'UY'}, {'name':'Uzbekistan', 'abbreviation':'UZ'}, {'name':'Vanuatu', 'abbreviation':'VU'}, {'name':'Vatican City', 'abbreviation':'VA'}, {'name':'Venezuela', 'abbreviation':'VE'}, {'name':'Vietnam', 'abbreviation':'VN'}, {'name':'Wake Island', 'abbreviation':'WK'}, {'name':'Wallis and Futuna', 'abbreviation':'WF'}, {'name':'Western Sahara', 'abbreviation':'EH'}, {'name':'Yemen', 'abbreviation':'YE'}, {'name':'Zambia', 'abbreviation':'ZM'}, {'name':'Zimbabwe', 'abbreviation':'ZW'}, {'name':'Åland Islands', 'abbreviation':'AX'}], provinces:[{name:'Alberta', abbreviation:'AB'}, {name:'British Columbia', abbreviation:'BC'}, {name:'Manitoba', abbreviation:'MB'}, {name:'New Brunswick', abbreviation:'NB'}, {name:'Newfoundland and Labrador', abbreviation:'NL'}, {name:'Nova Scotia', abbreviation:'NS'}, {name:'Ontario', abbreviation:'ON'}, {name:'Prince Edward Island', abbreviation:'PE'}, {name:'Quebec', abbreviation:'QC'}, {name:'Saskatchewan', abbreviation:'SK'}, {name:'Northwest Territories', abbreviation:'NT'}, {name:'Nunavut', abbreviation:'NU'}, {name:'Yukon', abbreviation:'YT'}], us_states_and_dc:[{name:'Alabama', abbreviation:'AL'}, {name:'Alaska', abbreviation:'AK'}, {name:'Arizona', abbreviation:'AZ'}, {name:'Arkansas', abbreviation:'AR'}, {name:'California', abbreviation:'CA'}, {name:'Colorado', abbreviation:'CO'}, {name:'Connecticut', abbreviation:'CT'}, {name:'Delaware', abbreviation:'DE'}, {name:'District of Columbia', abbreviation:'DC'}, {name:'Florida', abbreviation:'FL'}, {name:'Georgia', abbreviation:'GA'}, {name:'Hawaii', abbreviation:'HI'}, {name:'Idaho', abbreviation:'ID'}, {name:'Illinois', abbreviation:'IL'}, {name:'Indiana', abbreviation:'IN'}, {name:'Iowa', abbreviation:'IA'}, {name:'Kansas', abbreviation:'KS'}, {name:'Kentucky', abbreviation:'KY'}, {name:'Louisiana', abbreviation:'LA'}, {name:'Maine', abbreviation:'ME'}, {name:'Maryland', abbreviation:'MD'}, {name:'Massachusetts', abbreviation:'MA'}, {name:'Michigan', abbreviation:'MI'}, {name:'Minnesota', abbreviation:'MN'}, {name:'Mississippi', abbreviation:'MS'}, {name:'Missouri', abbreviation:'MO'}, {name:'Montana', abbreviation:'MT'}, {name:'Nebraska', abbreviation:'NE'}, {name:'Nevada', abbreviation:'NV'}, {name:'New Hampshire', abbreviation:'NH'}, {name:'New Jersey', abbreviation:'NJ'}, {name:'New Mexico', abbreviation:'NM'}, {name:'New York', abbreviation:'NY'}, {name:'North Carolina', abbreviation:'NC'}, {name:'North Dakota', abbreviation:'ND'}, {name:'Ohio', abbreviation:'OH'}, {name:'Oklahoma', abbreviation:'OK'}, {name:'Oregon', abbreviation:'OR'}, {name:'Pennsylvania', abbreviation:'PA'}, {name:'Rhode Island', abbreviation:'RI'}, {name:'South Carolina', abbreviation:'SC'}, {name:'South Dakota', abbreviation:'SD'}, {name:'Tennessee', abbreviation:'TN'}, {name:'Texas', abbreviation:'TX'}, {name:'Utah', abbreviation:'UT'}, {name:'Vermont', abbreviation:'VT'}, {name:'Virginia', abbreviation:'VA'}, {name:'Washington', abbreviation:'WA'}, {name:'West Virginia', abbreviation:'WV'}, {name:'Wisconsin', abbreviation:'WI'}, {name:'Wyoming', abbreviation:'WY'}], territories:[{name:'American Samoa', abbreviation:'AS'}, {name:'Federated States of Micronesia', abbreviation:'FM'}, {name:'Guam', abbreviation:'GU'}, {name:'Marshall Islands', abbreviation:'MH'}, {name:'Northern Mariana Islands', abbreviation:'MP'}, {name:'Puerto Rico', abbreviation:'PR'}, {name:'Virgin Islands, U.S.', abbreviation:'VI'}], armed_forces:[{name:'Armed Forces Europe', abbreviation:'AE'}, {name:'Armed Forces Pacific', abbreviation:'AP'}, {name:'Armed Forces the Americas', abbreviation:'AA'}], street_suffixes:[{name:'Avenue', abbreviation:'Ave'}, {name:'Boulevard', abbreviation:'Blvd'}, {name:'Center', abbreviation:'Ctr'}, {name:'Circle', abbreviation:'Cir'}, {name:'Court', abbreviation:'Ct'}, {name:'Drive', abbreviation:'Dr'}, {name:'Extension', abbreviation:'Ext'}, {name:'Glen', abbreviation:'Gln'}, {name:'Grove', abbreviation:'Grv'}, {name:'Heights', abbreviation:'Hts'}, {name:'Highway', abbreviation:'Hwy'}, {name:'Junction', abbreviation:'Jct'}, {name:'Key', abbreviation:'Key'}, {name:'Lane', abbreviation:'Ln'}, {name:'Loop', abbreviation:'Loop'}, {name:'Manor', abbreviation:'Mnr'}, {name:'Mill', abbreviation:'Mill'}, {name:'Park', abbreviation:'Park'}, {name:'Parkway', abbreviation:'Pkwy'}, {name:'Pass', abbreviation:'Pass'}, {name:'Path', abbreviation:'Path'}, {name:'Pike', abbreviation:'Pike'}, {name:'Place', abbreviation:'Pl'}, {name:'Plaza', abbreviation:'Plz'}, {name:'Point', abbreviation:'Pt'}, {name:'Ridge', abbreviation:'Rdg'}, {name:'River', abbreviation:'Riv'}, {name:'Road', abbreviation:'Rd'}, {name:'Square', abbreviation:'Sq'}, {name:'Street', abbreviation:'St'}, {name:'Terrace', abbreviation:'Ter'}, {name:'Trail', abbreviation:'Trl'}, {name:'Turnpike', abbreviation:'Tpke'}, {name:'View', abbreviation:'Vw'}, {name:'Way', abbreviation:'Way'}], months:[{name:'January', short_name:'Jan', numeric:'01', days:31}, {name:'February', short_name:'Feb', numeric:'02', days:28}, {name:'March', short_name:'Mar', numeric:'03', days:31}, {name:'April', short_name:'Apr', numeric:'04', days:30}, {name:'May', short_name:'May', numeric:'05', days:31}, {name:'June', short_name:'Jun', numeric:'06', days:30}, {name:'July', short_name:'Jul', numeric:'07', days:31}, {name:'August', short_name:'Aug', numeric:'08', days:31}, {name:'September', short_name:'Sep', numeric:'09', days:30}, {name:'October', short_name:'Oct', numeric:'10', days:31}, {name:'November', short_name:'Nov', numeric:'11', days:30}, {name:'December', short_name:'Dec', numeric:'12', days:31}], cc_types:[{name:'American Express', short_name:'amex', prefix:'34', length:15}, {name:'Bankcard', short_name:'bankcard', prefix:'5610', length:16}, {name:'China UnionPay', short_name:'chinaunion', prefix:'62', length:16}, {name:'Diners Club Carte Blanche', short_name:'dccarte', prefix:'300', length:14}, {name:'Diners Club enRoute', short_name:'dcenroute', prefix:'2014', length:15}, {name:'Diners Club International', short_name:'dcintl', prefix:'36', length:14}, {name:'Diners Club United States & Canada', short_name:'dcusc', prefix:'54', length:16}, {name:'Discover Card', short_name:'discover', prefix:'6011', length:16}, {name:'InstaPayment', short_name:'instapay', prefix:'637', length:16}, {name:'JCB', short_name:'jcb', prefix:'3528', length:16}, {name:'Laser', short_name:'laser', prefix:'6304', length:16}, {name:'Maestro', short_name:'maestro', prefix:'5018', length:16}, {name:'Mastercard', short_name:'mc', prefix:'51', length:16}, {name:'Solo', short_name:'solo', prefix:'6334', length:16}, {name:'Switch', short_name:'switch', prefix:'4903', length:16}, {name:'Visa', short_name:'visa', prefix:'4', length:16}, {name:'Visa Electron', short_name:'electron', prefix:'4026', length:16}], currency_types:[{'code':'AED', 'name':'United Arab Emirates Dirham'}, {'code':'AFN', 'name':'Afghanistan Afghani'}, {'code':'ALL', 'name':'Albania Lek'}, {'code':'AMD', 'name':'Armenia Dram'}, {'code':'ANG', 'name':'Netherlands Antilles Guilder'}, {'code':'AOA', 'name':'Angola Kwanza'}, {'code':'ARS', 'name':'Argentina Peso'}, {'code':'AUD', 'name':'Australia Dollar'}, {'code':'AWG', 'name':'Aruba Guilder'}, {'code':'AZN', 'name':'Azerbaijan New Manat'}, {'code':'BAM', 'name':'Bosnia and Herzegovina Convertible Marka'}, {'code':'BBD', 'name':'Barbados Dollar'}, {'code':'BDT', 'name':'Bangladesh Taka'}, {'code':'BGN', 'name':'Bulgaria Lev'}, {'code':'BHD', 'name':'Bahrain Dinar'}, {'code':'BIF', 'name':'Burundi Franc'}, {'code':'BMD', 'name':'Bermuda Dollar'}, {'code':'BND', 'name':'Brunei Darussalam Dollar'}, {'code':'BOB', 'name':'Bolivia Boliviano'}, {'code':'BRL', 'name':'Brazil Real'}, {'code':'BSD', 'name':'Bahamas Dollar'}, {'code':'BTN', 'name':'Bhutan Ngultrum'}, {'code':'BWP', 'name':'Botswana Pula'}, {'code':'BYR', 'name':'Belarus Ruble'}, {'code':'BZD', 'name':'Belize Dollar'}, {'code':'CAD', 'name':'Canada Dollar'}, {'code':'CDF', 'name':'Congo/Kinshasa Franc'}, {'code':'CHF', 'name':'Switzerland Franc'}, {'code':'CLP', 'name':'Chile Peso'}, {'code':'CNY', 'name':'China Yuan Renminbi'}, {'code':'COP', 'name':'Colombia Peso'}, {'code':'CRC', 'name':'Costa Rica Colon'}, {'code':'CUC', 'name':'Cuba Convertible Peso'}, {'code':'CUP', 'name':'Cuba Peso'}, {'code':'CVE', 'name':'Cape Verde Escudo'}, {'code':'CZK', 'name':'Czech Republic Koruna'}, {'code':'DJF', 'name':'Djibouti Franc'}, {'code':'DKK', 'name':'Denmark Krone'}, {'code':'DOP', 'name':'Dominican Republic Peso'}, {'code':'DZD', 'name':'Algeria Dinar'}, {'code':'EGP', 'name':'Egypt Pound'}, {'code':'ERN', 'name':'Eritrea Nakfa'}, {'code':'ETB', 'name':'Ethiopia Birr'}, {'code':'EUR', 'name':'Euro Member Countries'}, {'code':'FJD', 'name':'Fiji Dollar'}, {'code':'FKP', 'name':'Falkland Islands (Malvinas) Pound'}, {'code':'GBP', 'name':'United Kingdom Pound'}, {'code':'GEL', 'name':'Georgia Lari'}, {'code':'GGP', 'name':'Guernsey Pound'}, {'code':'GHS', 'name':'Ghana Cedi'}, {'code':'GIP', 'name':'Gibraltar Pound'}, {'code':'GMD', 'name':'Gambia Dalasi'}, {'code':'GNF', 'name':'Guinea Franc'}, {'code':'GTQ', 'name':'Guatemala Quetzal'}, {'code':'GYD', 'name':'Guyana Dollar'}, {'code':'HKD', 'name':'Hong Kong Dollar'}, {'code':'HNL', 'name':'Honduras Lempira'}, {'code':'HRK', 'name':'Croatia Kuna'}, {'code':'HTG', 'name':'Haiti Gourde'}, {'code':'HUF', 'name':'Hungary Forint'}, {'code':'IDR', 'name':'Indonesia Rupiah'}, {'code':'ILS', 'name':'Israel Shekel'}, {'code':'IMP', 'name':'Isle of Man Pound'}, {'code':'INR', 'name':'India Rupee'}, {'code':'IQD', 'name':'Iraq Dinar'}, {'code':'IRR', 'name':'Iran Rial'}, {'code':'ISK', 'name':'Iceland Krona'}, {'code':'JEP', 'name':'Jersey Pound'}, {'code':'JMD', 'name':'Jamaica Dollar'}, {'code':'JOD', 'name':'Jordan Dinar'}, {'code':'JPY', 'name':'Japan Yen'}, {'code':'KES', 'name':'Kenya Shilling'}, {'code':'KGS', 'name':'Kyrgyzstan Som'}, {'code':'KHR', 'name':'Cambodia Riel'}, {'code':'KMF', 'name':'Comoros Franc'}, {'code':'KPW', 'name':'Korea (North) Won'}, {'code':'KRW', 'name':'Korea (South) Won'}, {'code':'KWD', 'name':'Kuwait Dinar'}, {'code':'KYD', 'name':'Cayman Islands Dollar'}, {'code':'KZT', 'name':'Kazakhstan Tenge'}, {'code':'LAK', 'name':'Laos Kip'}, {'code':'LBP', 'name':'Lebanon Pound'}, {'code':'LKR', 'name':'Sri Lanka Rupee'}, {'code':'LRD', 'name':'Liberia Dollar'}, {'code':'LSL', 'name':'Lesotho Loti'}, {'code':'LTL', 'name':'Lithuania Litas'}, {'code':'LYD', 'name':'Libya Dinar'}, {'code':'MAD', 'name':'Morocco Dirham'}, {'code':'MDL', 'name':'Moldova Leu'}, {'code':'MGA', 'name':'Madagascar Ariary'}, {'code':'MKD', 'name':'Macedonia Denar'}, {'code':'MMK', 'name':'Myanmar (Burma) Kyat'}, {'code':'MNT', 'name':'Mongolia Tughrik'}, {'code':'MOP', 'name':'Macau Pataca'}, {'code':'MRO', 'name':'Mauritania Ouguiya'}, {'code':'MUR', 'name':'Mauritius Rupee'}, {'code':'MVR', 'name':'Maldives (Maldive Islands) Rufiyaa'}, {'code':'MWK', 'name':'Malawi Kwacha'}, {'code':'MXN', 'name':'Mexico Peso'}, {'code':'MYR', 'name':'Malaysia Ringgit'}, {'code':'MZN', 'name':'Mozambique Metical'}, {'code':'NAD', 'name':'Namibia Dollar'}, {'code':'NGN', 'name':'Nigeria Naira'}, {'code':'NIO', 'name':'Nicaragua Cordoba'}, {'code':'NOK', 'name':'Norway Krone'}, {'code':'NPR', 'name':'Nepal Rupee'}, {'code':'NZD', 'name':'New Zealand Dollar'}, {'code':'OMR', 'name':'Oman Rial'}, {'code':'PAB', 'name':'Panama Balboa'}, {'code':'PEN', 'name':'Peru Nuevo Sol'}, {'code':'PGK', 'name':'Papua New Guinea Kina'}, {'code':'PHP', 'name':'Philippines Peso'}, {'code':'PKR', 'name':'Pakistan Rupee'}, {'code':'PLN', 'name':'Poland Zloty'}, {'code':'PYG', 'name':'Paraguay Guarani'}, {'code':'QAR', 'name':'Qatar Riyal'}, {'code':'RON', 'name':'Romania New Leu'}, {'code':'RSD', 'name':'Serbia Dinar'}, {'code':'RUB', 'name':'Russia Ruble'}, {'code':'RWF', 'name':'Rwanda Franc'}, {'code':'SAR', 'name':'Saudi Arabia Riyal'}, {'code':'SBD', 'name':'Solomon Islands Dollar'}, {'code':'SCR', 'name':'Seychelles Rupee'}, {'code':'SDG', 'name':'Sudan Pound'}, {'code':'SEK', 'name':'Sweden Krona'}, {'code':'SGD', 'name':'Singapore Dollar'}, {'code':'SHP', 'name':'Saint Helena Pound'}, {'code':'SLL', 'name':'Sierra Leone Leone'}, {'code':'SOS', 'name':'Somalia Shilling'}, {'code':'SPL', 'name':'Seborga Luigino'}, {'code':'SRD', 'name':'Suriname Dollar'}, {'code':'STD', 'name':'São Tomé and Príncipe Dobra'}, {'code':'SVC', 'name':'El Salvador Colon'}, {'code':'SYP', 'name':'Syria Pound'}, {'code':'SZL', 'name':'Swaziland Lilangeni'}, {'code':'THB', 'name':'Thailand Baht'}, {'code':'TJS', 'name':'Tajikistan Somoni'}, {'code':'TMT', 'name':'Turkmenistan Manat'}, {'code':'TND', 'name':'Tunisia Dinar'}, {'code':'TOP', 'name':'Tonga Pa\'anga'}, {'code':'TRY', 'name':'Turkey Lira'}, {'code':'TTD', 'name':'Trinidad and Tobago Dollar'}, {'code':'TVD', 'name':'Tuvalu Dollar'}, {'code':'TWD', 'name':'Taiwan New Dollar'}, {'code':'TZS', 'name':'Tanzania Shilling'}, {'code':'UAH', 'name':'Ukraine Hryvnia'}, {'code':'UGX', 'name':'Uganda Shilling'}, {'code':'USD', 'name':'United States Dollar'}, {'code':'UYU', 'name':'Uruguay Peso'}, {'code':'UZS', 'name':'Uzbekistan Som'}, {'code':'VEF', 'name':'Venezuela Bolivar'}, {'code':'VND', 'name':'Viet Nam Dong'}, {'code':'VUV', 'name':'Vanuatu Vatu'}, {'code':'WST', 'name':'Samoa Tala'}, {'code':'XAF', 'name':'Communauté Financière Africaine (BEAC) CFA Franc BEAC'}, {'code':'XCD', 'name':'East Caribbean Dollar'}, {'code':'XDR', 'name':'International Monetary Fund (IMF) Special Drawing Rights'}, {'code':'XOF', 'name':'Communauté Financière Africaine (BCEAO) Franc'}, {'code':'XPF', 'name':'Comptoirs Français du Pacifique (CFP) Franc'}, {'code':'YER', 'name':'Yemen Rial'}, {'code':'ZAR', 'name':'South Africa Rand'}, {'code':'ZMW', 'name':'Zambia Kwacha'}, {'code':'ZWD', 'name':'Zimbabwe Dollar'}]};var o_hasOwnProperty=Object.prototype.hasOwnProperty;var o_keys=Object.keys || function(obj){var result=[];for(var key in obj) {if(o_hasOwnProperty.call(obj, key)){result.push(key);}}return result;};function _copyObject(source, target){var keys=o_keys(source);var key;for(var i=0, l=keys.length; i < l; i++) {key = keys[i];target[key] = source[key] || target[key];}}function _copyArray(source, target){for(var i=0, l=source.length; i < l; i++) {target[i] = source[i];}}function copyObject(source, _target){var isArray=Array.isArray(source);var target=_target || (isArray?new Array(source.length):{});if(isArray){_copyArray(source, target);}else {_copyObject(source, target);}return target;}Chance.prototype.get = function(name){return copyObject(data[name]);};Chance.prototype.mac_address = function(options){options = initOptions(options);if(!options.separator){options.separator = options.networkVersion?'.':':';}var mac_pool='ABCDEF1234567890', mac='';if(!options.networkVersion){mac = this.n(this.string, 6, {pool:mac_pool, length:2}).join(options.separator);}else {mac = this.n(this.string, 3, {pool:mac_pool, length:4}).join(options.separator);}return mac;};Chance.prototype.normal = function(options){options = initOptions(options, {mean:0, dev:1});var s, u, v, norm, mean=options.mean, dev=options.dev;do {u = this.random() * 2 - 1;v = this.random() * 2 - 1;s = u * u + v * v;}while(s >= 1);norm = u * Math.sqrt(-2 * Math.log(s) / s);return dev * norm + mean;};Chance.prototype.radio = function(options){options = initOptions(options, {side:'?'});var fl='';switch(options.side.toLowerCase()){case 'east':case 'e':fl = 'W';break;case 'west':case 'w':fl = 'K';break;default:fl = this.character({pool:'KW'});break;}return fl + this.character({alpha:true, casing:'upper'}) + this.character({alpha:true, casing:'upper'}) + this.character({alpha:true, casing:'upper'});};Chance.prototype.set = function(name, values){if(typeof name === 'string'){data[name] = values;}else {data = copyObject(name, data);}};Chance.prototype.tv = function(options){return this.radio(options);};Chance.prototype.cnpj = function(){var n=this.n(this.natural, 8, {max:9});var d1=2 + n[7] * 6 + n[6] * 7 + n[5] * 8 + n[4] * 9 + n[3] * 2 + n[2] * 3 + n[1] * 4 + n[0] * 5;d1 = 11 - d1 % 11;if(d1 >= 10){d1 = 0;}var d2=d1 * 2 + 3 + n[7] * 7 + n[6] * 8 + n[5] * 9 + n[4] * 2 + n[3] * 3 + n[2] * 4 + n[1] * 5 + n[0] * 6;d2 = 11 - d2 % 11;if(d2 >= 10){d2 = 0;}return '' + n[0] + n[1] + '.' + n[2] + n[3] + n[4] + '.' + n[5] + n[6] + n[7] + '/0001-' + d1 + d2;};Chance.prototype.mersenne_twister = function(seed){return new MersenneTwister(seed);};Chance.prototype.blueimp_md5 = function(){return new BlueImpMD5();};var MersenneTwister=function MersenneTwister(seed){if(seed === undefined){seed = Math.floor(Math.random() * Math.pow(10, 13));}this.N = 624;this.M = 397;this.MATRIX_A = 2567483615;this.UPPER_MASK = 2147483648;this.LOWER_MASK = 2147483647;this.mt = new Array(this.N);this.mti = this.N + 1;this.init_genrand(seed);};MersenneTwister.prototype.init_genrand = function(s){this.mt[0] = s >>> 0;for(this.mti = 1; this.mti < this.N; this.mti++) {s = this.mt[this.mti - 1] ^ this.mt[this.mti - 1] >>> 30;this.mt[this.mti] = (((s & 4294901760) >>> 16) * 1812433253 << 16) + (s & 65535) * 1812433253 + this.mti;this.mt[this.mti] >>>= 0;}};MersenneTwister.prototype.init_by_array = function(init_key, key_length){var i=1, j=0, k, s;this.init_genrand(19650218);k = this.N > key_length?this.N:key_length;for(; k; k--) {s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;this.mt[i] = (this.mt[i] ^ (((s & 4294901760) >>> 16) * 1664525 << 16) + (s & 65535) * 1664525) + init_key[j] + j;this.mt[i] >>>= 0;i++;j++;if(i >= this.N){this.mt[0] = this.mt[this.N - 1];i = 1;}if(j >= key_length){j = 0;}}for(k = this.N - 1; k; k--) {s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;this.mt[i] = (this.mt[i] ^ (((s & 4294901760) >>> 16) * 1566083941 << 16) + (s & 65535) * 1566083941) - i;this.mt[i] >>>= 0;i++;if(i >= this.N){this.mt[0] = this.mt[this.N - 1];i = 1;}}this.mt[0] = 2147483648;};MersenneTwister.prototype.genrand_int32 = function(){var y;var mag01=new Array(0, this.MATRIX_A);if(this.mti >= this.N){var kk;if(this.mti === this.N + 1){this.init_genrand(5489);}for(kk = 0; kk < this.N - this.M; kk++) {y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;this.mt[kk] = this.mt[kk + this.M] ^ y >>> 1 ^ mag01[y & 1];}for(; kk < this.N - 1; kk++) {y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ y >>> 1 ^ mag01[y & 1];}y = this.mt[this.N - 1] & this.UPPER_MASK | this.mt[0] & this.LOWER_MASK;this.mt[this.N - 1] = this.mt[this.M - 1] ^ y >>> 1 ^ mag01[y & 1];this.mti = 0;}y = this.mt[this.mti++];y ^= y >>> 11;y ^= y << 7 & 2636928640;y ^= y << 15 & 4022730752;y ^= y >>> 18;return y >>> 0;};MersenneTwister.prototype.genrand_int31 = function(){return this.genrand_int32() >>> 1;};MersenneTwister.prototype.genrand_real1 = function(){return this.genrand_int32() * (1 / 4294967295);};MersenneTwister.prototype.random = function(){return this.genrand_int32() * (1 / 4294967296);};MersenneTwister.prototype.genrand_real3 = function(){return (this.genrand_int32() + 0.5) * (1 / 4294967296);};MersenneTwister.prototype.genrand_res53 = function(){var a=this.genrand_int32() >>> 5, b=this.genrand_int32() >>> 6;return (a * 67108864 + b) * (1 / 9007199254740992);};var BlueImpMD5=function BlueImpMD5(){};BlueImpMD5.prototype.VERSION = '1.0.1';BlueImpMD5.prototype.safe_add = function safe_add(x, y){var lsw=(x & 65535) + (y & 65535), msw=(x >> 16) + (y >> 16) + (lsw >> 16);return msw << 16 | lsw & 65535;};BlueImpMD5.prototype.bit_roll = function(num, cnt){return num << cnt | num >>> 32 - cnt;};BlueImpMD5.prototype.md5_cmn = function(q, a, b, x, s, t){return this.safe_add(this.bit_roll(this.safe_add(this.safe_add(a, q), this.safe_add(x, t)), s), b);};BlueImpMD5.prototype.md5_ff = function(a, b, c, d, x, s, t){return this.md5_cmn(b & c | ~b & d, a, b, x, s, t);};BlueImpMD5.prototype.md5_gg = function(a, b, c, d, x, s, t){return this.md5_cmn(b & d | c & ~d, a, b, x, s, t);};BlueImpMD5.prototype.md5_hh = function(a, b, c, d, x, s, t){return this.md5_cmn(b ^ c ^ d, a, b, x, s, t);};BlueImpMD5.prototype.md5_ii = function(a, b, c, d, x, s, t){return this.md5_cmn(c ^ (b | ~d), a, b, x, s, t);};BlueImpMD5.prototype.binl_md5 = function(x, len){x[len >> 5] |= 128 << len % 32;x[(len + 64 >>> 9 << 4) + 14] = len;var i, olda, oldb, oldc, oldd, a=1732584193, b=-271733879, c=-1732584194, d=271733878;for(i = 0; i < x.length; i += 16) {olda = a;oldb = b;oldc = c;oldd = d;a = this.md5_ff(a, b, c, d, x[i], 7, -680876936);d = this.md5_ff(d, a, b, c, x[i + 1], 12, -389564586);c = this.md5_ff(c, d, a, b, x[i + 2], 17, 606105819);b = this.md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);a = this.md5_ff(a, b, c, d, x[i + 4], 7, -176418897);d = this.md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);c = this.md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);b = this.md5_ff(b, c, d, a, x[i + 7], 22, -45705983);a = this.md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);d = this.md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);c = this.md5_ff(c, d, a, b, x[i + 10], 17, -42063);b = this.md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);a = this.md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);d = this.md5_ff(d, a, b, c, x[i + 13], 12, -40341101);c = this.md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);b = this.md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);a = this.md5_gg(a, b, c, d, x[i + 1], 5, -165796510);d = this.md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);c = this.md5_gg(c, d, a, b, x[i + 11], 14, 643717713);b = this.md5_gg(b, c, d, a, x[i], 20, -373897302);a = this.md5_gg(a, b, c, d, x[i + 5], 5, -701558691);d = this.md5_gg(d, a, b, c, x[i + 10], 9, 38016083);c = this.md5_gg(c, d, a, b, x[i + 15], 14, -660478335);b = this.md5_gg(b, c, d, a, x[i + 4], 20, -405537848);a = this.md5_gg(a, b, c, d, x[i + 9], 5, 568446438);d = this.md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);c = this.md5_gg(c, d, a, b, x[i + 3], 14, -187363961);b = this.md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);a = this.md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);d = this.md5_gg(d, a, b, c, x[i + 2], 9, -51403784);c = this.md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);b = this.md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);a = this.md5_hh(a, b, c, d, x[i + 5], 4, -378558);d = this.md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);c = this.md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);b = this.md5_hh(b, c, d, a, x[i + 14], 23, -35309556);a = this.md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);d = this.md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);c = this.md5_hh(c, d, a, b, x[i + 7], 16, -155497632);b = this.md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);a = this.md5_hh(a, b, c, d, x[i + 13], 4, 681279174);d = this.md5_hh(d, a, b, c, x[i], 11, -358537222);c = this.md5_hh(c, d, a, b, x[i + 3], 16, -722521979);b = this.md5_hh(b, c, d, a, x[i + 6], 23, 76029189);a = this.md5_hh(a, b, c, d, x[i + 9], 4, -640364487);d = this.md5_hh(d, a, b, c, x[i + 12], 11, -421815835);c = this.md5_hh(c, d, a, b, x[i + 15], 16, 530742520);b = this.md5_hh(b, c, d, a, x[i + 2], 23, -995338651);a = this.md5_ii(a, b, c, d, x[i], 6, -198630844);d = this.md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);c = this.md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);b = this.md5_ii(b, c, d, a, x[i + 5], 21, -57434055);a = this.md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);d = this.md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);c = this.md5_ii(c, d, a, b, x[i + 10], 15, -1051523);b = this.md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);a = this.md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);d = this.md5_ii(d, a, b, c, x[i + 15], 10, -30611744);c = this.md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);b = this.md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);a = this.md5_ii(a, b, c, d, x[i + 4], 6, -145523070);d = this.md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);c = this.md5_ii(c, d, a, b, x[i + 2], 15, 718787259);b = this.md5_ii(b, c, d, a, x[i + 9], 21, -343485551);a = this.safe_add(a, olda);b = this.safe_add(b, oldb);c = this.safe_add(c, oldc);d = this.safe_add(d, oldd);}return [a, b, c, d];};BlueImpMD5.prototype.binl2rstr = function(input){var i, output='';for(i = 0; i < input.length * 32; i += 8) {output += String.fromCharCode(input[i >> 5] >>> i % 32 & 255);}return output;};BlueImpMD5.prototype.rstr2binl = function(input){var i, output=[];output[(input.length >> 2) - 1] = undefined;for(i = 0; i < output.length; i += 1) {output[i] = 0;}for(i = 0; i < input.length * 8; i += 8) {output[i >> 5] |= (input.charCodeAt(i / 8) & 255) << i % 32;}return output;};BlueImpMD5.prototype.rstr_md5 = function(s){return this.binl2rstr(this.binl_md5(this.rstr2binl(s), s.length * 8));};BlueImpMD5.prototype.rstr_hmac_md5 = function(key, data){var i, bkey=this.rstr2binl(key), ipad=[], opad=[], hash;ipad[15] = opad[15] = undefined;if(bkey.length > 16){bkey = this.binl_md5(bkey, key.length * 8);}for(i = 0; i < 16; i += 1) {ipad[i] = bkey[i] ^ 909522486;opad[i] = bkey[i] ^ 1549556828;}hash = this.binl_md5(ipad.concat(this.rstr2binl(data)), 512 + data.length * 8);return this.binl2rstr(this.binl_md5(opad.concat(hash), 512 + 128));};BlueImpMD5.prototype.rstr2hex = function(input){var hex_tab='0123456789abcdef', output='', x, i;for(i = 0; i < input.length; i += 1) {x = input.charCodeAt(i);output += hex_tab.charAt(x >>> 4 & 15) + hex_tab.charAt(x & 15);}return output;};BlueImpMD5.prototype.str2rstr_utf8 = function(input){return unescape(encodeURIComponent(input));};BlueImpMD5.prototype.raw_md5 = function(s){return this.rstr_md5(this.str2rstr_utf8(s));};BlueImpMD5.prototype.hex_md5 = function(s){return this.rstr2hex(this.raw_md5(s));};BlueImpMD5.prototype.raw_hmac_md5 = function(k, d){return this.rstr_hmac_md5(this.str2rstr_utf8(k), this.str2rstr_utf8(d));};BlueImpMD5.prototype.hex_hmac_md5 = function(k, d){return this.rstr2hex(this.raw_hmac_md5(k, d));};BlueImpMD5.prototype.md5 = function(string, key, raw){if(!key){if(!raw){return this.hex_md5(string);}return this.raw_md5(string);}if(!raw){return this.hex_hmac_md5(key, string);}return this.raw_hmac_md5(key, string);};if(typeof exports !== 'undefined'){if(typeof module !== 'undefined' && module.exports){exports = module.exports = Chance;}exports.Chance = Chance;}if(typeof define === 'function' && define.amd){define([], function(){return Chance;});}if(typeof importScripts !== 'undefined'){chance = new Chance();}if(typeof window === 'object' && typeof window.document === 'object'){window.Chance = Chance;window.chance = new Chance();}})();

}).call(this,require("buffer").Buffer)
},{"buffer":1}],7:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Comparisons = (function () {
  function Comparisons() {
    _classCallCheck(this, Comparisons);
  }

  _createClass(Comparisons, [{
    key: 'byExperience',
    value: function byExperience(a, b) {
      if (a.experience > b.experience) {
        return -1;
      } else if (a.experience < b.experience) {
        return 1;
      }
      return 0;
    }
  }]);

  return Comparisons;
})();

exports['default'] = Comparisons;
module.exports = exports['default'];

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var config = {
  promoted: function promoted(promotion) {
    var message = 'Promoted to ' + this.ranks[promotion.rank].title + ' on ' + promotion.date + ', assigned to the ' + promotion.unit;

    return message;
  },

  graduated: function graduated(graduation, officer) {
    var when = '';

    if (graduation.date && graduation.unit) {
      when = ' on ' + graduation.date + ', assigned to the ' + graduation.unit;
    }

    var message = 'Graduated from ' + officer.traits.base.school + when;
    return message;
  },

  suffix: function suffix(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
      return 'st';
    }
    if (j == 2 && k != 12) {
      return 'nd';
    }
    if (j == 3 && k != 13) {
      return 'rd';
    }
    return 'th';
  },

  formatDate: function formatDate(rawDate) {
    var realDate = undefined;
    realDate = rawDate.toFormat('DDDD the D of MMMM, YYYY');
    realDate = realDate.split(' ');
    realDate[2] = rawDate.toFormat('D') + config.suffix(rawDate.toFormat('D'));
    realDate = realDate.join(' ');
    return realDate;
  },

  random: function random(n) {
    return Math.round(Math.random() * n);
  },

  unitDepth: 2,
  staffSize: 20,

  ranks: {
    lieutenant: {
      hierarchy: 0,
      title: 'Lieutenant',
      alias: 'lieutenant',
      startxp: 10,
      maxxp: 40
    },
    captain: {
      hierarchy: 1,
      title: 'Captain',
      alias: 'captain',
      startxp: 40,
      maxxp: 60
    },
    major: {
      hierarchy: 2,
      title: 'Major',
      alias: 'major',
      startxp: 60,
      maxxp: 80
    },
    lcoronel: {
      hierarchy: 3,
      title: 'Lieutenant Coronel',
      alias: 'lcoronel',
      startxp: 80,
      maxxp: 100
    },
    coronel: {
      hierarchy: 4,
      title: 'Coronel',
      alias: 'coronel',
      startxp: 100,
      maxxp: 120
    },
    bgeneral: {
      hierarchy: 5,
      title: 'Brigade General',
      alias: 'bgeneral',
      startxp: 120,
      maxxp: 140
    },
    dgeneral: {
      hierarchy: 6,
      title: 'Division General',
      alias: 'dgeneral',
      startxp: 140,
      maxxp: 160
    },
    lgeneral: {
      hierarchy: 7,
      title: 'Lieutenant General',
      alias: 'lgeneral',
      startxp: 160,
      maxxp: 180
    },
    general: {
      hierarchy: 8,
      title: 'General',
      alias: 'general',
      startxp: 180,
      maxxp: 220
    }
  }
};

exports['default'] = config;
module.exports = exports['default'];

},{}],9:[function(require,module,exports){
/*

© 2011 by Jerry Sievert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

'use strict';

(function () {
    /** @class Date */
    // constants
    var monthsAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var daysAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    var daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    var dayNames = {
        'su': 0,
        'sun': 0,
        'sunday': 0,
        'mo': 1,
        'mon': 1,
        'monday': 1,
        'tu': 2,
        'tue': 2,
        'tuesday': 2,
        'we': 3,
        'wed': 3,
        'wednesday': 3,
        'th': 4,
        'thu': 4,
        'thursday': 4,
        'fr': 5,
        'fri': 5,
        'friday': 5,
        'sa': 6,
        'sat': 6,
        'saturday': 6
    };
    var monthsAll = monthsFull.concat(monthsAbbr);
    var daysAll = ['su', 'sun', 'sunday', 'mo', 'mon', 'monday', 'tu', 'tue', 'tuesday', 'we', 'wed', 'wednesday', 'th', 'thu', 'thursday', 'fr', 'fri', 'friday', 'sa', 'sat', 'saturday'];

    var monthNames = {
        'jan': 0,
        'january': 0,
        'feb': 1,
        'february': 1,
        'mar': 2,
        'march': 2,
        'apr': 3,
        'april': 3,
        'may': 4,
        'jun': 5,
        'june': 5,
        'jul': 6,
        'july': 6,
        'aug': 7,
        'august': 7,
        'sep': 8,
        'september': 8,
        'oct': 9,
        'october': 9,
        'nov': 10,
        'november': 10,
        'dec': 11,
        'december': 11
    };

    var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // private helper functions
    /** @ignore */
    function pad(str, length) {
        str = String(str);
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    }

    var isInteger = function isInteger(str) {
        if (str.match(/^(\d+)$/)) {
            return true;
        }
        return false;
    };
    var getInt = function getInt(str, i, minlength, maxlength) {
        for (var x = maxlength; x >= minlength; x--) {
            var token = str.substring(i, i + x);
            if (token.length < minlength) {
                return null;
            }
            if (isInteger(token)) {
                return token;
            }
        }
        return null;
    };

    // static class methods
    var origParse = Date.parse;
    // ------------------------------------------------------------------
    // getDateFromFormat( date_string , format_string )
    //
    // This function takes a date string and a format string. It matches
    // If the date string matches the format string, it returns the
    // getTime() of the date. If it does not match, it returns NaN.
    // Original Author: Matt Kruse <matt@mattkruse.com>
    // WWW: http://www.mattkruse.com/
    // Adapted from: http://www.mattkruse.com/javascript/date/source.html
    // ------------------------------------------------------------------

    var getDateFromFormat = function getDateFromFormat(val, format) {
        val = val + '';
        format = format + '';
        var iVal = 0;
        var iFormat = 0;
        var c = '';
        var token = '';
        var token2 = '';
        var x, y;
        var now = new Date();
        var year = now.getYear();
        var month = now.getMonth() + 1;
        var date = 1;
        var hh = 0;
        var mm = 0;
        var ss = 0;
        var ampm = '';

        while (iFormat < format.length) {
            // Get next token from format string
            c = format.charAt(iFormat);
            token = '';
            while (format.charAt(iFormat) === c && iFormat < format.length) {
                token += format.charAt(iFormat++);
            }
            // Extract contents of value based on format token
            if (token === 'yyyy' || token === 'yy' || token === 'y') {
                if (token === 'yyyy') {
                    x = 4;
                    y = 4;
                }
                if (token === 'yy') {
                    x = 2;
                    y = 2;
                }
                if (token === 'y') {
                    x = 2;
                    y = 4;
                }
                year = getInt(val, iVal, x, y);
                if (year === null) {
                    return NaN;
                }
                iVal += year.length;
                if (year.length === 2) {
                    if (year > 70) {
                        year = 1900 + (year - 0);
                    } else {
                        year = 2000 + (year - 0);
                    }
                }
            } else if (token === 'MMM' || token === 'NNN') {
                month = 0;
                for (var i = 0; i < monthsAll.length; i++) {
                    var monthName = monthsAll[i];
                    if (val.substring(iVal, iVal + monthName.length).toLowerCase() === monthName.toLowerCase()) {
                        if (token === 'MMM' || token === 'NNN' && i > 11) {
                            month = i + 1;
                            if (month > 12) {
                                month -= 12;
                            }
                            iVal += monthName.length;
                            break;
                        }
                    }
                }
                if (month < 1 || month > 12) {
                    return NaN;
                }
            } else if (token === 'EE' || token === 'E') {
                for (var n = 0; n < daysAll.length; n++) {
                    var dayName = daysAll[n];
                    if (val.substring(iVal, iVal + dayName.length).toLowerCase() === dayName.toLowerCase()) {
                        iVal += dayName.length;
                        break;
                    }
                }
            } else if (token === 'MM' || token === 'M') {
                month = getInt(val, iVal, token.length, 2);
                if (month === null || month < 1 || month > 12) {
                    return NaN;
                }
                iVal += month.length;
            } else if (token === 'dd' || token === 'd') {
                date = getInt(val, iVal, token.length, 2);
                if (date === null || date < 1 || date > 31) {
                    return NaN;
                }
                iVal += date.length;
            } else if (token === 'hh' || token === 'h') {
                hh = getInt(val, iVal, token.length, 2);
                if (hh === null || hh < 1 || hh > 12) {
                    return NaN;
                }
                iVal += hh.length;
            } else if (token === 'HH' || token === 'H') {
                hh = getInt(val, iVal, token.length, 2);
                if (hh === null || hh < 0 || hh > 23) {
                    return NaN;
                }
                iVal += hh.length;
            } else if (token === 'KK' || token === 'K') {
                hh = getInt(val, iVal, token.length, 2);
                if (hh === null || hh < 0 || hh > 11) {
                    return NaN;
                }
                iVal += hh.length;
            } else if (token === 'kk' || token === 'k') {
                hh = getInt(val, iVal, token.length, 2);
                if (hh === null || hh < 1 || hh > 24) {
                    return NaN;
                }
                iVal += hh.length;
                hh--;
            } else if (token === 'mm' || token === 'm') {
                mm = getInt(val, iVal, token.length, 2);
                if (mm === null || mm < 0 || mm > 59) {
                    return NaN;
                }
                iVal += mm.length;
            } else if (token === 'ss' || token === 's') {
                ss = getInt(val, iVal, token.length, 2);
                if (ss === null || ss < 0 || ss > 59) {
                    return NaN;
                }
                iVal += ss.length;
            } else if (token === 'a') {
                if (val.substring(iVal, iVal + 2).toLowerCase() === 'am') {
                    ampm = 'AM';
                } else if (val.substring(iVal, iVal + 2).toLowerCase() === 'pm') {
                    ampm = 'PM';
                } else {
                    return NaN;
                }
                iVal += 2;
            } else {
                if (val.substring(iVal, iVal + token.length) !== token) {
                    return NaN;
                } else {
                    iVal += token.length;
                }
            }
        }
        // If there are any trailing characters left in the value, it doesn't match
        if (iVal !== val.length) {
            return NaN;
        }
        // Is date valid for month?
        if (month === 2) {
            // Check for leap year
            if (year % 4 === 0 && year % 100 !== 0 || year % 400 === 0) {
                // leap year
                if (date > 29) {
                    return NaN;
                }
            } else {
                if (date > 28) {
                    return NaN;
                }
            }
        }
        if (month === 4 || month === 6 || month === 9 || month === 11) {
            if (date > 30) {
                return NaN;
            }
        }
        // Correct hours value
        if (hh < 12 && ampm === 'PM') {
            hh = hh - 0 + 12;
        } else if (hh > 11 && ampm === 'AM') {
            hh -= 12;
        }
        var newdate = new Date(year, month - 1, date, hh, mm, ss);
        return newdate.getTime();
    };

    /** @ignore */
    Date.parse = function (date, format) {
        if (format) {
            return getDateFromFormat(date, format);
        }
        var timestamp = origParse(date),
            minutesOffset = 0,
            match;
        if (isNaN(timestamp) && (match = /^(\d{4}|[+\-]\d{6})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?))?/.exec(date))) {
            if (match[8] !== 'Z') {
                minutesOffset = +match[10] * 60 + +match[11];

                if (match[9] === '+') {
                    minutesOffset = 0 - minutesOffset;
                }
            }

            match[7] = match[7] || '000';

            timestamp = Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5] + minutesOffset, +match[6], +match[7].substr(0, 3));
        }

        return timestamp;
    };

    function polyfill(name, func) {
        if (Date.prototype[name] === undefined) {
            Date.prototype[name] = func;
        }
    }

    /**
        Returns new instance of Date object with the date set to today and
        the time set to midnight
        @static
        @returns {Date} Today's Date
        @function today
        @memberof Date
     */
    Date.today = function () {
        return new Date().clearTime();
    };

    /**
        Returns new instance of Date object with the date set to today and
        the time set to midnight in UTC
        @static
        @returns {Date} Today's Date in UTC
        @function UTCtoday
        @memberof Date
     */
    Date.UTCtoday = function () {
        return new Date().clearUTCTime();
    };

    /**
        Returns new instance of Date object with the date set to tomorrow and
        the time set to midnight
        @static
        @returns {Date} Tomorrow's Date
        @function tomorrow
        @memberof Date
     */
    Date.tomorrow = function () {
        return Date.today().add({ days: 1 });
    };

    /**
        Returns new instance of Date object with the date set to tomorrow and
        the time set to midnight in UTC
        @static
        @returns {Date} Tomorrow's Date in UTC
        @function UTCtomorrow
        @memberof Date
     */
    Date.UTCtomorrow = function () {
        return Date.UTCtoday().add({ days: 1 });
    };

    /**
        Returns new instance of Date object with the date set to yesterday and
        the time set to midnight
        @static
        @returns {Date} Yesterday's Date
        @function yesterday
        @memberof Date
     */
    Date.yesterday = function () {
        return Date.today().add({ days: -1 });
    };

    /**
        Returns new instance of Date object with the date set to yesterday and
        the time set to midnight in UTC
        @static
        @returns {Date} Yesterday's Date in UTC
        @function UTCyesterday
        @memberof Date
     */
    Date.UTCyesterday = function () {
        return Date.UTCtoday().add({ days: -1 });
    };

    /**
        Returns whether the day is valid
        @static
        @param day {Number} day of the month
        @param year {Number} year
        @param month {Number} month of the year [0-11]
        @returns {Boolean}
        @function validateDay
        @memberof Date
     */
    Date.validateDay = function (day, year, month) {
        var date = new Date(year, month, day);
        return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
    };

    /**
       Returns whether the year is valid
       @static
       @param year {Number} year
       @returns {Boolean}
       @function validateYear
       @memberof Date
    */
    Date.validateYear = function (year) {
        return year >= 0 && year <= 9999;
    };

    /**
       Returns whether the second is valid
       @static
       @param second {Number} second
       @returns {Boolean}
       @function validateSecond
       @memberof Date
    */
    Date.validateSecond = function (second) {
        return second >= 0 && second < 60;
    };

    /**
       Returns whether the month is valid [0-11]
       @static
       @param month {Number} month
       @returns {Boolean}
       @function validateMonth
       @memberof Date
    */
    Date.validateMonth = function (month) {
        return month >= 0 && month < 12;
    };

    /**
       Returns whether the minute is valid
       @static
       @param minute {Number} minute
       @returns {Boolean}
       @function validateMinute
       @memberof Date
    */
    Date.validateMinute = function (minute) {
        return minute >= 0 && minute < 60;
    };

    /**
       Returns whether the millisecond is valid
       @static
       @param millisecond {Number} millisecond
       @returns {Boolean}
       @function validateMillisecond
       @memberof Date
    */
    Date.validateMillisecond = function (milli) {
        return milli >= 0 && milli < 1000;
    };

    /**
       Returns whether the hour is valid [0-23]
       @static
       @param hour {Number} hour
       @returns {Boolean}
       @function validateHour
       @memberof Date
    */
    Date.validateHour = function (hour) {
        return hour >= 0 && hour < 24;
    };

    /**
       Compares two dates
       @static
       @param date1 {Date} first date
       @param date2 {Date} second date
       @returns {Number} -1 if date1 is less than date2, 0 if they are equal, 1 if date1 is more than date2
       @function compare
       @memberof Date
    */
    Date.compare = function (date1, date2) {
        if (date1.valueOf() < date2.valueOf()) {
            return -1;
        } else if (date1.valueOf() > date2.valueOf()) {
            return 1;
        }
        return 0;
    };

    /**
       Compares two dates to the millisecond
       @static
       @param date1 {Date} first date
       @param date2 {Date} second date
       @returns {Boolean}
       @function equals
       @memberof Date
    */
    Date.equals = function (date1, date2) {
        return date1.valueOf() === date2.valueOf();
    };

    /**
       Compares two dates by day
       @static
       @param date1 {Date} first date
       @param date2 {Date} second date
       @returns {Boolean}
       @function equalsDay
       @memberof Date
    */
    Date.equalsDay = function (date1, date2) {
        return date1.toYMD() === date2.toYMD();
    };

    /**
       Returns the day number for a day [0-6]
       @static
       @param day {String} day name
       @returns {Number}
       @function getDayNumberFromName
       @memberof Date
    */
    Date.getDayNumberFromName = function (name) {
        return dayNames[name.toLowerCase()];
    };

    /**
       Returns the day number for a month [0-11]
       @static
       @param month {String} month name
       @returns {Number}
       @function getMonthNumberFromName
       @memberof Date
    */
    Date.getMonthNumberFromName = function (name) {
        return monthNames[name.toLowerCase()];
    };

    /**
       Returns the month name for a month [0-11]
       @static
       @param month {Number} month
       @returns {String}
       @function getMonthNameFromNumber
       @memberof Date
    */
    Date.getMonthNameFromNumber = function (number) {
        return monthsFull[number];
    };

    /**
       Returns the month name abbreviated for a month [0-11]
       @static
       @param month {Number} month
       @returns {String}
       @function getMonthAbbrNameFromNumber
       @memberof Date
    */
    Date.getMonthAbbrFromNumber = function (number) {
        return monthsAbbr[number];
    };

    /**
       Returns whether or not the year is a leap year
       @static
       @param year {Number} year
       @returns {Boolean}
       @function isLeapYear
       @memberof Date
    */
    Date.isLeapYear = function (year) {
        return new Date(year, 1, 29).getDate() === 29;
    };

    /**
       Returns the number of days in a month
       @static
       @param year {Number} year
       @param month {Number} month
       @returns {Number}
       @function getDaysInMonth
       @memberof Date
    */
    Date.getDaysInMonth = function (year, month) {
        if (month === 1) {
            return Date.isLeapYear(year) ? 29 : 28;
        }
        return daysInMonth[month];
    };

    /**
       Returns the abbreviated month name
       @returns {String}
       @function getMonthAbbr
       @instance
       @memberof Date
    */
    polyfill('getMonthAbbr', function () {
        return monthsAbbr[this.getMonth()];
    });

    /**
       Returns the month name
       @returns {String}
       @function getMonthName
       @instance
       @memberof Date
    */
    polyfill('getMonthName', function () {
        return monthsFull[this.getMonth()];
    });

    /**
       Returns the name of last month
       @returns {String}
       @function getLastMonthName
       @instance
       @memberof Date
    */
    polyfill('getLastMonthName', function () {
        var i = this.getMonth();
        i = i === 0 ? 11 : i - 1;
        return monthsFull[i];
    });

    /**
       Returns the current UTC office
       @returns {String}
       @function getUTCOffset
       @instance
       @memberof Date
    */
    polyfill('getUTCOffset', function () {
        var tz = pad(Math.abs(this.getTimezoneOffset() / 0.6), 4);
        if (this.getTimezoneOffset() > 0) {
            tz = '-' + tz;
        }
        return tz;
    });

    /**
       Returns a padded Common Log Format
       @returns {String}
       @function toCLFString
       @deprecated Will be deprecated in version 2.0 in favor of toFormat
       @instance
       @memberof Date
    */
    polyfill('toCLFString', function () {
        return pad(this.getDate(), 2) + '/' + this.getMonthAbbr() + '/' + this.getFullYear() + ':' + pad(this.getHours(), 2) + ':' + pad(this.getMinutes(), 2) + ':' + pad(this.getSeconds(), 2) + ' ' + this.getUTCOffset();
    });

    /**
       Returns a padded Year/Month/Day
       @returns {String}
       @param separator {String} optional, defaults to "-"
       @function toYMD
       @deprecated Will be deprecated in version 2.0 in favor of toFormat
       @instance
       @memberof Date
    */
    polyfill('toYMD', function (separator) {
        separator = typeof separator === 'undefined' ? '-' : separator;
        return this.getFullYear() + separator + pad(this.getMonth() + 1, 2) + separator + pad(this.getDate(), 2);
    });

    /**
       Returns a formatted String for database insertion
       @returns {String}
       @function toDBString
       @deprecated Will be deprecated in version 2.0 in favor of toFormat
       @instance
       @memberof Date
    */
    polyfill('toDBString', function () {
        return this.getUTCFullYear() + '-' + pad(this.getUTCMonth() + 1, 2) + '-' + pad(this.getUTCDate(), 2) + ' ' + pad(this.getUTCHours(), 2) + ':' + pad(this.getUTCMinutes(), 2) + ':' + pad(this.getUTCSeconds(), 2);
    });

    /**
       Sets the time to 00:00:00.0000 and returns a new Date object
       @returns {Date}
       @function clearTime
       @instance
       @memberof Date
    */
    polyfill('clearTime', function () {
        this.setHours(0);
        this.setMinutes(0);
        this.setSeconds(0);
        this.setMilliseconds(0);

        return this;
    });

    /**
       Sets the time to 00:00:00.0000 and returns a new Date object with set to UTC
       @returns {Date}
       @function clearUTCTime
       @instance
       @memberof Date
    */
    polyfill('clearUTCTime', function () {
        this.setUTCHours(0);
        this.setUTCMinutes(0);
        this.setUTCSeconds(0);
        this.setUTCMilliseconds(0);

        return this;
    });

    /**
       Adds `milliseconds`, `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`, and `years` and returns a new Date.
       Usage: `data.add({ "seconds": 10, "days": 1 })`
       @param additions {Object}
       @returns {Date}
       @function add
       @instance
       @memberof Date
    */
    polyfill('add', function (obj) {
        if (obj.milliseconds !== undefined) {
            this.setMilliseconds(this.getMilliseconds() + obj.milliseconds);
        }
        if (obj.seconds !== undefined) {
            this.setSeconds(this.getSeconds() + obj.seconds);
        }
        if (obj.minutes !== undefined) {
            this.setMinutes(this.getMinutes() + obj.minutes);
        }
        if (obj.hours !== undefined) {
            this.setHours(this.getHours() + obj.hours);
        }
        if (obj.days !== undefined) {
            this.setDate(this.getDate() + obj.days);
        }
        if (obj.weeks !== undefined) {
            this.setDate(this.getDate() + obj.weeks * 7);
        }
        if (obj.months !== undefined) {
            this.setMonth(this.getMonth() + obj.months);
        }
        if (obj.years !== undefined) {
            this.setFullYear(this.getFullYear() + obj.years);
        }
        return this;
    });

    /**
       Adds milliseconds to the Date and returns it
       @returns {Date}
       @param milliseconds {Number} Number of milliseconds to add
       @function addMilliseconds
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addMilliseconds', function (milliseconds) {
        return this.add({ milliseconds: milliseconds });
    });

    /**
       Adds seconds to the Date and returns it
       @returns {Date}
       @param seconds {Number} Number of seconds to add
       @function addSeconds
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addSeconds', function (seconds) {
        return this.add({ seconds: seconds });
    });

    /**
       Adds minutes to the Date and returns it
       @returns {Date}
       @param minutes {Number} Number of minutes to add
       @function addMinutes
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addMinutes', function (minutes) {
        return this.add({ minutes: minutes });
    });

    /**
       Adds hours to the Date and returns it
       @returns {Date}
       @param hours {Number} Number of hours to add
       @function addHours
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addHours', function (hours) {
        return this.add({ hours: hours });
    });

    /**
       Adds days to the Date and returns it
       @returns {Date}
       @param days {Number} Number of days to add
       @function addSeconds
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addDays', function (days) {
        return this.add({ days: days });
    });

    /**
       Adds weeks to the Date and returns it
       @returns {Date}
       @param weeks {Number} Number of weeks to add
       @function addWeeks
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addWeeks', function (weeks) {
        return this.add({ days: weeks * 7 });
    });

    /**
       Adds months to the Date and returns it
       @returns {Date}
       @param months {Number} Number of months to add
       @function addMonths
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addMonths', function (months) {
        return this.add({ months: months });
    });

    /**
       Adds years to the Date and returns it
       @returns {Date}
       @param years {Number} Number of years to add
       @function addYears
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addYears', function (years) {
        return this.add({ years: years });
    });

    /**
       Removes `milliseconds`, `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`, and `years` and returns a new Date.
       Usage: `data.remove({ "seconds": 10, "days": 1 })`
       @param removals {Object}
       @returns {Date}
       @function remove
       @instance
       @memberof Date
    */
    polyfill('remove', function (obj) {
        if (obj.seconds !== undefined) {
            this.setSeconds(this.getSeconds() - obj.seconds);
        }
        if (obj.minutes !== undefined) {
            this.setMinutes(this.getMinutes() - obj.minutes);
        }
        if (obj.hours !== undefined) {
            this.setHours(this.getHours() - obj.hours);
        }
        if (obj.days !== undefined) {
            this.setDate(this.getDate() - obj.days);
        }
        if (obj.weeks !== undefined) {
            this.setDate(this.getDate() - obj.weeks * 7);
        }
        if (obj.months !== undefined) {
            this.setMonth(this.getMonth() - obj.months);
        }
        if (obj.years !== undefined) {
            this.setFullYear(this.getFullYear() - obj.years);
        }
        return this;
    });

    /**
       Removes milliseconds from the Date and returns it
       @returns {Date}
       @param milliseconds {Number} Number of millseconds to remove
       @function removeMilliseconds
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeMilliseconds', function (milliseconds) {
        throw new Error('Not implemented');
    });

    /**
       Removes seconds from the Date and returns it
       @returns {Date}
       @param seconds {Number} Number of seconds to remove
       @function removeSeconds
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeSeconds', function (seconds) {
        return this.remove({ seconds: seconds });
    });

    /**
       Removes minutes from the Date and returns it
       @returns {Date}
       @param seconds {Number} Number of minutes to remove
       @function removeMinutes
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeMinutes', function (minutes) {
        return this.remove({ minutes: minutes });
    });

    /**
       Removes hours from the Date and returns it
       @returns {Date}
       @param hours {Number} Number of hours to remove
       @function removeHours
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeHours', function (hours) {
        return this.remove({ hours: hours });
    });

    /**
       Removes days from the Date and returns it
       @returns {Date}
       @param days {Number} Number of days to remove
       @function removeDays
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeDays', function (days) {
        return this.remove({ days: days });
    });

    /**
       Removes weeks from the Date and returns it
       @returns {Date}
       @param weeks {Number} Number of weeks to remove
       @function removeWeeks
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeWeeks', function (weeks) {
        return this.remove({ days: weeks * 7 });
    });

    /**
       Removes months from the Date and returns it
       @returns {Date}
       @param months {Number} Number of months to remove
       @function removeMonths
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeMonths', function (months) {
        return this.remove({ months: months });
    });

    /**
       Removes years from the Date and returns it
       @returns {Date}
       @param years {Number} Number of years to remove
       @function removeYears
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeYears', function (years) {
        return this.remove({ years: years });
    });

    /**
       Adds weekdays based on a Mon-Fri work schedule and returns it
       @returns {Date}
       @param weekdays {Number} Number of weekdays to add
       @function addWeekdays
       @instance
       @memberof Date
    */
    polyfill('addWeekdays', function (weekdays) {
        var day = this.getDay();
        if (day === 0) {
            day = 7;
        }
        var daysOffset = weekdays;
        var weekspan = Math.floor((weekdays + day - 1) / 5);
        if (weekdays > 0) {
            daysOffset += weekspan * 2;
            if (day > 5) {
                daysOffset -= day - 5;
            }
        } else {
            daysOffset += Math.min(weekspan * 2, 0);
            if (day > 6) {
                daysOffset -= 1;
            }
        }
        return this.addDays(daysOffset);
    });

    /**
       Sets the time and date to now
       @function setTimeToNow
       @instance
       @memberof Date
    */
    polyfill('setTimeToNow', function () {
        var n = new Date();
        this.setMilliseconds(n.getMilliseconds());
        this.setSeconds(n.getSeconds());
        this.setMinutes(n.getMinutes());
        this.setHours(n.getHours());
    });

    /**
       Returns a cloned copy of the current Date
       @function clone
       @instance
       @memberof Date
    */
    polyfill('clone', function () {
        return new Date(this.valueOf());
    });

    /**
       Returns whether this Date is between a start and end date
       @function between
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('between', function (start, end) {
        return this.valueOf() >= start.valueOf() && this.valueOf() <= end.valueOf();
    });
    /**
       Compares a Date to this Date
       @param {Date} Date to compare to
       @function compareTo
       @returns {Number} -1 if less than date, 0 if they are equal, 1 if more than date
       @instance
       @memberof Date
    */
    polyfill('compareTo', function (date) {
        return Date.compare(this, date);
    });

    /**
       Compares a Date and time to this Date and time for equality
       @param {Date} Date to compare to
       @function equals
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('equals', function (date) {
        return Date.equals(this, date);
    });

    /**
       Compares a Date to this Date for equality
       @param {Date} Date to compare to
       @function equalsDay
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('equalsDay', function (date) {
        return Date.equalsDay(this, date);
    });

    /**
       Checks to see if the Date is today
       @function isToday
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('isToday', function () {
        return Date.equalsDay(this, Date.today());
    });

    /**
       Compares a Date to this Date for to see if it is after the Date passed
       @param {Date} Date to compare to
       @function isAfter
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('isAfter', function (date) {
        date = date ? date : new Date();
        return this.compareTo(date) > 0;
    });

    /**
       Compares a Date to this Date for to see if it is before the Date passed
       @param {Date} Date to compare to
       @function isBefore
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('isBefore', function (date) {
        date = date ? date : new Date();
        return this.compareTo(date) < 0;
    });

    /**
       Returns `true` if the Date is a weekend using standard Saturday/Sunday definition of a weekend
       @function isWeekend
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('isWeekend', function (date) {
        return this.getDay() % 6 === 0;
    });

    /**
       Returns the number of days between this Date and the Date passed in
       @function getDaysBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getDaysBetween', function (date) {
        return (date.clone().valueOf() - this.valueOf()) / 86400000 | 0;
    });

    /**
       Returns the number of hours between this Date and the Date passed in
       @function getHoursBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getHoursBetween', function (date) {
        return (date.clone().valueOf() - this.valueOf()) / 3600000 | 0;
    });

    /**
       Returns the number of minutes between this Date and the Date passed in
       @function getMinutesBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getMinutesBetween', function (date) {
        return (date.clone().valueOf() - this.valueOf()) / 60000 | 0;
    });

    /**
       Returns the number of seconds between this Date and the Date passed in
       @function getSecondsBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getSecondsBetween', function (date) {
        return (date.clone().valueOf() - this.valueOf()) / 1000 | 0;
    });

    /**
       Returns the number of milliseconds between this Date and the Date passed in
       @function getMillisecondsBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getMillisecondsBetween', function (date) {
        return date.clone().valueOf() - this.valueOf() | 0;
    });

    /**
       Returns the number of months between this Date and the Date passed in
       @function getMonthsBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getMonthsBetween', function (date) {
        // make a guess at the answer; using 31 means that we'll be close but won't exceed
        var daysDiff,
            daysInMonth,
            months = Math.ceil(new Date(date - this).getUTCDate() / 31),
            testDate = new Date(this.getTime()),
            totalDays = Date.getDaysInMonth;

        // find the maximum number of months that's less than or equal to the end date
        testDate.setUTCMonth(testDate.getUTCMonth() + months);
        while (testDate.getTime() < date.getTime()) {
            testDate.setUTCMonth(testDate.getUTCMonth() + 1);
            months++;
        }

        if (testDate.getTime() !== date.getTime()) {
            // back off 1 month since we exceeded the end date
            testDate.setUTCMonth(testDate.getUTCMonth() - 1);
            months--;
        }

        if (date.getUTCMonth() === testDate.getUTCMonth()) {
            daysDiff = new Date(date - testDate).getUTCDate();
            daysInMonth = totalDays(testDate.getUTCFullYear(), testDate.getUTCMonth());

            return months + daysDiff / daysInMonth;
        } else {
            // if two dates are on different months,
            // the calculation must be done for each separate month
            // because their number of days can be different
            daysInMonth = totalDays(testDate.getUTCFullYear(), testDate.getUTCMonth());
            daysDiff = daysInMonth - testDate.getUTCDate() + 1;

            return months + +(daysDiff / daysInMonth).toFixed(5) + +(date.getUTCDate() / totalDays(date.getUTCFullYear(), date.getUTCMonth())).toFixed(5);
        }
    });

    /**
       Returns the ordinal number of this Date
       @function getOrdinalNumber
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getOrdinalNumber', function () {
        return Math.ceil((this.clone().clearTime() - new Date(this.getFullYear(), 0, 1)) / 86400000) + 1;
    });

    /**
       Returns the a formatted version of this Date
       @function toFormat
       @param format {String} Format of the Date, using `YYYY`, `YY`, `MM`, `DD`, `HH`, `HH24`, `MI`, `SS`, etc
       @returns {String}
       @instance
       @memberof Date
    */
    polyfill('toFormat', function (format) {
        return toFormat(format, getReplaceMap(this));
    });

    /**
       Returns the a formatted version of the UTC version of this Date
       @function toUTCFormat
       @param format {String} Format of the Date, using `YYYY`, `YY`, `MM`, `DD`, `HH`, `HH24`, `MI`, `SS`, etc
       @returns {String}
       @instance
       @memberof Date
    */
    polyfill('toUTCFormat', function (format) {
        return toFormat(format, getUTCReplaceMap(this));
    });

    /**
       Returns the week number of this Date
       @function getWeekNumber
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getWeekNumber', function () {
        var onejan = new Date(this.getFullYear(), 0, 1);
        return Math.ceil(((this - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    });

    /**
       Returns the week number of this Date, zero padded
       @function getFullWeekNumber
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getFullWeekNumber', function () {
        var weekNumber = '' + this.getWeekNumber();
        if (weekNumber.length === 1) {
            weekNumber = '0' + weekNumber;
        }

        return weekNumber;
    });

    var toFormat = function toFormat(format, replaceMap) {
        var f = [format],
            i,
            l,
            s;
        var replace = function replace(str, rep) {
            var i = 0,
                l = f.length,
                j,
                ll,
                t,
                n = [];
            for (; i < l; i++) {
                if (typeof f[i] == 'string') {
                    t = f[i].split(str);
                    for (j = 0, ll = t.length - 1; j < ll; j++) {
                        n.push(t[j]);
                        n.push([rep]); // replacement pushed as non-string
                    }
                    n.push(t[ll]);
                } else {
                    // must be a replacement, don't process, just push
                    n.push(f[i]);
                }
            }
            f = n;
        };

        for (i in replaceMap) {
            replace(i, replaceMap[i]);
        }

        s = '';
        for (i = 0, l = f.length; i < l; i++) s += typeof f[i] == 'string' ? f[i] : f[i][0];
        return f.join('');
    };

    var getReplaceMap = function getReplaceMap(date) {
        var hours = date.getHours() % 12 ? date.getHours() % 12 : 12;
        return {
            'YYYY': date.getFullYear(),
            'YY': String(date.getFullYear()).slice(-2),
            'MMMM': monthsFull[date.getMonth()],
            'MMM': monthsAbbr[date.getMonth()],
            'MM': pad(date.getMonth() + 1, 2),
            'MI': pad(date.getMinutes(), 2),
            'M': date.getMonth() + 1,
            'DDDD': daysFull[date.getDay()],
            'DDD': daysAbbr[date.getDay()],
            'DD': pad(date.getDate(), 2),
            'D': date.getDate(),
            'HH24': pad(date.getHours(), 2),
            'HH': pad(hours, 2),
            'H': hours,
            'SS': pad(date.getSeconds(), 2),
            'PP': date.getHours() >= 12 ? 'PM' : 'AM',
            'P': date.getHours() >= 12 ? 'pm' : 'am',
            'LL': pad(date.getMilliseconds(), 3)
        };
    };

    var getUTCReplaceMap = function getUTCReplaceMap(date) {
        var hours = date.getUTCHours() % 12 ? date.getUTCHours() % 12 : 12;
        return {
            'YYYY': date.getUTCFullYear(),
            'YY': String(date.getUTCFullYear()).slice(-2),
            'MMMM': monthsFull[date.getUTCMonth()],
            'MMM': monthsAbbr[date.getUTCMonth()],
            'MM': pad(date.getUTCMonth() + 1, 2),
            'MI': pad(date.getUTCMinutes(), 2),
            'M': date.getUTCMonth() + 1,
            'DDDD': daysFull[date.getUTCDay()],
            'DDD': daysAbbr[date.getUTCDay()],
            'DD': pad(date.getUTCDate(), 2),
            'D': date.getUTCDate(),
            'HH24': pad(date.getUTCHours(), 2),
            'HH': pad(hours, 2),
            'H': hours,
            'SS': pad(date.getUTCSeconds(), 2),
            'PP': date.getUTCHours() >= 12 ? 'PM' : 'AM',
            'P': date.getUTCHours() >= 12 ? 'pm' : 'am',
            'LL': pad(date.getUTCMilliseconds(), 3)
        };
    };
})();

},{}],10:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _army = require('./army');

var _army2 = _interopRequireDefault(_army);

var _uiJsx = require('./ui.jsx');

var _uiJsx2 = _interopRequireDefault(_uiJsx);

var army = new _army2['default']();
var ui = new _uiJsx2['default']();

var Engine = (function () {
  function Engine() {
    _classCallCheck(this, Engine);

    this.turn = 0;
  }

  _createClass(Engine, [{
    key: 'start',
    value: function start() {
      // let count = 0;
      // while (count < 200) {
      //   this.update();
      //   count++;
      // }
      setInterval(this.update, 500);
    }
  }, {
    key: 'turn',
    value: function turn() {
      return this.turn;
    }
  }, {
    key: 'update',
    value: function update() {
      this.turn++;
      army.HQ.update();
      ui.render(army);
    }
  }]);

  return Engine;
})();

exports['default'] = Engine;
module.exports = exports['default'];

},{"./army":5,"./ui.jsx":18}],11:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _engine = require('./engine');

var _engine2 = _interopRequireDefault(_engine);

var engine = new _engine2['default']();

engine.start();

},{"./engine":10}],12:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

require('./date.js');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var HQ = (function () {
  function HQ() {
    _classCallCheck(this, HQ);

    this.rawDate = new Date();
    this.units = [];
  }

  _createClass(HQ, [{
    key: 'updateDate',
    value: function updateDate() {
      this.rawDate = this.rawDate.addDays(_config2['default'].random(150));
      this.realDate = _config2['default'].formatDate(this.rawDate);
    }
  }, {
    key: 'update',
    value: function update() {
      var _this = this;

      this.updateDate();

      this.units.map(function (unit) {
        if (unit.commander.retired) {
          _this.replace(unit);
        }
      });

      this.officers.update();
      this.officers.retire();
    }
  }, {
    key: 'add',
    value: function add(unit) {
      this.units.push(unit);
    }
  }, {
    key: 'deassign',
    value: function deassign(unitId) {
      var _this2 = this;

      this.units.some(function (unit) {
        if (unit.id === unitId) {
          _this2.replace(unit);
          return true;
        }
      });
    }
  }, {
    key: 'replace',
    value: function replace(unit) {
      unit.commander = this.officers.replace(unit.commander);
    }
  }, {
    key: 'unitName',
    value: function unitName(unitId) {
      var name = '';
      this.units.some(function (unit) {
        if (unit.id === unitId) {
          name = unit.name;
          return true;
        }
      });
      return name;
    }
  }]);

  return HQ;
})();

exports['default'] = HQ;
module.exports = exports['default'];

},{"./config":8,"./date.js":9}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var names = {};

names.corps = ['1st Corp', '2nd Corp'];

names.divisions = ['1st Division', '2nd Division', '3rd Division', '4th Division'];

names.brigades = ['1st Brigade', '2nd Brigade', '3rd Brigade', '4th Brigade', '5th Brigade', '6th Brigade', '7th Brigade', '8th Brigade'];

names.regiments = ['1st Regiment', '2nd Regiment', '3rd Regiment', '4th Regiment', '5th Regiment', '6th Regiment', '7th Regiment', '8th Regiment', '9th Regiment', '10th Regiment', '11th Regiment', '12th Regiment', '13th Regiment', '14th Regiment', '15th Regiment', '16th Regiment'];

names.companies = ['1st A Company', '2nd A Company', '3rd A Company', '4th A Company', '5th A Company', '6th A Company', '7th A Company', '8th A Company', '9th A Company', '10th A Company', '11th A Company', '12th A Company', '13th A Company', '14th A Company', '15th A Company', '16th A Company', '17th A Company', '18th A Company', '19th A Company', '20th A Company', '21th A Company', '22th A Company', '23th A Company', '24th A Company', '25th A Company', '26th A Company', '27th A Company', '28th A Company', '29th A Company', '30th A Company', '31th A Company', '32th A Company', '1st B Company', '2nd B Company', '3rd B Company', '4th B Company', '5th B Company', '6th B Company', '7th B Company', '8th B Company', '9th B Company', '10th B Company', '11th B Company', '12th B Company', '13th B Company', '14th B Company', '15th B Company', '16th B Company', '17th B Company', '18th B Company', '19th B Company', '20th B Company', '21th B Company', '22th B Company', '23th B Company', '24th B Company', '25th B Company', '26th B Company', '27th B Company', '28th B Company', '29th B Company', '30th B Company', '31th B Company', '32th B Company'];

names.battalions = ['1st Battalion', '2nd Battalion', '3rd Battalion', '4th Battalion', '5th Battalion', '6th Battalion', '7th Battalion', '8th Battalion', '9th Battalion', '10th Battalion', '11th Battalion', '12th Battalion', '13th Battalion', '14th Battalion', '15th Battalion', '16th Battalion', '17th Battalion', '18th Battalion', '19th Battalion', '20th Battalion', '21th Battalion', '22th Battalion', '23th Battalion', '24th Battalion', '25th Battalion', '26th Battalion', '27th Battalion', '28th Battalion', '29th Battalion', '30th Battalion', '31th Battalion', '32th Battalion', '33th Battalion', '34th Battalion', '35th Battalion', '36th Battalion', '37th Battalion', '38th Battalion', '39th Battalion', '40th Battalion', '41th Battalion', '42th Battalion', '43th Battalion', '44th Battalion', '45th Battalion', '46th Battalion', '47th Battalion', '48th Battalion', '49th Battalion', '50th Battalion', '51th Battalion', '52th Battalion', '53th Battalion', '54th Battalion', '55th Battalion', '56th Battalion', '57th Battalion', '58th Battalion', '59th Battalion', '60th Battalion', '61th Battalion', '62th Battalion', '63th Battalion', '64th Battalion'];

names.platoons = ['1st Platoon', '2nd Platoon', '3rd Platoon', '4th Platoon', '5th Platoon', '6th Platoon', '7th Platoon', '8th Platoon', '9th Platoon', '10th Platoon', '11th Platoon', '12th Platoon', '13th Platoon', '14th Platoon', '15th Platoon', '16th Platoon', '17th Platoon', '18th Platoon', '19th Platoon', '20th Platoon', '21th Platoon', '22th Platoon', '23th Platoon', '24th Platoon', '25th Platoon', '26th Platoon', '27th Platoon', '28th Platoon', '29th Platoon', '30th Platoon', '31th Platoon', '32th Platoon', '33th Platoon', '34th Platoon', '35th Platoon', '36th Platoon', '37th Platoon', '38th Platoon', '39th Platoon', '40th Platoon', '41th Platoon', '42th Platoon', '43th Platoon', '44th Platoon', '45th Platoon', '46th Platoon', '47th Platoon', '48th Platoon', '49th Platoon', '50th Platoon', '51th Platoon', '52th Platoon', '53th Platoon', '54th Platoon', '55th Platoon', '56th Platoon', '57th Platoon', '58th Platoon', '59th Platoon', '60th Platoon', '61th Platoon', '62th Platoon', '63th Platoon', '64th Platoon', '65th Platoon', '66th Platoon', '67th Platoon', '68th Platoon', '69th Platoon', '70th Platoon', '71th Platoon', '72th Platoon', '73th Platoon', '74th Platoon', '75th Platoon', '76th Platoon', '77th Platoon', '78th Platoon', '79th Platoon', '80th Platton', '81th Platoon', '82th Platoon', '83th Platoon', '84th Platoon', '85th Platoon', '86th Platoon', '87th Platoon', '88th Platoon', '89th Platoon', '90th Platoon', '91th Platoon', '92th Platoon', '93th Platoon', '94th Platoon', '95th Platoon', '96th Platoon', '97th Platoon', '98th Platoon', '99th Platoon', '100th Platoon', '101th Platoon', '102th Platoon', '103th Platoon', '104th Platoon', '105th Platoon', '106th Platoon', '107th Platoon', '108th Platoon', '109th Platoon', '110th Platoon', '111th Platoon', '112th Platoon', '113th Platoon', '114th Platoon', '115th Platoon', '116th Platoon', '117th Platoon', '118th Platoon', '119th Platoon', '120th Platoon', '121th Platoon', '122th Platoon', '123th Platoon', '124th Platoon', '125th Platoon', '126th Platoon', '127th Platoon', '128th Platoon', '129th Platoon'];

names.squads = ['1st A Squad', '2nd A Squad', '3rd A Squad', '4th A Squad', '5th A Squad', '6th A Squad', '7th A Squad', '8th A Squad', '9th A Squad', '10th A Squad', '11th A Squad', '12th A Squad', '13th A Squad', '14th A Squad', '15th A Squad', '16th A Squad', '17th A Squad', '18th A Squad', '19th A Squad', '20th A Squad', '21th A Squad', '22th A Squad', '23th A Squad', '24th A Squad', '25th A Squad', '26th A Squad', '27th A Squad', '28th A Squad', '29th A Squad', '30th A Squad', '31th A Squad', '32th A Squad', '33th A Squad', '34th A Squad', '35th A Squad', '36th A Squad', '37th A Squad', '38th A Squad', '39th A Squad', '40th A Squad', '41th A Squad', '42th A Squad', '43th A Squad', '44th A Squad', '45th A Squad', '46th A Squad', '47th A Squad', '48th A Squad', '49th A Squad', '50th A Squad', '51th A Squad', '52th A Squad', '53th A Squad', '54th A Squad', '55th A Squad', '56th A Squad', '57th A Squad', '58th A Squad', '59th A Squad', '60th A Squad', '61th A Squad', '62th A Squad', '63th A Squad', '64th A Squad', '65th A Squad', '66th A Squad', '67th A Squad', '68th A Squad', '69th A Squad', '70th A Squad', '71th A Squad', '72th A Squad', '73th A Squad', '74th A Squad', '75th A Squad', '76th A Squad', '77th A Squad', '78th A Squad', '79th A Squad', '80th Platton', '81th A Squad', '82th A Squad', '83th A Squad', '84th A Squad', '85th A Squad', '86th A Squad', '87th A Squad', '88th A Squad', '89th A Squad', '90th A Squad', '91th A Squad', '92th A Squad', '93th A Squad', '94th A Squad', '95th A Squad', '96th A Squad', '97th A Squad', '98th A Squad', '99th A Squad', '100th A Squad', '101th A Squad', '102th A Squad', '103th A Squad', '104th A Squad', '105th A Squad', '106th A Squad', '107th A Squad', '108th A Squad', '109th A Squad', '110th A Squad', '111th A Squad', '112th A Squad', '113th A Squad', '114th A Squad', '115th A Squad', '116th A Squad', '117th A Squad', '118th A Squad', '119th A Squad', '120th A Squad', '121th A Squad', '122th A Squad', '123th A Squad', '124th A Squad', '125th A Squad', '126th A Squad', '127th A Squad', '128th A Squad', '129th A Squad', '1st B Squad', '2nd B Squad', '3rd B Squad', '4th B Squad', '5th B Squad', '6th B Squad', '7th B Squad', '8th B Squad', '9th B Squad', '10th B Squad', '11th B Squad', '12th B Squad', '13th B Squad', '14th B Squad', '15th B Squad', '16th B Squad', '17th B Squad', '18th B Squad', '19th B Squad', '20th B Squad', '21th B Squad', '22th B Squad', '23th B Squad', '24th B Squad', '25th B Squad', '26th B Squad', '27th B Squad', '28th B Squad', '29th B Squad', '30th B Squad', '31th B Squad', '32th B Squad', '33th B Squad', '34th B Squad', '35th B Squad', '36th B Squad', '37th B Squad', '38th B Squad', '39th B Squad', '40th B Squad', '41th B Squad', '42th B Squad', '43th B Squad', '44th B Squad', '45th B Squad', '46th B Squad', '47th B Squad', '48th B Squad', '49th B Squad', '50th B Squad', '51th B Squad', '52th B Squad', '53th B Squad', '54th B Squad', '55th B Squad', '56th B Squad', '57th B Squad', '58th B Squad', '59th B Squad', '60th B Squad', '61th B Squad', '62th B Squad', '63th B Squad', '64th B Squad', '65th B Squad', '66th B Squad', '67th B Squad', '68th B Squad', '69th B Squad', '70th B Squad', '71th B Squad', '72th B Squad', '73th B Squad', '74th B Squad', '75th B Squad', '76th B Squad', '77th B Squad', '78th B Squad', '79th B Squad', '80th Platton', '81th B Squad', '82th B Squad', '83th B Squad', '84th B Squad', '85th B Squad', '86th B Squad', '87th B Squad', '88th B Squad', '89th B Squad', '90th B Squad', '91th B Squad', '92th B Squad', '93th B Squad', '94th B Squad', '95th B Squad', '96th B Squad', '97th B Squad', '98th B Squad', '99th B Squad', '100th B Squad', '101th B Squad', '102th B Squad', '103th B Squad', '104th B Squad', '105th B Squad', '106th B Squad', '107th B Squad', '108th B Squad', '109th B Squad', '110th B Squad', '111th B Squad', '112th B Squad', '113th B Squad', '114th B Squad', '115th B Squad', '116th B Squad', '117th B Squad', '118th B Squad', '119th B Squad', '120th B Squad', '121th B Squad', '122th B Squad', '123th B Squad', '124th B Squad', '125th B Squad', '126th B Squad', '127th B Squad', '128th B Squad', '129th B Squad'];

exports['default'] = names;
module.exports = exports['default'];

},{}],14:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

require('./chance');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _traits = require('./traits');

var _traits2 = _interopRequireDefault(_traits);

var chance = new Chance();
var traits = new _traits2['default']();

var Officer = (function () {
  function Officer(spec) {
    _classCallCheck(this, Officer);

    this.unitId = spec.unitId;
    this.rank = _config2['default'].ranks[spec.rank];
    this.experience = _config2['default'].ranks[spec.rank].startxp + _config2['default'].random(10);

    this.traits = {
      base: traits.random()
    };

    this.administration = this.traits.base.administration + _config2['default'].random(10);
    this.intelligence = this.traits.base.intelligence + _config2['default'].random(10);
    this.commanding = this.traits.base.commanding + _config2['default'].random(10);
    this.diplomacy = this.traits.base.diplomacy + _config2['default'].random(10);

    this.lname = chance.last();
    this.fname = chance.name({ gender: 'male' });

    var graduation = {
      unit: spec.unitName,
      date: spec.date
    };

    this.history = [];
    this.history.push(_config2['default'].graduated(graduation, this));
  }

  _createClass(Officer, [{
    key: 'name',
    value: function name() {
      return this.rank.title + ' ' + this.fname + ' ' + this.lname;
    }
  }, {
    key: 'update',
    value: function update() {
      this.experience++;
      if (this.experience > this.rank.maxxp) this.retire();
    }
  }, {
    key: 'retire',
    value: function retire() {
      this.retired = true;
    }
  }]);

  return Officer;
})();

exports['default'] = Officer;
module.exports = exports['default'];

},{"./chance":6,"./config":8,"./traits":17}],15:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _officer = require('./officer');

var _officer2 = _interopRequireDefault(_officer);

var _comparisons = require('./comparisons');

var _comparisons2 = _interopRequireDefault(_comparisons);

var comparisons = new _comparisons2['default']();

var Officers = (function () {
  function Officers(HQ) {
    _classCallCheck(this, Officers);

    this.active = [];
    this.HQ = HQ;
  }

  _createClass(Officers, [{
    key: 'recruit',
    value: function recruit(rank, unitId) {
      var date = this.HQ.realDate;
      var unitName = this.HQ.unitName(unitId);

      var options = {
        date: date,
        unitId: unitId,
        unitName: unitName,
        rank: rank
      };

      var recruit = new _officer2['default'](options);

      this.active.push(recruit);

      return recruit;
    }
  }, {
    key: 'retire',
    value: function retire() {
      this.active = this.active.filter(function (officer) {
        return !officer.retired;
      });
    }
  }, {
    key: 'replace',
    value: function replace(commander) {
      var oldRank = undefined;

      switch (commander.rank.alias) {
        case 'lieutenant':
          return this.recruit('lieutenant', commander.unitId);
        case 'captain':
          oldRank = 'lieutenant';
          break;
        case 'major':
          oldRank = 'captain';
          break;
        case 'lcoronel':
          oldRank = 'major';
          break;
        case 'coronel':
          oldRank = 'lcoronel';
          break;
        case 'bgeneral':
          oldRank = 'coronel';
          break;
        case 'dgeneral':
          oldRank = 'bgeneral';
          break;
        case 'lgeneral':
          oldRank = 'dgeneral';
          break;
      }

      return this.candidate(commander.unitId, commander.rank.alias, oldRank);
    }
  }, {
    key: 'candidate',
    value: function candidate(unitId, newRank, oldRank) {
      var candidates = [];

      this.active.map(function (officer) {
        if (officer.rank.alias === oldRank) candidates.push(officer);
      });

      var candidate = candidates.sort(comparisons.byExperience)[0];

      this.HQ.deassign(candidate.unitId);

      candidate.unitId = unitId;
      candidate.rank = _config2['default'].ranks[newRank];

      var promotion = {
        rank: newRank,
        date: this.HQ.realDate,
        unit: this.HQ.unitName(candidate.unitId)
      };

      candidate.history.push(_config2['default'].promoted(promotion));

      return candidate;
    }
  }, {
    key: 'update',
    value: function update() {
      this.active.forEach(function (officer) {
        officer.update();
      });
    }
  }]);

  return Officers;
})();

exports['default'] = Officers;
module.exports = exports['default'];

},{"./comparisons":7,"./config":8,"./officer":14}],16:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

require('./chance');

var chance = new Chance();

var Region = function Region(id) {
  _classCallCheck(this, Region);

  this.id = id;
  this.name = chance.city();
  this.units = [];
};

exports['default'] = Region;
module.exports = exports['default'];

},{"./chance":6}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Traits = (function () {
  function Traits() {
    _classCallCheck(this, Traits);

    this.base = [{
      name: 'Diplomat',
      area: 'diplomacy',
      school: 'the National Officer Candidate School',
      administration: 1,
      intelligence: 3,
      commanding: 2,
      diplomacy: 4
    }, {
      name: 'Warrior',
      area: 'commanding',
      school: 'the National Military Academy',
      administration: 3,
      intelligence: 2,
      commanding: 4,
      diplomacy: 1
    }, {
      name: 'Spy',
      area: 'intelligence',
      school: 'the Institute of Military Intelligence',
      administration: 2,
      intelligence: 4,
      commanding: 1,
      diplomacy: 3
    }, {
      name: 'Administrator',
      area: 'administration',
      school: 'General Sutton University',
      administration: 4,
      intelligence: 1,
      commanding: 3,
      diplomacy: 2
    }];
  }

  _createClass(Traits, [{
    key: 'random',
    value: function random() {
      var rnd = Math.round(Math.random() * 3);
      return this.base[rnd];
    }
  }]);

  return Traits;
})();

exports['default'] = Traits;
module.exports = exports['default'];

},{}],18:[function(require,module,exports){
/* jshint ignore:start */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Ui = (function () {
  function Ui() {
    _classCallCheck(this, Ui);
  }

  _createClass(Ui, [{
    key: "render",
    value: function render(army) {
      React.render(React.createElement(Army, { officers: army.HQ.officers, army: army }), document.body);
    }
  }]);

  return Ui;
})();

var Army = (function (_React$Component) {
  function Army() {
    _classCallCheck(this, Army);

    if (_React$Component != null) {
      _React$Component.apply(this, arguments);
    }
  }

  _inherits(Army, _React$Component);

  _createClass(Army, [{
    key: "render",
    value: function render() {
      var army = this.props.army;
      var corps = [];

      army.units.corps.forEach(function (corp) {
        corps.push(React.createElement(
          "div",
          { key: corp.id },
          React.createElement(Unit, { unit: corp })
        ));
      });

      return React.createElement(
        "div",
        null,
        corps
      );
    }
  }]);

  return Army;
})(React.Component);

var Commander = (function (_React$Component2) {
  function Commander(props) {
    _classCallCheck(this, Commander);

    _get(Object.getPrototypeOf(Commander.prototype), "constructor", this).call(this, props);
    this.state = { hover: false };
  }

  _inherits(Commander, _React$Component2);

  _createClass(Commander, [{
    key: "mouseOver",
    value: function mouseOver() {
      this.setState({ hover: true });
    }
  }, {
    key: "mouseOut",
    value: function mouseOut() {
      this.setState({ hover: false });
    }
  }, {
    key: "render",
    value: function render() {
      var history = [];

      if (this.state.hover && this.props.officer.history) {
        this.props.officer.history.forEach(function (log) {
          history.push(React.createElement(
            "p",
            null,
            log
          ));
        });
      }

      return React.createElement(
        "div",
        { onMouseOver: this.mouseOver.bind(this), onMouseOut: this.mouseOut.bind(this) },
        React.createElement(
          "p",
          null,
          this.props.officer.name()
        ),
        React.createElement(
          "div",
          { className: "history" },
          history
        )
      );
    }
  }]);

  return Commander;
})(React.Component);

var Unit = (function (_React$Component3) {
  function Unit() {
    _classCallCheck(this, Unit);

    if (_React$Component3 != null) {
      _React$Component3.apply(this, arguments);
    }
  }

  _inherits(Unit, _React$Component3);

  _createClass(Unit, [{
    key: "render",
    value: function render() {
      var unit = this.props.unit;
      var subunits = [];

      if (unit.subunits) {
        unit.subunits.forEach(function (subunit) {
          subunits.push(React.createElement(
            "div",
            { key: subunit.id },
            React.createElement(Unit, { unit: subunit })
          ));
        });
      }

      return React.createElement(
        "div",
        { className: unit.type },
        React.createElement(Commander, { officer: unit.commander }),
        subunits
      );
    }
  }]);

  return Unit;
})(React.Component);

exports["default"] = Ui;
module.exports = exports["default"];

},{}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Unit = function Unit() {
  _classCallCheck(this, Unit);
};

exports['default'] = Unit;
module.exports = exports['default'];

},{}],20:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _region = require('./region');

var _region2 = _interopRequireDefault(_region);

var World = (function () {
  function World(HQ) {
    _classCallCheck(this, World);

    this.HQ = HQ;
    this.regions = [];
    this.generate();
    this.mapUnitsAndRegions();
  }

  _createClass(World, [{
    key: 'addRegion',
    value: function addRegion() {
      var regionId = this.regions.length;
      this.regions.push(new _region2['default'](regionId));
    }
  }, {
    key: 'mapUnitsAndRegions',
    value: function mapUnitsAndRegions() {
      var _this = this;

      var unitsPerRegion = Math.ceil(this.HQ.units.length / this.regions.length) + 1;
      var unitIndex = 0;

      this.regions.map(function (region) {
        var count = 0;
        while (count < unitsPerRegion) {
          var unit = _this.HQ.units[unitIndex];
          if (unit) {
            region.units.push(unit);
            unit.regionId = region.id;
            unitIndex++;
            count++;
          }
        }
      });
      var mcount = 0;
      this.HQ.units.map(function (unit) {
        if (unit.regionId < 0 || unit.regionId === undefined) {
          mcount++;
        }
      });
    }
  }, {
    key: 'generate',
    value: function generate() {
      var amount = _config2['default'].random(10) + 5;
      for (var i = 0; i < amount; i++) {
        this.addRegion();
      }
    }
  }]);

  return World;
})();

exports['default'] = World;
module.exports = exports['default'];

},{"./config":8,"./region":16}]},{},[11]);
