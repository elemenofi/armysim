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
(function (Buffer){
'use strict';(function(){var MAX_INT=9007199254740992;var MIN_INT=-MAX_INT;var NUMBERS='0123456789';var CHARS_LOWER='abcdefghijklmnopqrstuvwxyz';var CHARS_UPPER=CHARS_LOWER.toUpperCase();var HEX_POOL=NUMBERS + 'abcdef';var slice=Array.prototype.slice;function Chance(seed){if(!(this instanceof Chance)){return seed == null?new Chance():new Chance(seed);}if(typeof seed === 'function'){this.random = seed;return this;}var seedling;if(arguments.length){this.seed = 0;}for(var i=0; i < arguments.length; i++) {seedling = 0;if(typeof arguments[i] === 'string'){for(var j=0; j < arguments[i].length; j++) {seedling += (arguments[i].length - j) * arguments[i].charCodeAt(j);}}else {seedling = arguments[i];}this.seed += (arguments.length - i) * seedling;}this.mt = this.mersenne_twister(this.seed);this.random = function(){return this.mt.random(this.seed);};return this;}Chance.prototype.VERSION = '0.7.4';function initOptions(options, defaults){options || (options = {});if(defaults){for(var i in defaults) {if(typeof options[i] === 'undefined'){options[i] = defaults[i];}}}return options;}function testRange(test, errorMessage){if(test){throw new RangeError(errorMessage);}}var base64=function base64(){throw new Error('No Base64 encoder available.');};(function determineBase64Encoder(){if(typeof btoa === 'function'){base64 = btoa;}else if(typeof Buffer === 'function'){base64 = function(input){return new Buffer(input).toString('base64');};}})();Chance.prototype.bool = function(options){options = initOptions(options, {likelihood:50});testRange(options.likelihood < 0 || options.likelihood > 100, 'Chance: Likelihood accepts values from 0 to 100.');return this.random() * 100 < options.likelihood;};Chance.prototype.character = function(options){options = initOptions(options);testRange(options.alpha && options.symbols, 'Chance: Cannot specify both alpha and symbols.');var symbols='!@#$%^&*()[]', letters, pool;if(options.casing === 'lower'){letters = CHARS_LOWER;}else if(options.casing === 'upper'){letters = CHARS_UPPER;}else {letters = CHARS_LOWER + CHARS_UPPER;}if(options.pool){pool = options.pool;}else if(options.alpha){pool = letters;}else if(options.symbols){pool = symbols;}else {pool = letters + NUMBERS + symbols;}return pool.charAt(this.natural({max:pool.length - 1}));};Chance.prototype.floating = function(options){options = initOptions(options, {fixed:4});testRange(options.fixed && options.precision, 'Chance: Cannot specify both fixed and precision.');var num;var fixed=Math.pow(10, options.fixed);var max=MAX_INT / fixed;var min=-max;testRange(options.min && options.fixed && options.min < min, 'Chance: Min specified is out of range with fixed. Min should be, at least, ' + min);testRange(options.max && options.fixed && options.max > max, 'Chance: Max specified is out of range with fixed. Max should be, at most, ' + max);options = initOptions(options, {min:min, max:max});num = this.integer({min:options.min * fixed, max:options.max * fixed});var num_fixed=(num / fixed).toFixed(options.fixed);return parseFloat(num_fixed);};Chance.prototype.integer = function(options){options = initOptions(options, {min:MIN_INT, max:MAX_INT});testRange(options.min > options.max, 'Chance: Min cannot be greater than Max.');return Math.floor(this.random() * (options.max - options.min + 1) + options.min);};Chance.prototype.natural = function(options){options = initOptions(options, {min:0, max:MAX_INT});testRange(options.min < 0, 'Chance: Min cannot be less than zero.');return this.integer(options);};Chance.prototype.string = function(options){options = initOptions(options, {length:this.natural({min:5, max:20})});testRange(options.length < 0, 'Chance: Length cannot be less than zero.');var length=options.length, text=this.n(this.character, length, options);return text.join('');};Chance.prototype.capitalize = function(word){return word.charAt(0).toUpperCase() + word.substr(1);};Chance.prototype.mixin = function(obj){for(var func_name in obj) {Chance.prototype[func_name] = obj[func_name];}return this;};Chance.prototype.unique = function(fn, num, options){testRange(typeof fn !== 'function', 'Chance: The first argument must be a function.');options = initOptions(options, {comparator:function comparator(arr, val){return arr.indexOf(val) !== -1;}});var arr=[], count=0, result, MAX_DUPLICATES=num * 50, params=slice.call(arguments, 2);while(arr.length < num) {result = fn.apply(this, params);if(!options.comparator(arr, result)){arr.push(result);count = 0;}if(++count > MAX_DUPLICATES){throw new RangeError('Chance: num is likely too large for sample set');}}return arr;};Chance.prototype.n = function(fn, n){testRange(typeof fn !== 'function', 'Chance: The first argument must be a function.');if(typeof n === 'undefined'){n = 1;}var i=n, arr=[], params=slice.call(arguments, 2);i = Math.max(0, i);for(null; i--; null) {arr.push(fn.apply(this, params));}return arr;};Chance.prototype.pad = function(number, width, pad){pad = pad || '0';number = number + '';return number.length >= width?number:new Array(width - number.length + 1).join(pad) + number;};Chance.prototype.pick = function(arr, count){if(arr.length === 0){throw new RangeError('Chance: Cannot pick() from an empty array');}if(!count || count === 1){return arr[this.natural({max:arr.length - 1})];}else {return this.shuffle(arr).slice(0, count);}};Chance.prototype.shuffle = function(arr){var old_array=arr.slice(0), new_array=[], j=0, length=Number(old_array.length);for(var i=0; i < length; i++) {j = this.natural({max:old_array.length - 1});new_array[i] = old_array[j];old_array.splice(j, 1);}return new_array;};Chance.prototype.weighted = function(arr, weights){if(arr.length !== weights.length){throw new RangeError('Chance: length of array and weights must match');}for(var weightIndex=weights.length - 1; weightIndex >= 0; --weightIndex) {if(weights[weightIndex] <= 0){arr.splice(weightIndex, 1);weights.splice(weightIndex, 1);}}if(weights.some(function(weight){return weight < 1;})){var min=weights.reduce(function(min, weight){return weight < min?weight:min;}, weights[0]);var scaling_factor=1 / min;weights = weights.map(function(weight){return weight * scaling_factor;});}var sum=weights.reduce(function(total, weight){return total + weight;}, 0);var selected=this.natural({min:1, max:sum});var total=0;var chosen;weights.some(function(weight, index){if(selected <= total + weight){chosen = arr[index];return true;}total += weight;return false;});return chosen;};Chance.prototype.paragraph = function(options){options = initOptions(options);var sentences=options.sentences || this.natural({min:3, max:7}), sentence_array=this.n(this.sentence, sentences);return sentence_array.join(' ');};Chance.prototype.sentence = function(options){options = initOptions(options);var words=options.words || this.natural({min:12, max:18}), text, word_array=this.n(this.word, words);text = word_array.join(' ');text = this.capitalize(text) + '.';return text;};Chance.prototype.syllable = function(options){options = initOptions(options);var length=options.length || this.natural({min:2, max:3}), consonants='bcdfghjklmnprstvwz', vowels='aeiou', all=consonants + vowels, text='', chr;for(var i=0; i < length; i++) {if(i === 0){chr = this.character({pool:all});}else if(consonants.indexOf(chr) === -1){chr = this.character({pool:consonants});}else {chr = this.character({pool:vowels});}text += chr;}return text;};Chance.prototype.word = function(options){options = initOptions(options);testRange(options.syllables && options.length, 'Chance: Cannot specify both syllables AND length.');var syllables=options.syllables || this.natural({min:1, max:3}), text='';if(options.length){do {text += this.syllable();}while(text.length < options.length);text = text.substring(0, options.length);}else {for(var i=0; i < syllables; i++) {text += this.syllable();}}return text;};Chance.prototype.age = function(options){options = initOptions(options);var ageRange;switch(options.type){case 'child':ageRange = {min:1, max:12};break;case 'teen':ageRange = {min:13, max:19};break;case 'adult':ageRange = {min:18, max:65};break;case 'senior':ageRange = {min:65, max:100};break;case 'all':ageRange = {min:1, max:100};break;default:ageRange = {min:18, max:65};break;}return this.natural(ageRange);};Chance.prototype.birthday = function(options){options = initOptions(options, {year:new Date().getFullYear() - this.age(options)});return this.date(options);};Chance.prototype.cpf = function(){var n=this.n(this.natural, 9, {max:9});var d1=n[8] * 2 + n[7] * 3 + n[6] * 4 + n[5] * 5 + n[4] * 6 + n[3] * 7 + n[2] * 8 + n[1] * 9 + n[0] * 10;d1 = 11 - d1 % 11;if(d1 >= 10){d1 = 0;}var d2=d1 * 2 + n[8] * 3 + n[7] * 4 + n[6] * 5 + n[5] * 6 + n[4] * 7 + n[3] * 8 + n[2] * 9 + n[1] * 10 + n[0] * 11;d2 = 11 - d2 % 11;if(d2 >= 10){d2 = 0;}return '' + n[0] + n[1] + n[2] + '.' + n[3] + n[4] + n[5] + '.' + n[6] + n[7] + n[8] + '-' + d1 + d2;};Chance.prototype.first = function(options){options = initOptions(options, {gender:this.gender()});return this.pick(this.get('firstNames')[options.gender.toLowerCase()]);};Chance.prototype.gender = function(){return this.pick(['Male', 'Female']);};Chance.prototype.last = function(){return this.pick(this.get('lastNames'));};Chance.prototype.mrz = function(options){var checkDigit=function checkDigit(input){var alpha='<ABCDEFGHIJKLMNOPQRSTUVWXYXZ'.split(''), multipliers=[7, 3, 1], runningTotal=0;if(typeof input !== 'string'){input = input.toString();}input.split('').forEach(function(character, idx){var pos=alpha.indexOf(character);if(pos !== -1){character = pos === 0?0:pos + 9;}else {character = parseInt(character, 10);}character *= multipliers[idx % multipliers.length];runningTotal += character;});return runningTotal % 10;};var generate=function generate(opts){var pad=function pad(length){return new Array(length + 1).join('<');};var number=['P<', opts.issuer, opts.last.toUpperCase(), '<<', opts.first.toUpperCase(), pad(39 - (opts.last.length + opts.first.length + 2)), opts.passportNumber, checkDigit(opts.passportNumber), opts.nationality, opts.dob, checkDigit(opts.dob), opts.gender, opts.expiry, checkDigit(opts.expiry), pad(14), checkDigit(pad(14))].join('');return number + checkDigit(number.substr(44, 10) + number.substr(57, 7) + number.substr(65, 7));};var that=this;options = initOptions(options, {first:this.first(), last:this.last(), passportNumber:this.integer({min:100000000, max:999999999}), dob:(function(){var date=that.birthday({type:'adult'});return [date.getFullYear().toString().substr(2), that.pad(date.getMonth() + 1, 2), that.pad(date.getDate(), 2)].join('');})(), expiry:(function(){var date=new Date();return [(date.getFullYear() + 5).toString().substr(2), that.pad(date.getMonth() + 1, 2), that.pad(date.getDate(), 2)].join('');})(), gender:this.gender() === 'Female'?'F':'M', issuer:'GBR', nationality:'GBR'});return generate(options);};Chance.prototype.name = function(options){options = initOptions(options);var first=this.first(options), last=this.last(), name;if(options.middle){name = first + ' ' + this.first(options) + ' ' + last;}else if(options.middle_initial){name = first + ' ' + this.character({alpha:true, casing:'upper'}) + '. ' + last;}else {name = first + ' ' + last;}if(options.prefix){name = this.prefix(options) + ' ' + name;}if(options.suffix){name = name + ' ' + this.suffix(options);}return name;};Chance.prototype.name_prefixes = function(gender){gender = gender || 'all';gender = gender.toLowerCase();var prefixes=[{name:'Doctor', abbreviation:'Dr.'}];if(gender === 'male' || gender === 'all'){prefixes.push({name:'Mister', abbreviation:'Mr.'});}if(gender === 'female' || gender === 'all'){prefixes.push({name:'Miss', abbreviation:'Miss'});prefixes.push({name:'Misses', abbreviation:'Mrs.'});}return prefixes;};Chance.prototype.prefix = function(options){return this.name_prefix(options);};Chance.prototype.name_prefix = function(options){options = initOptions(options, {gender:'all'});return options.full?this.pick(this.name_prefixes(options.gender)).name:this.pick(this.name_prefixes(options.gender)).abbreviation;};Chance.prototype.ssn = function(options){options = initOptions(options, {ssnFour:false, dashes:true});var ssn_pool='1234567890', ssn, dash=options.dashes?'-':'';if(!options.ssnFour){ssn = this.string({pool:ssn_pool, length:3}) + dash + this.string({pool:ssn_pool, length:2}) + dash + this.string({pool:ssn_pool, length:4});}else {ssn = this.string({pool:ssn_pool, length:4});}return ssn;};Chance.prototype.name_suffixes = function(){var suffixes=[{name:'Doctor of Osteopathic Medicine', abbreviation:'D.O.'}, {name:'Doctor of Philosophy', abbreviation:'Ph.D.'}, {name:'Esquire', abbreviation:'Esq.'}, {name:'Junior', abbreviation:'Jr.'}, {name:'Juris Doctor', abbreviation:'J.D.'}, {name:'Master of Arts', abbreviation:'M.A.'}, {name:'Master of Business Administration', abbreviation:'M.B.A.'}, {name:'Master of Science', abbreviation:'M.S.'}, {name:'Medical Doctor', abbreviation:'M.D.'}, {name:'Senior', abbreviation:'Sr.'}, {name:'The Third', abbreviation:'III'}, {name:'The Fourth', abbreviation:'IV'}];return suffixes;};Chance.prototype.suffix = function(options){return this.name_suffix(options);};Chance.prototype.name_suffix = function(options){options = initOptions(options);return options.full?this.pick(this.name_suffixes()).name:this.pick(this.name_suffixes()).abbreviation;};Chance.prototype.android_id = function(){return 'APA91' + this.string({pool:'0123456789abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_', length:178});};Chance.prototype.apple_token = function(){return this.string({pool:'abcdef1234567890', length:64});};Chance.prototype.wp8_anid2 = function(){return base64(this.hash({length:32}));};Chance.prototype.wp7_anid = function(){return 'A=' + this.guid().replace(/-/g, '').toUpperCase() + '&E=' + this.hash({length:3}) + '&W=' + this.integer({min:0, max:9});};Chance.prototype.bb_pin = function(){return this.hash({length:8});};Chance.prototype.color = function(options){function gray(value, delimiter){return [value, value, value].join(delimiter || '');}options = initOptions(options, {format:this.pick(['hex', 'shorthex', 'rgb', 'rgba', '0x']), grayscale:false, casing:'lower'});var isGrayscale=options.grayscale;var colorValue;if(options.format === 'hex'){colorValue = '#' + (isGrayscale?gray(this.hash({length:2})):this.hash({length:6}));}else if(options.format === 'shorthex'){colorValue = '#' + (isGrayscale?gray(this.hash({length:1})):this.hash({length:3}));}else if(options.format === 'rgb'){if(isGrayscale){colorValue = 'rgb(' + gray(this.natural({max:255}), ',') + ')';}else {colorValue = 'rgb(' + this.natural({max:255}) + ',' + this.natural({max:255}) + ',' + this.natural({max:255}) + ')';}}else if(options.format === 'rgba'){if(isGrayscale){colorValue = 'rgba(' + gray(this.natural({max:255}), ',') + ',' + this.floating({min:0, max:1}) + ')';}else {colorValue = 'rgba(' + this.natural({max:255}) + ',' + this.natural({max:255}) + ',' + this.natural({max:255}) + ',' + this.floating({min:0, max:1}) + ')';}}else if(options.format === '0x'){colorValue = '0x' + (isGrayscale?gray(this.hash({length:2})):this.hash({length:6}));}else {throw new RangeError('Invalid format provided. Please provide one of "hex", "shorthex", "rgb", "rgba", or "0x".');}if(options.casing === 'upper'){colorValue = colorValue.toUpperCase();}return colorValue;};Chance.prototype.domain = function(options){options = initOptions(options);return this.word() + '.' + (options.tld || this.tld());};Chance.prototype.email = function(options){options = initOptions(options);return this.word({length:options.length}) + '@' + (options.domain || this.domain());};Chance.prototype.fbid = function(){return parseInt('10000' + this.natural({max:100000000000}), 10);};Chance.prototype.google_analytics = function(){var account=this.pad(this.natural({max:999999}), 6);var property=this.pad(this.natural({max:99}), 2);return 'UA-' + account + '-' + property;};Chance.prototype.hashtag = function(){return '#' + this.word();};Chance.prototype.ip = function(){return this.natural({max:255}) + '.' + this.natural({max:255}) + '.' + this.natural({max:255}) + '.' + this.natural({max:255});};Chance.prototype.ipv6 = function(){var ip_addr=this.n(this.hash, 8, {length:4});return ip_addr.join(':');};Chance.prototype.klout = function(){return this.natural({min:1, max:99});};Chance.prototype.tlds = function(){return ['com', 'org', 'edu', 'gov', 'co.uk', 'net', 'io'];};Chance.prototype.tld = function(){return this.pick(this.tlds());};Chance.prototype.twitter = function(){return '@' + this.word();};Chance.prototype.url = function(options){options = initOptions(options, {protocol:'http', domain:this.domain(options), domain_prefix:'', path:this.word(), extensions:[]});var extension=options.extensions.length > 0?'.' + this.pick(options.extensions):'';var domain=options.domain_prefix?options.domain_prefix + '.' + options.domain:options.domain;return options.protocol + '://' + domain + '/' + options.path + extension;};Chance.prototype.address = function(options){options = initOptions(options);return this.natural({min:5, max:2000}) + ' ' + this.street(options);};Chance.prototype.altitude = function(options){options = initOptions(options, {fixed:5, min:0, max:8848});return this.floating({min:options.min, max:options.max, fixed:options.fixed});};Chance.prototype.areacode = function(options){options = initOptions(options, {parens:true});var areacode=this.natural({min:2, max:9}).toString() + this.natural({min:0, max:8}).toString() + this.natural({min:0, max:9}).toString();return options.parens?'(' + areacode + ')':areacode;};Chance.prototype.city = function(){return this.capitalize(this.word({syllables:3}));};Chance.prototype.coordinates = function(options){return this.latitude(options) + ', ' + this.longitude(options);};Chance.prototype.countries = function(){return this.get('countries');};Chance.prototype.country = function(options){options = initOptions(options);var country=this.pick(this.countries());return options.full?country.name:country.abbreviation;};Chance.prototype.depth = function(options){options = initOptions(options, {fixed:5, min:-2550, max:0});return this.floating({min:options.min, max:options.max, fixed:options.fixed});};Chance.prototype.geohash = function(options){options = initOptions(options, {length:7});return this.string({length:options.length, pool:'0123456789bcdefghjkmnpqrstuvwxyz'});};Chance.prototype.geojson = function(options){return this.latitude(options) + ', ' + this.longitude(options) + ', ' + this.altitude(options);};Chance.prototype.latitude = function(options){options = initOptions(options, {fixed:5, min:-90, max:90});return this.floating({min:options.min, max:options.max, fixed:options.fixed});};Chance.prototype.longitude = function(options){options = initOptions(options, {fixed:5, min:-180, max:180});return this.floating({min:options.min, max:options.max, fixed:options.fixed});};Chance.prototype.phone = function(options){var self=this, numPick, ukNum=function ukNum(parts){var section=[];parts.sections.forEach(function(n){section.push(self.string({pool:'0123456789', length:n}));});return parts.area + section.join(' ');};options = initOptions(options, {formatted:true, country:'us', mobile:false});if(!options.formatted){options.parens = false;}var phone;switch(options.country){case 'fr':if(!options.mobile){numPick = this.pick(['01' + this.pick(['30', '34', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '53', '55', '56', '58', '60', '64', '69', '70', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83']) + self.string({pool:'0123456789', length:6}), '02' + this.pick(['14', '18', '22', '23', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '40', '41', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '56', '57', '61', '62', '69', '72', '76', '77', '78', '85', '90', '96', '97', '98', '99']) + self.string({pool:'0123456789', length:6}), '03' + this.pick(['10', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '39', '44', '45', '51', '52', '54', '55', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90']) + self.string({pool:'0123456789', length:6}), '04' + this.pick(['11', '13', '15', '20', '22', '26', '27', '30', '32', '34', '37', '42', '43', '44', '50', '56', '57', '63', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '88', '89', '90', '91', '92', '93', '94', '95', '97', '98']) + self.string({pool:'0123456789', length:6}), '05' + this.pick(['08', '16', '17', '19', '24', '31', '32', '33', '34', '35', '40', '45', '46', '47', '49', '53', '55', '56', '57', '58', '59', '61', '62', '63', '64', '65', '67', '79', '81', '82', '86', '87', '90', '94']) + self.string({pool:'0123456789', length:6}), '09' + self.string({pool:'0123456789', length:8})]);phone = options.formatted?numPick.match(/../g).join(' '):numPick;}else {numPick = this.pick(['06', '07']) + self.string({pool:'0123456789', length:8});phone = options.formatted?numPick.match(/../g).join(' '):numPick;}break;case 'uk':if(!options.mobile){numPick = this.pick([{area:'01' + this.character({pool:'234569'}) + '1 ', sections:[3, 4]}, {area:'020 ' + this.character({pool:'378'}), sections:[3, 4]}, {area:'023 ' + this.character({pool:'89'}), sections:[3, 4]}, {area:'024 7', sections:[3, 4]}, {area:'028 ' + this.pick(['25', '28', '37', '71', '82', '90', '92', '95']), sections:[2, 4]}, {area:'012' + this.pick(['04', '08', '54', '76', '97', '98']) + ' ', sections:[5]}, {area:'013' + this.pick(['63', '64', '84', '86']) + ' ', sections:[5]}, {area:'014' + this.pick(['04', '20', '60', '61', '80', '88']) + ' ', sections:[5]}, {area:'015' + this.pick(['24', '27', '62', '66']) + ' ', sections:[5]}, {area:'016' + this.pick(['06', '29', '35', '47', '59', '95']) + ' ', sections:[5]}, {area:'017' + this.pick(['26', '44', '50', '68']) + ' ', sections:[5]}, {area:'018' + this.pick(['27', '37', '84', '97']) + ' ', sections:[5]}, {area:'019' + this.pick(['00', '05', '35', '46', '49', '63', '95']) + ' ', sections:[5]}]);phone = options.formatted?ukNum(numPick):ukNum(numPick).replace(' ', '', 'g');}else {numPick = this.pick([{area:'07' + this.pick(['4', '5', '7', '8', '9']), sections:[2, 6]}, {area:'07624 ', sections:[6]}]);phone = options.formatted?ukNum(numPick):ukNum(numPick).replace(' ', '');}break;case 'us':var areacode=this.areacode(options).toString();var exchange=this.natural({min:2, max:9}).toString() + this.natural({min:0, max:9}).toString() + this.natural({min:0, max:9}).toString();var subscriber=this.natural({min:1000, max:9999}).toString();phone = options.formatted?areacode + ' ' + exchange + '-' + subscriber:areacode + exchange + subscriber;}return phone;};Chance.prototype.postal = function(){var pd=this.character({pool:'XVTSRPNKLMHJGECBA'});var fsa=pd + this.natural({max:9}) + this.character({alpha:true, casing:'upper'});var ldu=this.natural({max:9}) + this.character({alpha:true, casing:'upper'}) + this.natural({max:9});return fsa + ' ' + ldu;};Chance.prototype.provinces = function(){return this.get('provinces');};Chance.prototype.province = function(options){return options && options.full?this.pick(this.provinces()).name:this.pick(this.provinces()).abbreviation;};Chance.prototype.state = function(options){return options && options.full?this.pick(this.states(options)).name:this.pick(this.states(options)).abbreviation;};Chance.prototype.states = function(options){options = initOptions(options);var states, us_states_and_dc=this.get('us_states_and_dc'), territories=this.get('territories'), armed_forces=this.get('armed_forces');states = us_states_and_dc;if(options.territories){states = states.concat(territories);}if(options.armed_forces){states = states.concat(armed_forces);}return states;};Chance.prototype.street = function(options){options = initOptions(options);var street=this.word({syllables:2});street = this.capitalize(street);street += ' ';street += options.short_suffix?this.street_suffix().abbreviation:this.street_suffix().name;return street;};Chance.prototype.street_suffix = function(){return this.pick(this.street_suffixes());};Chance.prototype.street_suffixes = function(){return this.get('street_suffixes');};Chance.prototype.zip = function(options){var zip=this.n(this.natural, 5, {max:9});if(options && options.plusfour === true){zip.push('-');zip = zip.concat(this.n(this.natural, 4, {max:9}));}return zip.join('');};Chance.prototype.ampm = function(){return this.bool()?'am':'pm';};Chance.prototype.date = function(options){var date_string, date;if(options && (options.min || options.max)){options = initOptions(options, {american:true, string:false});var min=typeof options.min !== 'undefined'?options.min.getTime():1;var max=typeof options.max !== 'undefined'?options.max.getTime():8640000000000000;date = new Date(this.natural({min:min, max:max}));}else {var m=this.month({raw:true});var daysInMonth=m.days;if(options && options.month){daysInMonth = this.get('months')[(options.month % 12 + 12) % 12].days;}options = initOptions(options, {year:parseInt(this.year(), 10), month:m.numeric - 1, day:this.natural({min:1, max:daysInMonth}), hour:this.hour(), minute:this.minute(), second:this.second(), millisecond:this.millisecond(), american:true, string:false});date = new Date(options.year, options.month, options.day, options.hour, options.minute, options.second, options.millisecond);}if(options.american){date_string = date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear();}else {date_string = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();}return options.string?date_string:date;};Chance.prototype.hammertime = function(options){return this.date(options).getTime();};Chance.prototype.hour = function(options){options = initOptions(options, {min:1, max:options && options.twentyfour?24:12});testRange(options.min < 1, 'Chance: Min cannot be less than 1.');testRange(options.twentyfour && options.max > 24, 'Chance: Max cannot be greater than 24 for twentyfour option.');testRange(!options.twentyfour && options.max > 12, 'Chance: Max cannot be greater than 12.');testRange(options.min > options.max, 'Chance: Min cannot be greater than Max.');return this.natural({min:options.min, max:options.max});};Chance.prototype.millisecond = function(){return this.natural({max:999});};Chance.prototype.minute = Chance.prototype.second = function(options){options = initOptions(options, {min:0, max:59});testRange(options.min < 0, 'Chance: Min cannot be less than 0.');testRange(options.max > 59, 'Chance: Max cannot be greater than 59.');testRange(options.min > options.max, 'Chance: Min cannot be greater than Max.');return this.natural({min:options.min, max:options.max});};Chance.prototype.month = function(options){options = initOptions(options, {min:1, max:12});testRange(options.min < 1, 'Chance: Min cannot be less than 1.');testRange(options.max > 12, 'Chance: Max cannot be greater than 12.');testRange(options.min > options.max, 'Chance: Min cannot be greater than Max.');var month=this.pick(this.months().slice(options.min - 1, options.max));return options.raw?month:month.name;};Chance.prototype.months = function(){return this.get('months');};Chance.prototype.second = function(){return this.natural({max:59});};Chance.prototype.timestamp = function(){return this.natural({min:1, max:parseInt(new Date().getTime() / 1000, 10)});};Chance.prototype.year = function(options){options = initOptions(options, {min:new Date().getFullYear()});options.max = typeof options.max !== 'undefined'?options.max:options.min + 100;return this.natural(options).toString();};Chance.prototype.cc = function(options){options = initOptions(options);var type, number, to_generate;type = options.type?this.cc_type({name:options.type, raw:true}):this.cc_type({raw:true});number = type.prefix.split('');to_generate = type.length - type.prefix.length - 1;number = number.concat(this.n(this.integer, to_generate, {min:0, max:9}));number.push(this.luhn_calculate(number.join('')));return number.join('');};Chance.prototype.cc_types = function(){return this.get('cc_types');};Chance.prototype.cc_type = function(options){options = initOptions(options);var types=this.cc_types(), type=null;if(options.name){for(var i=0; i < types.length; i++) {if(types[i].name === options.name || types[i].short_name === options.name){type = types[i];break;}}if(type === null){throw new RangeError('Credit card type \'' + options.name + '\'\' is not supported');}}else {type = this.pick(types);}return options.raw?type:type.name;};Chance.prototype.currency_types = function(){return this.get('currency_types');};Chance.prototype.currency = function(){return this.pick(this.currency_types());};Chance.prototype.currency_pair = function(returnAsString){var currencies=this.unique(this.currency, 2, {comparator:function comparator(arr, val){return arr.reduce(function(acc, item){return acc || item.code === val.code;}, false);}});if(returnAsString){return currencies[0].code + '/' + currencies[1].code;}else {return currencies;}};Chance.prototype.dollar = function(options){options = initOptions(options, {max:10000, min:0});var dollar=this.floating({min:options.min, max:options.max, fixed:2}).toString(), cents=dollar.split('.')[1];if(cents === undefined){dollar += '.00';}else if(cents.length < 2){dollar = dollar + '0';}if(dollar < 0){return '-$' + dollar.replace('-', '');}else {return '$' + dollar;}};Chance.prototype.exp = function(options){options = initOptions(options);var exp={};exp.year = this.exp_year();if(exp.year === new Date().getFullYear()){exp.month = this.exp_month({future:true});}else {exp.month = this.exp_month();}return options.raw?exp:exp.month + '/' + exp.year;};Chance.prototype.exp_month = function(options){options = initOptions(options);var month, month_int, curMonth=new Date().getMonth();if(options.future){do {month = this.month({raw:true}).numeric;month_int = parseInt(month, 10);}while(month_int < curMonth);}else {month = this.month({raw:true}).numeric;}return month;};Chance.prototype.exp_year = function(){return this.year({max:new Date().getFullYear() + 10});};function diceFn(range){return function(){return this.natural(range);};}Chance.prototype.d4 = diceFn({min:1, max:4});Chance.prototype.d6 = diceFn({min:1, max:6});Chance.prototype.d8 = diceFn({min:1, max:8});Chance.prototype.d10 = diceFn({min:1, max:10});Chance.prototype.d12 = diceFn({min:1, max:12});Chance.prototype.d20 = diceFn({min:1, max:20});Chance.prototype.d30 = diceFn({min:1, max:30});Chance.prototype.d100 = diceFn({min:1, max:100});Chance.prototype.rpg = function(thrown, options){options = initOptions(options);if(!thrown){throw new RangeError('A type of die roll must be included');}else {var bits=thrown.toLowerCase().split('d'), rolls=[];if(bits.length !== 2 || !parseInt(bits[0], 10) || !parseInt(bits[1], 10)){throw new Error('Invalid format provided. Please provide #d# where the first # is the number of dice to roll, the second # is the max of each die');}for(var i=bits[0]; i > 0; i--) {rolls[i - 1] = this.natural({min:1, max:bits[1]});}return typeof options.sum !== 'undefined' && options.sum?rolls.reduce(function(p, c){return p + c;}):rolls;}};Chance.prototype.guid = function(options){options = initOptions(options, {version:5});var guid_pool='abcdef1234567890', variant_pool='ab89', guid=this.string({pool:guid_pool, length:8}) + '-' + this.string({pool:guid_pool, length:4}) + '-' + options.version + this.string({pool:guid_pool, length:3}) + '-' + this.string({pool:variant_pool, length:1}) + this.string({pool:guid_pool, length:3}) + '-' + this.string({pool:guid_pool, length:12});return guid;};Chance.prototype.hash = function(options){options = initOptions(options, {length:40, casing:'lower'});var pool=options.casing === 'upper'?HEX_POOL.toUpperCase():HEX_POOL;return this.string({pool:pool, length:options.length});};Chance.prototype.luhn_check = function(num){var str=num.toString();var checkDigit=+str.substring(str.length - 1);return checkDigit === this.luhn_calculate(+str.substring(0, str.length - 1));};Chance.prototype.luhn_calculate = function(num){var digits=num.toString().split('').reverse();var sum=0;var digit;for(var i=0, l=digits.length; l > i; ++i) {digit = +digits[i];if(i % 2 === 0){digit *= 2;if(digit > 9){digit -= 9;}}sum += digit;}return sum * 9 % 10;};var data={firstNames:{'male':['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Charles', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'George', 'Donald', 'Anthony', 'Paul', 'Mark', 'Edward', 'Steven', 'Kenneth', 'Andrew', 'Brian', 'Joshua', 'Kevin', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Frank', 'Gary', 'Ryan', 'Nicholas', 'Eric', 'Stephen', 'Jacob', 'Larry', 'Jonathan', 'Scott', 'Raymond', 'Justin', 'Brandon', 'Gregory', 'Samuel', 'Benjamin', 'Patrick', 'Jack', 'Henry', 'Walter', 'Dennis', 'Jerry', 'Alexander', 'Peter', 'Tyler', 'Douglas', 'Harold', 'Aaron', 'Jose', 'Adam', 'Arthur', 'Zachary', 'Carl', 'Nathan', 'Albert', 'Kyle', 'Lawrence', 'Joe', 'Willie', 'Gerald', 'Roger', 'Keith', 'Jeremy', 'Terry', 'Harry', 'Ralph', 'Sean', 'Jesse', 'Roy', 'Louis', 'Billy', 'Austin', 'Bruce', 'Eugene', 'Christian', 'Bryan', 'Wayne', 'Russell', 'Howard', 'Fred', 'Ethan', 'Jordan', 'Philip', 'Alan', 'Juan', 'Randy', 'Vincent', 'Bobby', 'Dylan', 'Johnny', 'Phillip', 'Victor', 'Clarence', 'Ernest', 'Martin', 'Craig', 'Stanley', 'Shawn', 'Travis', 'Bradley', 'Leonard', 'Earl', 'Gabriel', 'Jimmy', 'Francis', 'Todd', 'Noah', 'Danny', 'Dale', 'Cody', 'Carlos', 'Allen', 'Frederick', 'Logan', 'Curtis', 'Alex', 'Joel', 'Luis', 'Norman', 'Marvin', 'Glenn', 'Tony', 'Nathaniel', 'Rodney', 'Melvin', 'Alfred', 'Steve', 'Cameron', 'Chad', 'Edwin', 'Caleb', 'Evan', 'Antonio', 'Lee', 'Herbert', 'Jeffery', 'Isaac', 'Derek', 'Ricky', 'Marcus', 'Theodore', 'Elijah', 'Luke', 'Jesus', 'Eddie', 'Troy', 'Mike', 'Dustin', 'Ray', 'Adrian', 'Bernard', 'Leroy', 'Angel', 'Randall', 'Wesley', 'Ian', 'Jared', 'Mason', 'Hunter', 'Calvin', 'Oscar', 'Clifford', 'Jay', 'Shane', 'Ronnie', 'Barry', 'Lucas', 'Corey', 'Manuel', 'Leo', 'Tommy', 'Warren', 'Jackson', 'Isaiah', 'Connor', 'Don', 'Dean', 'Jon', 'Julian', 'Miguel', 'Bill', 'Lloyd', 'Charlie', 'Mitchell', 'Leon', 'Jerome', 'Darrell', 'Jeremiah', 'Alvin', 'Brett', 'Seth', 'Floyd', 'Jim', 'Blake', 'Micheal', 'Gordon', 'Trevor', 'Lewis', 'Erik', 'Edgar', 'Vernon', 'Devin', 'Gavin', 'Jayden', 'Chris', 'Clyde', 'Tom', 'Derrick', 'Mario', 'Brent', 'Marc', 'Herman', 'Chase', 'Dominic', 'Ricardo', 'Franklin', 'Maurice', 'Max', 'Aiden', 'Owen', 'Lester', 'Gilbert', 'Elmer', 'Gene', 'Francisco', 'Glen', 'Cory', 'Garrett', 'Clayton', 'Sam', 'Jorge', 'Chester', 'Alejandro', 'Jeff', 'Harvey', 'Milton', 'Cole', 'Ivan', 'Andre', 'Duane', 'Landon'], 'female':['Mary', 'Emma', 'Elizabeth', 'Minnie', 'Margaret', 'Ida', 'Alice', 'Bertha', 'Sarah', 'Annie', 'Clara', 'Ella', 'Florence', 'Cora', 'Martha', 'Laura', 'Nellie', 'Grace', 'Carrie', 'Maude', 'Mabel', 'Bessie', 'Jennie', 'Gertrude', 'Julia', 'Hattie', 'Edith', 'Mattie', 'Rose', 'Catherine', 'Lillian', 'Ada', 'Lillie', 'Helen', 'Jessie', 'Louise', 'Ethel', 'Lula', 'Myrtle', 'Eva', 'Frances', 'Lena', 'Lucy', 'Edna', 'Maggie', 'Pearl', 'Daisy', 'Fannie', 'Josephine', 'Dora', 'Rosa', 'Katherine', 'Agnes', 'Marie', 'Nora', 'May', 'Mamie', 'Blanche', 'Stella', 'Ellen', 'Nancy', 'Effie', 'Sallie', 'Nettie', 'Della', 'Lizzie', 'Flora', 'Susie', 'Maud', 'Mae', 'Etta', 'Harriet', 'Sadie', 'Caroline', 'Katie', 'Lydia', 'Elsie', 'Kate', 'Susan', 'Mollie', 'Alma', 'Addie', 'Georgia', 'Eliza', 'Lulu', 'Nannie', 'Lottie', 'Amanda', 'Belle', 'Charlotte', 'Rebecca', 'Ruth', 'Viola', 'Olive', 'Amelia', 'Hannah', 'Jane', 'Virginia', 'Emily', 'Matilda', 'Irene', 'Kathryn', 'Esther', 'Willie', 'Henrietta', 'Ollie', 'Amy', 'Rachel', 'Sara', 'Estella', 'Theresa', 'Augusta', 'Ora', 'Pauline', 'Josie', 'Lola', 'Sophia', 'Leona', 'Anne', 'Mildred', 'Ann', 'Beulah', 'Callie', 'Lou', 'Delia', 'Eleanor', 'Barbara', 'Iva', 'Louisa', 'Maria', 'Mayme', 'Evelyn', 'Estelle', 'Nina', 'Betty', 'Marion', 'Bettie', 'Dorothy', 'Luella', 'Inez', 'Lela', 'Rosie', 'Allie', 'Millie', 'Janie', 'Cornelia', 'Victoria', 'Ruby', 'Winifred', 'Alta', 'Celia', 'Christine', 'Beatrice', 'Birdie', 'Harriett', 'Mable', 'Myra', 'Sophie', 'Tillie', 'Isabel', 'Sylvia', 'Carolyn', 'Isabelle', 'Leila', 'Sally', 'Ina', 'Essie', 'Bertie', 'Nell', 'Alberta', 'Katharine', 'Lora', 'Rena', 'Mina', 'Rhoda', 'Mathilda', 'Abbie', 'Eula', 'Dollie', 'Hettie', 'Eunice', 'Fanny', 'Ola', 'Lenora', 'Adelaide', 'Christina', 'Lelia', 'Nelle', 'Sue', 'Johanna', 'Lilly', 'Lucinda', 'Minerva', 'Lettie', 'Roxie', 'Cynthia', 'Helena', 'Hilda', 'Hulda', 'Bernice', 'Genevieve', 'Jean', 'Cordelia', 'Marian', 'Francis', 'Jeanette', 'Adeline', 'Gussie', 'Leah', 'Lois', 'Lura', 'Mittie', 'Hallie', 'Isabella', 'Olga', 'Phoebe', 'Teresa', 'Hester', 'Lida', 'Lina', 'Winnie', 'Claudia', 'Marguerite', 'Vera', 'Cecelia', 'Bess', 'Emilie', 'John', 'Rosetta', 'Verna', 'Myrtie', 'Cecilia', 'Elva', 'Olivia', 'Ophelia', 'Georgie', 'Elnora', 'Violet', 'Adele', 'Lily', 'Linnie', 'Loretta', 'Madge', 'Polly', 'Virgie', 'Eugenia', 'Lucile', 'Lucille', 'Mabelle', 'Rosalie']}, lastNames:['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward', 'Torres', 'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly', 'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins', 'Perry', 'Powell', 'Long', 'Patterson', 'Hughes', 'Flores', 'Washington', 'Butler', 'Simmons', 'Foster', 'Gonzales', 'Bryant', 'Alexander', 'Russell', 'Griffin', 'Diaz', 'Hayes', 'Myers', 'Ford', 'Hamilton', 'Graham', 'Sullivan', 'Wallace', 'Woods', 'Cole', 'West', 'Jordan', 'Owens', 'Reynolds', 'Fisher', 'Ellis', 'Harrison', 'Gibson', 'McDonald', 'Cruz', 'Marshall', 'Ortiz', 'Gomez', 'Murray', 'Freeman', 'Wells', 'Webb', 'Simpson', 'Stevens', 'Tucker', 'Porter', 'Hunter', 'Hicks', 'Crawford', 'Henry', 'Boyd', 'Mason', 'Morales', 'Kennedy', 'Warren', 'Dixon', 'Ramos', 'Reyes', 'Burns', 'Gordon', 'Shaw', 'Holmes', 'Rice', 'Robertson', 'Hunt', 'Black', 'Daniels', 'Palmer', 'Mills', 'Nichols', 'Grant', 'Knight', 'Ferguson', 'Rose', 'Stone', 'Hawkins', 'Dunn', 'Perkins', 'Hudson', 'Spencer', 'Gardner', 'Stephens', 'Payne', 'Pierce', 'Berry', 'Matthews', 'Arnold', 'Wagner', 'Willis', 'Ray', 'Watkins', 'Olson', 'Carroll', 'Duncan', 'Snyder', 'Hart', 'Cunningham', 'Bradley', 'Lane', 'Andrews', 'Ruiz', 'Harper', 'Fox', 'Riley', 'Armstrong', 'Carpenter', 'Weaver', 'Greene', 'Lawrence', 'Elliott', 'Chavez', 'Sims', 'Austin', 'Peters', 'Kelley', 'Franklin', 'Lawson', 'Fields', 'Gutierrez', 'Ryan', 'Schmidt', 'Carr', 'Vasquez', 'Castillo', 'Wheeler', 'Chapman', 'Oliver', 'Montgomery', 'Richards', 'Williamson', 'Johnston', 'Banks', 'Meyer', 'Bishop', 'McCoy', 'Howell', 'Alvarez', 'Morrison', 'Hansen', 'Fernandez', 'Garza', 'Harvey', 'Little', 'Burton', 'Stanley', 'Nguyen', 'George', 'Jacobs', 'Reid', 'Kim', 'Fuller', 'Lynch', 'Dean', 'Gilbert', 'Garrett', 'Romero', 'Welch', 'Larson', 'Frazier', 'Burke', 'Hanson', 'Day', 'Mendoza', 'Moreno', 'Bowman', 'Medina', 'Fowler', 'Brewer', 'Hoffman', 'Carlson', 'Silva', 'Pearson', 'Holland', 'Douglas', 'Fleming', 'Jensen', 'Vargas', 'Byrd', 'Davidson', 'Hopkins', 'May', 'Terry', 'Herrera', 'Wade', 'Soto', 'Walters', 'Curtis', 'Neal', 'Caldwell', 'Lowe', 'Jennings', 'Barnett', 'Graves', 'Jimenez', 'Horton', 'Shelton', 'Barrett', 'Obrien', 'Castro', 'Sutton', 'Gregory', 'McKinney', 'Lucas', 'Miles', 'Craig', 'Rodriquez', 'Chambers', 'Holt', 'Lambert', 'Fletcher', 'Watts', 'Bates', 'Hale', 'Rhodes', 'Pena', 'Beck', 'Newman', 'Haynes', 'McDaniel', 'Mendez', 'Bush', 'Vaughn', 'Parks', 'Dawson', 'Santiago', 'Norris', 'Hardy', 'Love', 'Steele', 'Curry', 'Powers', 'Schultz', 'Barker', 'Guzman', 'Page', 'Munoz', 'Ball', 'Keller', 'Chandler', 'Weber', 'Leonard', 'Walsh', 'Lyons', 'Ramsey', 'Wolfe', 'Schneider', 'Mullins', 'Benson', 'Sharp', 'Bowen', 'Daniel', 'Barber', 'Cummings', 'Hines', 'Baldwin', 'Griffith', 'Valdez', 'Hubbard', 'Salazar', 'Reeves', 'Warner', 'Stevenson', 'Burgess', 'Santos', 'Tate', 'Cross', 'Garner', 'Mann', 'Mack', 'Moss', 'Thornton', 'Dennis', 'McGee', 'Farmer', 'Delgado', 'Aguilar', 'Vega', 'Glover', 'Manning', 'Cohen', 'Harmon', 'Rodgers', 'Robbins', 'Newton', 'Todd', 'Blair', 'Higgins', 'Ingram', 'Reese', 'Cannon', 'Strickland', 'Townsend', 'Potter', 'Goodwin', 'Walton', 'Rowe', 'Hampton', 'Ortega', 'Patton', 'Swanson', 'Joseph', 'Francis', 'Goodman', 'Maldonado', 'Yates', 'Becker', 'Erickson', 'Hodges', 'Rios', 'Conner', 'Adkins', 'Webster', 'Norman', 'Malone', 'Hammond', 'Flowers', 'Cobb', 'Moody', 'Quinn', 'Blake', 'Maxwell', 'Pope', 'Floyd', 'Osborne', 'Paul', 'McCarthy', 'Guerrero', 'Lindsey', 'Estrada', 'Sandoval', 'Gibbs', 'Tyler', 'Gross', 'Fitzgerald', 'Stokes', 'Doyle', 'Sherman', 'Saunders', 'Wise', 'Colon', 'Gill', 'Alvarado', 'Greer', 'Padilla', 'Simon', 'Waters', 'Nunez', 'Ballard', 'Schwartz', 'McBride', 'Houston', 'Christensen', 'Klein', 'Pratt', 'Briggs', 'Parsons', 'McLaughlin', 'Zimmerman', 'French', 'Buchanan', 'Moran', 'Copeland', 'Roy', 'Pittman', 'Brady', 'McCormick', 'Holloway', 'Brock', 'Poole', 'Frank', 'Logan', 'Owen', 'Bass', 'Marsh', 'Drake', 'Wong', 'Jefferson', 'Park', 'Morton', 'Abbott', 'Sparks', 'Patrick', 'Norton', 'Huff', 'Clayton', 'Massey', 'Lloyd', 'Figueroa', 'Carson', 'Bowers', 'Roberson', 'Barton', 'Tran', 'Lamb', 'Harrington', 'Casey', 'Boone', 'Cortez', 'Clarke', 'Mathis', 'Singleton', 'Wilkins', 'Cain', 'Bryan', 'Underwood', 'Hogan', 'McKenzie', 'Collier', 'Luna', 'Phelps', 'McGuire', 'Allison', 'Bridges', 'Wilkerson', 'Nash', 'Summers', 'Atkins'], countries:[{'name':'Afghanistan', 'abbreviation':'AF'}, {'name':'Albania', 'abbreviation':'AL'}, {'name':'Algeria', 'abbreviation':'DZ'}, {'name':'American Samoa', 'abbreviation':'AS'}, {'name':'Andorra', 'abbreviation':'AD'}, {'name':'Angola', 'abbreviation':'AO'}, {'name':'Anguilla', 'abbreviation':'AI'}, {'name':'Antarctica', 'abbreviation':'AQ'}, {'name':'Antigua and Barbuda', 'abbreviation':'AG'}, {'name':'Argentina', 'abbreviation':'AR'}, {'name':'Armenia', 'abbreviation':'AM'}, {'name':'Aruba', 'abbreviation':'AW'}, {'name':'Australia', 'abbreviation':'AU'}, {'name':'Austria', 'abbreviation':'AT'}, {'name':'Azerbaijan', 'abbreviation':'AZ'}, {'name':'Bahamas', 'abbreviation':'BS'}, {'name':'Bahrain', 'abbreviation':'BH'}, {'name':'Bangladesh', 'abbreviation':'BD'}, {'name':'Barbados', 'abbreviation':'BB'}, {'name':'Belarus', 'abbreviation':'BY'}, {'name':'Belgium', 'abbreviation':'BE'}, {'name':'Belize', 'abbreviation':'BZ'}, {'name':'Benin', 'abbreviation':'BJ'}, {'name':'Bermuda', 'abbreviation':'BM'}, {'name':'Bhutan', 'abbreviation':'BT'}, {'name':'Bolivia', 'abbreviation':'BO'}, {'name':'Bosnia and Herzegovina', 'abbreviation':'BA'}, {'name':'Botswana', 'abbreviation':'BW'}, {'name':'Bouvet Island', 'abbreviation':'BV'}, {'name':'Brazil', 'abbreviation':'BR'}, {'name':'British Antarctic Territory', 'abbreviation':'BQ'}, {'name':'British Indian Ocean Territory', 'abbreviation':'IO'}, {'name':'British Virgin Islands', 'abbreviation':'VG'}, {'name':'Brunei', 'abbreviation':'BN'}, {'name':'Bulgaria', 'abbreviation':'BG'}, {'name':'Burkina Faso', 'abbreviation':'BF'}, {'name':'Burundi', 'abbreviation':'BI'}, {'name':'Cambodia', 'abbreviation':'KH'}, {'name':'Cameroon', 'abbreviation':'CM'}, {'name':'Canada', 'abbreviation':'CA'}, {'name':'Canton and Enderbury Islands', 'abbreviation':'CT'}, {'name':'Cape Verde', 'abbreviation':'CV'}, {'name':'Cayman Islands', 'abbreviation':'KY'}, {'name':'Central African Republic', 'abbreviation':'CF'}, {'name':'Chad', 'abbreviation':'TD'}, {'name':'Chile', 'abbreviation':'CL'}, {'name':'China', 'abbreviation':'CN'}, {'name':'Christmas Island', 'abbreviation':'CX'}, {'name':'Cocos [Keeling] Islands', 'abbreviation':'CC'}, {'name':'Colombia', 'abbreviation':'CO'}, {'name':'Comoros', 'abbreviation':'KM'}, {'name':'Congo - Brazzaville', 'abbreviation':'CG'}, {'name':'Congo - Kinshasa', 'abbreviation':'CD'}, {'name':'Cook Islands', 'abbreviation':'CK'}, {'name':'Costa Rica', 'abbreviation':'CR'}, {'name':'Croatia', 'abbreviation':'HR'}, {'name':'Cuba', 'abbreviation':'CU'}, {'name':'Cyprus', 'abbreviation':'CY'}, {'name':'Czech Republic', 'abbreviation':'CZ'}, {'name':'Côte d’Ivoire', 'abbreviation':'CI'}, {'name':'Denmark', 'abbreviation':'DK'}, {'name':'Djibouti', 'abbreviation':'DJ'}, {'name':'Dominica', 'abbreviation':'DM'}, {'name':'Dominican Republic', 'abbreviation':'DO'}, {'name':'Dronning Maud Land', 'abbreviation':'NQ'}, {'name':'East Germany', 'abbreviation':'DD'}, {'name':'Ecuador', 'abbreviation':'EC'}, {'name':'Egypt', 'abbreviation':'EG'}, {'name':'El Salvador', 'abbreviation':'SV'}, {'name':'Equatorial Guinea', 'abbreviation':'GQ'}, {'name':'Eritrea', 'abbreviation':'ER'}, {'name':'Estonia', 'abbreviation':'EE'}, {'name':'Ethiopia', 'abbreviation':'ET'}, {'name':'Falkland Islands', 'abbreviation':'FK'}, {'name':'Faroe Islands', 'abbreviation':'FO'}, {'name':'Fiji', 'abbreviation':'FJ'}, {'name':'Finland', 'abbreviation':'FI'}, {'name':'France', 'abbreviation':'FR'}, {'name':'French Guiana', 'abbreviation':'GF'}, {'name':'French Polynesia', 'abbreviation':'PF'}, {'name':'French Southern Territories', 'abbreviation':'TF'}, {'name':'French Southern and Antarctic Territories', 'abbreviation':'FQ'}, {'name':'Gabon', 'abbreviation':'GA'}, {'name':'Gambia', 'abbreviation':'GM'}, {'name':'Georgia', 'abbreviation':'GE'}, {'name':'Germany', 'abbreviation':'DE'}, {'name':'Ghana', 'abbreviation':'GH'}, {'name':'Gibraltar', 'abbreviation':'GI'}, {'name':'Greece', 'abbreviation':'GR'}, {'name':'Greenland', 'abbreviation':'GL'}, {'name':'Grenada', 'abbreviation':'GD'}, {'name':'Guadeloupe', 'abbreviation':'GP'}, {'name':'Guam', 'abbreviation':'GU'}, {'name':'Guatemala', 'abbreviation':'GT'}, {'name':'Guernsey', 'abbreviation':'GG'}, {'name':'Guinea', 'abbreviation':'GN'}, {'name':'Guinea-Bissau', 'abbreviation':'GW'}, {'name':'Guyana', 'abbreviation':'GY'}, {'name':'Haiti', 'abbreviation':'HT'}, {'name':'Heard Island and McDonald Islands', 'abbreviation':'HM'}, {'name':'Honduras', 'abbreviation':'HN'}, {'name':'Hong Kong SAR China', 'abbreviation':'HK'}, {'name':'Hungary', 'abbreviation':'HU'}, {'name':'Iceland', 'abbreviation':'IS'}, {'name':'India', 'abbreviation':'IN'}, {'name':'Indonesia', 'abbreviation':'ID'}, {'name':'Iran', 'abbreviation':'IR'}, {'name':'Iraq', 'abbreviation':'IQ'}, {'name':'Ireland', 'abbreviation':'IE'}, {'name':'Isle of Man', 'abbreviation':'IM'}, {'name':'Israel', 'abbreviation':'IL'}, {'name':'Italy', 'abbreviation':'IT'}, {'name':'Jamaica', 'abbreviation':'JM'}, {'name':'Japan', 'abbreviation':'JP'}, {'name':'Jersey', 'abbreviation':'JE'}, {'name':'Johnston Island', 'abbreviation':'JT'}, {'name':'Jordan', 'abbreviation':'JO'}, {'name':'Kazakhstan', 'abbreviation':'KZ'}, {'name':'Kenya', 'abbreviation':'KE'}, {'name':'Kiribati', 'abbreviation':'KI'}, {'name':'Kuwait', 'abbreviation':'KW'}, {'name':'Kyrgyzstan', 'abbreviation':'KG'}, {'name':'Laos', 'abbreviation':'LA'}, {'name':'Latvia', 'abbreviation':'LV'}, {'name':'Lebanon', 'abbreviation':'LB'}, {'name':'Lesotho', 'abbreviation':'LS'}, {'name':'Liberia', 'abbreviation':'LR'}, {'name':'Libya', 'abbreviation':'LY'}, {'name':'Liechtenstein', 'abbreviation':'LI'}, {'name':'Lithuania', 'abbreviation':'LT'}, {'name':'Luxembourg', 'abbreviation':'LU'}, {'name':'Macau SAR China', 'abbreviation':'MO'}, {'name':'Macedonia', 'abbreviation':'MK'}, {'name':'Madagascar', 'abbreviation':'MG'}, {'name':'Malawi', 'abbreviation':'MW'}, {'name':'Malaysia', 'abbreviation':'MY'}, {'name':'Maldives', 'abbreviation':'MV'}, {'name':'Mali', 'abbreviation':'ML'}, {'name':'Malta', 'abbreviation':'MT'}, {'name':'Marshall Islands', 'abbreviation':'MH'}, {'name':'Martinique', 'abbreviation':'MQ'}, {'name':'Mauritania', 'abbreviation':'MR'}, {'name':'Mauritius', 'abbreviation':'MU'}, {'name':'Mayotte', 'abbreviation':'YT'}, {'name':'Metropolitan France', 'abbreviation':'FX'}, {'name':'Mexico', 'abbreviation':'MX'}, {'name':'Micronesia', 'abbreviation':'FM'}, {'name':'Midway Islands', 'abbreviation':'MI'}, {'name':'Moldova', 'abbreviation':'MD'}, {'name':'Monaco', 'abbreviation':'MC'}, {'name':'Mongolia', 'abbreviation':'MN'}, {'name':'Montenegro', 'abbreviation':'ME'}, {'name':'Montserrat', 'abbreviation':'MS'}, {'name':'Morocco', 'abbreviation':'MA'}, {'name':'Mozambique', 'abbreviation':'MZ'}, {'name':'Myanmar [Burma]', 'abbreviation':'MM'}, {'name':'Namibia', 'abbreviation':'NA'}, {'name':'Nauru', 'abbreviation':'NR'}, {'name':'Nepal', 'abbreviation':'NP'}, {'name':'Netherlands', 'abbreviation':'NL'}, {'name':'Netherlands Antilles', 'abbreviation':'AN'}, {'name':'Neutral Zone', 'abbreviation':'NT'}, {'name':'New Caledonia', 'abbreviation':'NC'}, {'name':'New Zealand', 'abbreviation':'NZ'}, {'name':'Nicaragua', 'abbreviation':'NI'}, {'name':'Niger', 'abbreviation':'NE'}, {'name':'Nigeria', 'abbreviation':'NG'}, {'name':'Niue', 'abbreviation':'NU'}, {'name':'Norfolk Island', 'abbreviation':'NF'}, {'name':'North Korea', 'abbreviation':'KP'}, {'name':'North Vietnam', 'abbreviation':'VD'}, {'name':'Northern Mariana Islands', 'abbreviation':'MP'}, {'name':'Norway', 'abbreviation':'NO'}, {'name':'Oman', 'abbreviation':'OM'}, {'name':'Pacific Islands Trust Territory', 'abbreviation':'PC'}, {'name':'Pakistan', 'abbreviation':'PK'}, {'name':'Palau', 'abbreviation':'PW'}, {'name':'Palestinian Territories', 'abbreviation':'PS'}, {'name':'Panama', 'abbreviation':'PA'}, {'name':'Panama Canal Zone', 'abbreviation':'PZ'}, {'name':'Papua New Guinea', 'abbreviation':'PG'}, {'name':'Paraguay', 'abbreviation':'PY'}, {'name':'People\'s Democratic Republic of Yemen', 'abbreviation':'YD'}, {'name':'Peru', 'abbreviation':'PE'}, {'name':'Philippines', 'abbreviation':'PH'}, {'name':'Pitcairn Islands', 'abbreviation':'PN'}, {'name':'Poland', 'abbreviation':'PL'}, {'name':'Portugal', 'abbreviation':'PT'}, {'name':'Puerto Rico', 'abbreviation':'PR'}, {'name':'Qatar', 'abbreviation':'QA'}, {'name':'Romania', 'abbreviation':'RO'}, {'name':'Russia', 'abbreviation':'RU'}, {'name':'Rwanda', 'abbreviation':'RW'}, {'name':'Réunion', 'abbreviation':'RE'}, {'name':'Saint Barthélemy', 'abbreviation':'BL'}, {'name':'Saint Helena', 'abbreviation':'SH'}, {'name':'Saint Kitts and Nevis', 'abbreviation':'KN'}, {'name':'Saint Lucia', 'abbreviation':'LC'}, {'name':'Saint Martin', 'abbreviation':'MF'}, {'name':'Saint Pierre and Miquelon', 'abbreviation':'PM'}, {'name':'Saint Vincent and the Grenadines', 'abbreviation':'VC'}, {'name':'Samoa', 'abbreviation':'WS'}, {'name':'San Marino', 'abbreviation':'SM'}, {'name':'Saudi Arabia', 'abbreviation':'SA'}, {'name':'Senegal', 'abbreviation':'SN'}, {'name':'Serbia', 'abbreviation':'RS'}, {'name':'Serbia and Montenegro', 'abbreviation':'CS'}, {'name':'Seychelles', 'abbreviation':'SC'}, {'name':'Sierra Leone', 'abbreviation':'SL'}, {'name':'Singapore', 'abbreviation':'SG'}, {'name':'Slovakia', 'abbreviation':'SK'}, {'name':'Slovenia', 'abbreviation':'SI'}, {'name':'Solomon Islands', 'abbreviation':'SB'}, {'name':'Somalia', 'abbreviation':'SO'}, {'name':'South Africa', 'abbreviation':'ZA'}, {'name':'South Georgia and the South Sandwich Islands', 'abbreviation':'GS'}, {'name':'South Korea', 'abbreviation':'KR'}, {'name':'Spain', 'abbreviation':'ES'}, {'name':'Sri Lanka', 'abbreviation':'LK'}, {'name':'Sudan', 'abbreviation':'SD'}, {'name':'Suriname', 'abbreviation':'SR'}, {'name':'Svalbard and Jan Mayen', 'abbreviation':'SJ'}, {'name':'Swaziland', 'abbreviation':'SZ'}, {'name':'Sweden', 'abbreviation':'SE'}, {'name':'Switzerland', 'abbreviation':'CH'}, {'name':'Syria', 'abbreviation':'SY'}, {'name':'São Tomé and Príncipe', 'abbreviation':'ST'}, {'name':'Taiwan', 'abbreviation':'TW'}, {'name':'Tajikistan', 'abbreviation':'TJ'}, {'name':'Tanzania', 'abbreviation':'TZ'}, {'name':'Thailand', 'abbreviation':'TH'}, {'name':'Timor-Leste', 'abbreviation':'TL'}, {'name':'Togo', 'abbreviation':'TG'}, {'name':'Tokelau', 'abbreviation':'TK'}, {'name':'Tonga', 'abbreviation':'TO'}, {'name':'Trinidad and Tobago', 'abbreviation':'TT'}, {'name':'Tunisia', 'abbreviation':'TN'}, {'name':'Turkey', 'abbreviation':'TR'}, {'name':'Turkmenistan', 'abbreviation':'TM'}, {'name':'Turks and Caicos Islands', 'abbreviation':'TC'}, {'name':'Tuvalu', 'abbreviation':'TV'}, {'name':'U.S. Minor Outlying Islands', 'abbreviation':'UM'}, {'name':'U.S. Miscellaneous Pacific Islands', 'abbreviation':'PU'}, {'name':'U.S. Virgin Islands', 'abbreviation':'VI'}, {'name':'Uganda', 'abbreviation':'UG'}, {'name':'Ukraine', 'abbreviation':'UA'}, {'name':'Union of Soviet Socialist Republics', 'abbreviation':'SU'}, {'name':'United Arab Emirates', 'abbreviation':'AE'}, {'name':'United Kingdom', 'abbreviation':'GB'}, {'name':'United States', 'abbreviation':'US'}, {'name':'Unknown or Invalid Region', 'abbreviation':'ZZ'}, {'name':'Uruguay', 'abbreviation':'UY'}, {'name':'Uzbekistan', 'abbreviation':'UZ'}, {'name':'Vanuatu', 'abbreviation':'VU'}, {'name':'Vatican City', 'abbreviation':'VA'}, {'name':'Venezuela', 'abbreviation':'VE'}, {'name':'Vietnam', 'abbreviation':'VN'}, {'name':'Wake Island', 'abbreviation':'WK'}, {'name':'Wallis and Futuna', 'abbreviation':'WF'}, {'name':'Western Sahara', 'abbreviation':'EH'}, {'name':'Yemen', 'abbreviation':'YE'}, {'name':'Zambia', 'abbreviation':'ZM'}, {'name':'Zimbabwe', 'abbreviation':'ZW'}, {'name':'Åland Islands', 'abbreviation':'AX'}], provinces:[{name:'Alberta', abbreviation:'AB'}, {name:'British Columbia', abbreviation:'BC'}, {name:'Manitoba', abbreviation:'MB'}, {name:'New Brunswick', abbreviation:'NB'}, {name:'Newfoundland and Labrador', abbreviation:'NL'}, {name:'Nova Scotia', abbreviation:'NS'}, {name:'Ontario', abbreviation:'ON'}, {name:'Prince Edward Island', abbreviation:'PE'}, {name:'Quebec', abbreviation:'QC'}, {name:'Saskatchewan', abbreviation:'SK'}, {name:'Northwest Territories', abbreviation:'NT'}, {name:'Nunavut', abbreviation:'NU'}, {name:'Yukon', abbreviation:'YT'}], us_states_and_dc:[{name:'Alabama', abbreviation:'AL'}, {name:'Alaska', abbreviation:'AK'}, {name:'Arizona', abbreviation:'AZ'}, {name:'Arkansas', abbreviation:'AR'}, {name:'California', abbreviation:'CA'}, {name:'Colorado', abbreviation:'CO'}, {name:'Connecticut', abbreviation:'CT'}, {name:'Delaware', abbreviation:'DE'}, {name:'District of Columbia', abbreviation:'DC'}, {name:'Florida', abbreviation:'FL'}, {name:'Georgia', abbreviation:'GA'}, {name:'Hawaii', abbreviation:'HI'}, {name:'Idaho', abbreviation:'ID'}, {name:'Illinois', abbreviation:'IL'}, {name:'Indiana', abbreviation:'IN'}, {name:'Iowa', abbreviation:'IA'}, {name:'Kansas', abbreviation:'KS'}, {name:'Kentucky', abbreviation:'KY'}, {name:'Louisiana', abbreviation:'LA'}, {name:'Maine', abbreviation:'ME'}, {name:'Maryland', abbreviation:'MD'}, {name:'Massachusetts', abbreviation:'MA'}, {name:'Michigan', abbreviation:'MI'}, {name:'Minnesota', abbreviation:'MN'}, {name:'Mississippi', abbreviation:'MS'}, {name:'Missouri', abbreviation:'MO'}, {name:'Montana', abbreviation:'MT'}, {name:'Nebraska', abbreviation:'NE'}, {name:'Nevada', abbreviation:'NV'}, {name:'New Hampshire', abbreviation:'NH'}, {name:'New Jersey', abbreviation:'NJ'}, {name:'New Mexico', abbreviation:'NM'}, {name:'New York', abbreviation:'NY'}, {name:'North Carolina', abbreviation:'NC'}, {name:'North Dakota', abbreviation:'ND'}, {name:'Ohio', abbreviation:'OH'}, {name:'Oklahoma', abbreviation:'OK'}, {name:'Oregon', abbreviation:'OR'}, {name:'Pennsylvania', abbreviation:'PA'}, {name:'Rhode Island', abbreviation:'RI'}, {name:'South Carolina', abbreviation:'SC'}, {name:'South Dakota', abbreviation:'SD'}, {name:'Tennessee', abbreviation:'TN'}, {name:'Texas', abbreviation:'TX'}, {name:'Utah', abbreviation:'UT'}, {name:'Vermont', abbreviation:'VT'}, {name:'Virginia', abbreviation:'VA'}, {name:'Washington', abbreviation:'WA'}, {name:'West Virginia', abbreviation:'WV'}, {name:'Wisconsin', abbreviation:'WI'}, {name:'Wyoming', abbreviation:'WY'}], territories:[{name:'American Samoa', abbreviation:'AS'}, {name:'Federated States of Micronesia', abbreviation:'FM'}, {name:'Guam', abbreviation:'GU'}, {name:'Marshall Islands', abbreviation:'MH'}, {name:'Northern Mariana Islands', abbreviation:'MP'}, {name:'Puerto Rico', abbreviation:'PR'}, {name:'Virgin Islands, U.S.', abbreviation:'VI'}], armed_forces:[{name:'Armed Forces Europe', abbreviation:'AE'}, {name:'Armed Forces Pacific', abbreviation:'AP'}, {name:'Armed Forces the Americas', abbreviation:'AA'}], street_suffixes:[{name:'Avenue', abbreviation:'Ave'}, {name:'Boulevard', abbreviation:'Blvd'}, {name:'Center', abbreviation:'Ctr'}, {name:'Circle', abbreviation:'Cir'}, {name:'Court', abbreviation:'Ct'}, {name:'Drive', abbreviation:'Dr'}, {name:'Extension', abbreviation:'Ext'}, {name:'Glen', abbreviation:'Gln'}, {name:'Grove', abbreviation:'Grv'}, {name:'Heights', abbreviation:'Hts'}, {name:'Highway', abbreviation:'Hwy'}, {name:'Junction', abbreviation:'Jct'}, {name:'Key', abbreviation:'Key'}, {name:'Lane', abbreviation:'Ln'}, {name:'Loop', abbreviation:'Loop'}, {name:'Manor', abbreviation:'Mnr'}, {name:'Mill', abbreviation:'Mill'}, {name:'Park', abbreviation:'Park'}, {name:'Parkway', abbreviation:'Pkwy'}, {name:'Pass', abbreviation:'Pass'}, {name:'Path', abbreviation:'Path'}, {name:'Pike', abbreviation:'Pike'}, {name:'Place', abbreviation:'Pl'}, {name:'Plaza', abbreviation:'Plz'}, {name:'Point', abbreviation:'Pt'}, {name:'Ridge', abbreviation:'Rdg'}, {name:'River', abbreviation:'Riv'}, {name:'Road', abbreviation:'Rd'}, {name:'Square', abbreviation:'Sq'}, {name:'Street', abbreviation:'St'}, {name:'Terrace', abbreviation:'Ter'}, {name:'Trail', abbreviation:'Trl'}, {name:'Turnpike', abbreviation:'Tpke'}, {name:'View', abbreviation:'Vw'}, {name:'Way', abbreviation:'Way'}], months:[{name:'January', short_name:'Jan', numeric:'01', days:31}, {name:'February', short_name:'Feb', numeric:'02', days:28}, {name:'March', short_name:'Mar', numeric:'03', days:31}, {name:'April', short_name:'Apr', numeric:'04', days:30}, {name:'May', short_name:'May', numeric:'05', days:31}, {name:'June', short_name:'Jun', numeric:'06', days:30}, {name:'July', short_name:'Jul', numeric:'07', days:31}, {name:'August', short_name:'Aug', numeric:'08', days:31}, {name:'September', short_name:'Sep', numeric:'09', days:30}, {name:'October', short_name:'Oct', numeric:'10', days:31}, {name:'November', short_name:'Nov', numeric:'11', days:30}, {name:'December', short_name:'Dec', numeric:'12', days:31}], cc_types:[{name:'American Express', short_name:'amex', prefix:'34', length:15}, {name:'Bankcard', short_name:'bankcard', prefix:'5610', length:16}, {name:'China UnionPay', short_name:'chinaunion', prefix:'62', length:16}, {name:'Diners Club Carte Blanche', short_name:'dccarte', prefix:'300', length:14}, {name:'Diners Club enRoute', short_name:'dcenroute', prefix:'2014', length:15}, {name:'Diners Club International', short_name:'dcintl', prefix:'36', length:14}, {name:'Diners Club United States & Canada', short_name:'dcusc', prefix:'54', length:16}, {name:'Discover Card', short_name:'discover', prefix:'6011', length:16}, {name:'InstaPayment', short_name:'instapay', prefix:'637', length:16}, {name:'JCB', short_name:'jcb', prefix:'3528', length:16}, {name:'Laser', short_name:'laser', prefix:'6304', length:16}, {name:'Maestro', short_name:'maestro', prefix:'5018', length:16}, {name:'Mastercard', short_name:'mc', prefix:'51', length:16}, {name:'Solo', short_name:'solo', prefix:'6334', length:16}, {name:'Switch', short_name:'switch', prefix:'4903', length:16}, {name:'Visa', short_name:'visa', prefix:'4', length:16}, {name:'Visa Electron', short_name:'electron', prefix:'4026', length:16}], currency_types:[{'code':'AED', 'name':'United Arab Emirates Dirham'}, {'code':'AFN', 'name':'Afghanistan Afghani'}, {'code':'ALL', 'name':'Albania Lek'}, {'code':'AMD', 'name':'Armenia Dram'}, {'code':'ANG', 'name':'Netherlands Antilles Guilder'}, {'code':'AOA', 'name':'Angola Kwanza'}, {'code':'ARS', 'name':'Argentina Peso'}, {'code':'AUD', 'name':'Australia Dollar'}, {'code':'AWG', 'name':'Aruba Guilder'}, {'code':'AZN', 'name':'Azerbaijan New Manat'}, {'code':'BAM', 'name':'Bosnia and Herzegovina Convertible Marka'}, {'code':'BBD', 'name':'Barbados Dollar'}, {'code':'BDT', 'name':'Bangladesh Taka'}, {'code':'BGN', 'name':'Bulgaria Lev'}, {'code':'BHD', 'name':'Bahrain Dinar'}, {'code':'BIF', 'name':'Burundi Franc'}, {'code':'BMD', 'name':'Bermuda Dollar'}, {'code':'BND', 'name':'Brunei Darussalam Dollar'}, {'code':'BOB', 'name':'Bolivia Boliviano'}, {'code':'BRL', 'name':'Brazil Real'}, {'code':'BSD', 'name':'Bahamas Dollar'}, {'code':'BTN', 'name':'Bhutan Ngultrum'}, {'code':'BWP', 'name':'Botswana Pula'}, {'code':'BYR', 'name':'Belarus Ruble'}, {'code':'BZD', 'name':'Belize Dollar'}, {'code':'CAD', 'name':'Canada Dollar'}, {'code':'CDF', 'name':'Congo/Kinshasa Franc'}, {'code':'CHF', 'name':'Switzerland Franc'}, {'code':'CLP', 'name':'Chile Peso'}, {'code':'CNY', 'name':'China Yuan Renminbi'}, {'code':'COP', 'name':'Colombia Peso'}, {'code':'CRC', 'name':'Costa Rica Colon'}, {'code':'CUC', 'name':'Cuba Convertible Peso'}, {'code':'CUP', 'name':'Cuba Peso'}, {'code':'CVE', 'name':'Cape Verde Escudo'}, {'code':'CZK', 'name':'Czech Republic Koruna'}, {'code':'DJF', 'name':'Djibouti Franc'}, {'code':'DKK', 'name':'Denmark Krone'}, {'code':'DOP', 'name':'Dominican Republic Peso'}, {'code':'DZD', 'name':'Algeria Dinar'}, {'code':'EGP', 'name':'Egypt Pound'}, {'code':'ERN', 'name':'Eritrea Nakfa'}, {'code':'ETB', 'name':'Ethiopia Birr'}, {'code':'EUR', 'name':'Euro Member Countries'}, {'code':'FJD', 'name':'Fiji Dollar'}, {'code':'FKP', 'name':'Falkland Islands (Malvinas) Pound'}, {'code':'GBP', 'name':'United Kingdom Pound'}, {'code':'GEL', 'name':'Georgia Lari'}, {'code':'GGP', 'name':'Guernsey Pound'}, {'code':'GHS', 'name':'Ghana Cedi'}, {'code':'GIP', 'name':'Gibraltar Pound'}, {'code':'GMD', 'name':'Gambia Dalasi'}, {'code':'GNF', 'name':'Guinea Franc'}, {'code':'GTQ', 'name':'Guatemala Quetzal'}, {'code':'GYD', 'name':'Guyana Dollar'}, {'code':'HKD', 'name':'Hong Kong Dollar'}, {'code':'HNL', 'name':'Honduras Lempira'}, {'code':'HRK', 'name':'Croatia Kuna'}, {'code':'HTG', 'name':'Haiti Gourde'}, {'code':'HUF', 'name':'Hungary Forint'}, {'code':'IDR', 'name':'Indonesia Rupiah'}, {'code':'ILS', 'name':'Israel Shekel'}, {'code':'IMP', 'name':'Isle of Man Pound'}, {'code':'INR', 'name':'India Rupee'}, {'code':'IQD', 'name':'Iraq Dinar'}, {'code':'IRR', 'name':'Iran Rial'}, {'code':'ISK', 'name':'Iceland Krona'}, {'code':'JEP', 'name':'Jersey Pound'}, {'code':'JMD', 'name':'Jamaica Dollar'}, {'code':'JOD', 'name':'Jordan Dinar'}, {'code':'JPY', 'name':'Japan Yen'}, {'code':'KES', 'name':'Kenya Shilling'}, {'code':'KGS', 'name':'Kyrgyzstan Som'}, {'code':'KHR', 'name':'Cambodia Riel'}, {'code':'KMF', 'name':'Comoros Franc'}, {'code':'KPW', 'name':'Korea (North) Won'}, {'code':'KRW', 'name':'Korea (South) Won'}, {'code':'KWD', 'name':'Kuwait Dinar'}, {'code':'KYD', 'name':'Cayman Islands Dollar'}, {'code':'KZT', 'name':'Kazakhstan Tenge'}, {'code':'LAK', 'name':'Laos Kip'}, {'code':'LBP', 'name':'Lebanon Pound'}, {'code':'LKR', 'name':'Sri Lanka Rupee'}, {'code':'LRD', 'name':'Liberia Dollar'}, {'code':'LSL', 'name':'Lesotho Loti'}, {'code':'LTL', 'name':'Lithuania Litas'}, {'code':'LYD', 'name':'Libya Dinar'}, {'code':'MAD', 'name':'Morocco Dirham'}, {'code':'MDL', 'name':'Moldova Leu'}, {'code':'MGA', 'name':'Madagascar Ariary'}, {'code':'MKD', 'name':'Macedonia Denar'}, {'code':'MMK', 'name':'Myanmar (Burma) Kyat'}, {'code':'MNT', 'name':'Mongolia Tughrik'}, {'code':'MOP', 'name':'Macau Pataca'}, {'code':'MRO', 'name':'Mauritania Ouguiya'}, {'code':'MUR', 'name':'Mauritius Rupee'}, {'code':'MVR', 'name':'Maldives (Maldive Islands) Rufiyaa'}, {'code':'MWK', 'name':'Malawi Kwacha'}, {'code':'MXN', 'name':'Mexico Peso'}, {'code':'MYR', 'name':'Malaysia Ringgit'}, {'code':'MZN', 'name':'Mozambique Metical'}, {'code':'NAD', 'name':'Namibia Dollar'}, {'code':'NGN', 'name':'Nigeria Naira'}, {'code':'NIO', 'name':'Nicaragua Cordoba'}, {'code':'NOK', 'name':'Norway Krone'}, {'code':'NPR', 'name':'Nepal Rupee'}, {'code':'NZD', 'name':'New Zealand Dollar'}, {'code':'OMR', 'name':'Oman Rial'}, {'code':'PAB', 'name':'Panama Balboa'}, {'code':'PEN', 'name':'Peru Nuevo Sol'}, {'code':'PGK', 'name':'Papua New Guinea Kina'}, {'code':'PHP', 'name':'Philippines Peso'}, {'code':'PKR', 'name':'Pakistan Rupee'}, {'code':'PLN', 'name':'Poland Zloty'}, {'code':'PYG', 'name':'Paraguay Guarani'}, {'code':'QAR', 'name':'Qatar Riyal'}, {'code':'RON', 'name':'Romania New Leu'}, {'code':'RSD', 'name':'Serbia Dinar'}, {'code':'RUB', 'name':'Russia Ruble'}, {'code':'RWF', 'name':'Rwanda Franc'}, {'code':'SAR', 'name':'Saudi Arabia Riyal'}, {'code':'SBD', 'name':'Solomon Islands Dollar'}, {'code':'SCR', 'name':'Seychelles Rupee'}, {'code':'SDG', 'name':'Sudan Pound'}, {'code':'SEK', 'name':'Sweden Krona'}, {'code':'SGD', 'name':'Singapore Dollar'}, {'code':'SHP', 'name':'Saint Helena Pound'}, {'code':'SLL', 'name':'Sierra Leone Leone'}, {'code':'SOS', 'name':'Somalia Shilling'}, {'code':'SPL', 'name':'Seborga Luigino'}, {'code':'SRD', 'name':'Suriname Dollar'}, {'code':'STD', 'name':'São Tomé and Príncipe Dobra'}, {'code':'SVC', 'name':'El Salvador Colon'}, {'code':'SYP', 'name':'Syria Pound'}, {'code':'SZL', 'name':'Swaziland Lilangeni'}, {'code':'THB', 'name':'Thailand Baht'}, {'code':'TJS', 'name':'Tajikistan Somoni'}, {'code':'TMT', 'name':'Turkmenistan Manat'}, {'code':'TND', 'name':'Tunisia Dinar'}, {'code':'TOP', 'name':'Tonga Pa\'anga'}, {'code':'TRY', 'name':'Turkey Lira'}, {'code':'TTD', 'name':'Trinidad and Tobago Dollar'}, {'code':'TVD', 'name':'Tuvalu Dollar'}, {'code':'TWD', 'name':'Taiwan New Dollar'}, {'code':'TZS', 'name':'Tanzania Shilling'}, {'code':'UAH', 'name':'Ukraine Hryvnia'}, {'code':'UGX', 'name':'Uganda Shilling'}, {'code':'USD', 'name':'United States Dollar'}, {'code':'UYU', 'name':'Uruguay Peso'}, {'code':'UZS', 'name':'Uzbekistan Som'}, {'code':'VEF', 'name':'Venezuela Bolivar'}, {'code':'VND', 'name':'Viet Nam Dong'}, {'code':'VUV', 'name':'Vanuatu Vatu'}, {'code':'WST', 'name':'Samoa Tala'}, {'code':'XAF', 'name':'Communauté Financière Africaine (BEAC) CFA Franc BEAC'}, {'code':'XCD', 'name':'East Caribbean Dollar'}, {'code':'XDR', 'name':'International Monetary Fund (IMF) Special Drawing Rights'}, {'code':'XOF', 'name':'Communauté Financière Africaine (BCEAO) Franc'}, {'code':'XPF', 'name':'Comptoirs Français du Pacifique (CFP) Franc'}, {'code':'YER', 'name':'Yemen Rial'}, {'code':'ZAR', 'name':'South Africa Rand'}, {'code':'ZMW', 'name':'Zambia Kwacha'}, {'code':'ZWD', 'name':'Zimbabwe Dollar'}]};var o_hasOwnProperty=Object.prototype.hasOwnProperty;var o_keys=Object.keys || function(obj){var result=[];for(var key in obj) {if(o_hasOwnProperty.call(obj, key)){result.push(key);}}return result;};function _copyObject(source, target){var keys=o_keys(source);var key;for(var i=0, l=keys.length; i < l; i++) {key = keys[i];target[key] = source[key] || target[key];}}function _copyArray(source, target){for(var i=0, l=source.length; i < l; i++) {target[i] = source[i];}}function copyObject(source, _target){var isArray=Array.isArray(source);var target=_target || (isArray?new Array(source.length):{});if(isArray){_copyArray(source, target);}else {_copyObject(source, target);}return target;}Chance.prototype.get = function(name){return copyObject(data[name]);};Chance.prototype.mac_address = function(options){options = initOptions(options);if(!options.separator){options.separator = options.networkVersion?'.':':';}var mac_pool='ABCDEF1234567890', mac='';if(!options.networkVersion){mac = this.n(this.string, 6, {pool:mac_pool, length:2}).join(options.separator);}else {mac = this.n(this.string, 3, {pool:mac_pool, length:4}).join(options.separator);}return mac;};Chance.prototype.normal = function(options){options = initOptions(options, {mean:0, dev:1});var s, u, v, norm, mean=options.mean, dev=options.dev;do {u = this.random() * 2 - 1;v = this.random() * 2 - 1;s = u * u + v * v;}while(s >= 1);norm = u * Math.sqrt(-2 * Math.log(s) / s);return dev * norm + mean;};Chance.prototype.radio = function(options){options = initOptions(options, {side:'?'});var fl='';switch(options.side.toLowerCase()){case 'east':case 'e':fl = 'W';break;case 'west':case 'w':fl = 'K';break;default:fl = this.character({pool:'KW'});break;}return fl + this.character({alpha:true, casing:'upper'}) + this.character({alpha:true, casing:'upper'}) + this.character({alpha:true, casing:'upper'});};Chance.prototype.set = function(name, values){if(typeof name === 'string'){data[name] = values;}else {data = copyObject(name, data);}};Chance.prototype.tv = function(options){return this.radio(options);};Chance.prototype.cnpj = function(){var n=this.n(this.natural, 8, {max:9});var d1=2 + n[7] * 6 + n[6] * 7 + n[5] * 8 + n[4] * 9 + n[3] * 2 + n[2] * 3 + n[1] * 4 + n[0] * 5;d1 = 11 - d1 % 11;if(d1 >= 10){d1 = 0;}var d2=d1 * 2 + 3 + n[7] * 7 + n[6] * 8 + n[5] * 9 + n[4] * 2 + n[3] * 3 + n[2] * 4 + n[1] * 5 + n[0] * 6;d2 = 11 - d2 % 11;if(d2 >= 10){d2 = 0;}return '' + n[0] + n[1] + '.' + n[2] + n[3] + n[4] + '.' + n[5] + n[6] + n[7] + '/0001-' + d1 + d2;};Chance.prototype.mersenne_twister = function(seed){return new MersenneTwister(seed);};var MersenneTwister=function MersenneTwister(seed){if(seed === undefined){seed = Math.floor(Math.random() * Math.pow(10, 13));}this.N = 624;this.M = 397;this.MATRIX_A = 2567483615;this.UPPER_MASK = 2147483648;this.LOWER_MASK = 2147483647;this.mt = new Array(this.N);this.mti = this.N + 1;this.init_genrand(seed);};MersenneTwister.prototype.init_genrand = function(s){this.mt[0] = s >>> 0;for(this.mti = 1; this.mti < this.N; this.mti++) {s = this.mt[this.mti - 1] ^ this.mt[this.mti - 1] >>> 30;this.mt[this.mti] = (((s & 4294901760) >>> 16) * 1812433253 << 16) + (s & 65535) * 1812433253 + this.mti;this.mt[this.mti] >>>= 0;}};MersenneTwister.prototype.init_by_array = function(init_key, key_length){var i=1, j=0, k, s;this.init_genrand(19650218);k = this.N > key_length?this.N:key_length;for(; k; k--) {s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;this.mt[i] = (this.mt[i] ^ (((s & 4294901760) >>> 16) * 1664525 << 16) + (s & 65535) * 1664525) + init_key[j] + j;this.mt[i] >>>= 0;i++;j++;if(i >= this.N){this.mt[0] = this.mt[this.N - 1];i = 1;}if(j >= key_length){j = 0;}}for(k = this.N - 1; k; k--) {s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;this.mt[i] = (this.mt[i] ^ (((s & 4294901760) >>> 16) * 1566083941 << 16) + (s & 65535) * 1566083941) - i;this.mt[i] >>>= 0;i++;if(i >= this.N){this.mt[0] = this.mt[this.N - 1];i = 1;}}this.mt[0] = 2147483648;};MersenneTwister.prototype.genrand_int32 = function(){var y;var mag01=new Array(0, this.MATRIX_A);if(this.mti >= this.N){var kk;if(this.mti === this.N + 1){this.init_genrand(5489);}for(kk = 0; kk < this.N - this.M; kk++) {y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;this.mt[kk] = this.mt[kk + this.M] ^ y >>> 1 ^ mag01[y & 1];}for(; kk < this.N - 1; kk++) {y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ y >>> 1 ^ mag01[y & 1];}y = this.mt[this.N - 1] & this.UPPER_MASK | this.mt[0] & this.LOWER_MASK;this.mt[this.N - 1] = this.mt[this.M - 1] ^ y >>> 1 ^ mag01[y & 1];this.mti = 0;}y = this.mt[this.mti++];y ^= y >>> 11;y ^= y << 7 & 2636928640;y ^= y << 15 & 4022730752;y ^= y >>> 18;return y >>> 0;};MersenneTwister.prototype.genrand_int31 = function(){return this.genrand_int32() >>> 1;};MersenneTwister.prototype.genrand_real1 = function(){return this.genrand_int32() * (1 / 4294967295);};MersenneTwister.prototype.random = function(){return this.genrand_int32() * (1 / 4294967296);};MersenneTwister.prototype.genrand_real3 = function(){return (this.genrand_int32() + 0.5) * (1 / 4294967296);};MersenneTwister.prototype.genrand_res53 = function(){var a=this.genrand_int32() >>> 5, b=this.genrand_int32() >>> 6;return (a * 67108864 + b) * (1 / 9007199254740992);};if(typeof exports !== 'undefined'){if(typeof module !== 'undefined' && module.exports){exports = module.exports = Chance;}exports.Chance = Chance;}if(typeof define === 'function' && define.amd){define([], function(){return Chance;});}if(typeof importScripts !== 'undefined'){chance = new Chance();}if(typeof window === 'object' && typeof window.document === 'object'){window.Chance = Chance;window.chance = new Chance();}})();

}).call(this,require("buffer").Buffer)
},{"buffer":1}],6:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});
var config = {
  staffSize: 5,
  experience: function experience() {
    return Math.round(Math.random() * 10 + 1);
  }
};
exports['default'] = config;
module.exports = exports['default'];

},{}],7:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _officers = require('./officers');

var _officers2 = _interopRequireDefault(_officers);

var Engine = (function () {
  function Engine() {
    _classCallCheck(this, Engine);

    this.entities = new _officers2['default'](_config2['default'].staffSize);
    this.turn = 0;
  }

  _createClass(Engine, [{
    key: 'start',
    value: function start() {
      var _this = this;

      var update = function update() {
        _this.turn++;
        _this.update();
        console.log(_this.entities.staff);
      };

      setInterval(update, 1000);
    }
  }, {
    key: 'update',
    value: function update() {
      this.entities.update();
    }
  }]);

  return Engine;
})();

exports['default'] = Engine;
module.exports = exports['default'];

},{"./config":6,"./officers":9}],8:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _promoter = require('./promoter');

var _promoter2 = _interopRequireDefault(_promoter);

require('./chance');

var promoter = new _promoter2['default']();

var Officer = (function () {
  function Officer() {
    _classCallCheck(this, Officer);

    this.experience = _config2['default'].experience();
    this.rank = promoter.ranks.lieutenant;
    this.fname = chance.name({ gender: 'male' });
    this.lname = chance.last();
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
      promoter.checkPromotion(this);
    }
  }]);

  return Officer;
})();

exports['default'] = Officer;
module.exports = exports['default'];

},{"./chance":5,"./config":6,"./promoter":10}],9:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _officer = require('./officer');

var _officer2 = _interopRequireDefault(_officer);

var Officers = (function () {
  function Officers(size) {
    _classCallCheck(this, Officers);

    this.staff = [];
    this.recruit(size);
  }

  _createClass(Officers, [{
    key: 'recruit',
    value: function recruit(amount) {
      while (this.staff.length < amount) {
        this.staff.push(new _officer2['default']());
      }
    }
  }, {
    key: 'update',
    value: function update() {
      this.staff.forEach(function (officer) {
        officer.update();
      });
    }
  }]);

  return Officers;
})();

exports['default'] = Officers;
module.exports = exports['default'];

},{"./officer":8}],10:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Promoter = (function () {
  function Promoter() {
    _classCallCheck(this, Promoter);

    this.thresholds = {
      captain: 20,
      major: 40
    };

    this.ranks = {
      lieutenant: {
        title: 'Lieutenant',
        alias: 'lieutenant'
      },
      captain: {
        title: 'Captain',
        alias: 'captain'
      },
      major: {
        title: 'Major',
        alias: 'major'
      }
    };
  }

  _createClass(Promoter, [{
    key: 'checkPromotion',
    value: function checkPromotion(officer) {
      var nextRank = {};

      if (officer.experience > this.thresholds.major) {
        nextRank = this.ranks.major;
      } else if (officer.experience > this.thresholds.captain) {
        nextRank = this.ranks.captain;
      } else {
        nextRank = this.ranks.lieutenant;
      }

      if (nextRank !== {} && nextRank !== officer.rank) {
        officer.rank = this.promote(nextRank.alias);
      } else {
        console.log('Passed for promotion.');
      }
    }
  }, {
    key: 'promote',
    value: function promote(nextRank) {
      return this.ranks[nextRank];
    }
  }]);

  return Promoter;
})();

exports['default'] = Promoter;
module.exports = exports['default'];

},{}],11:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _engine = require('./engine');

var _engine2 = _interopRequireDefault(_engine);

var engine = new _engine2['default']();
engine.start();

},{"./engine":7}]},{},[11]);
