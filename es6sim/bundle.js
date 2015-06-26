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
            unit.commander = this.HQ.officers.recruit('lgeneral', unit.id, this.HQ);

            this.units.corps.push(unit);

            this.generate('division', _config2['default'].unitDepth, unit);
            this.generate('corp', quantity - 1, parent);
            break;

          case 'division':
            unit.name = _names2['default'].divisions[0];
            _names2['default'].divisions.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('dgeneral', unit.id, this.HQ);

            parent.subunits.push(unit);

            this.generate('brigade', _config2['default'].unitDepth, unit);
            this.generate('division', quantity - 1, parent);
            break;

          case 'brigade':
            unit.name = _names2['default'].brigades[0];
            _names2['default'].brigades.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('bgeneral', unit.id, this.HQ);

            parent.subunits.push(unit);

            this.generate('regiment', _config2['default'].unitDepth, unit);
            this.generate('brigade', quantity - 1, parent);
            break;

          case 'regiment':
            unit.name = _names2['default'].regiments[0];
            _names2['default'].regiments.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('coronel', unit.id, this.HQ);

            parent.subunits.push(unit);

            this.generate('battalion', _config2['default'].unitDepth, unit);
            this.generate('regiment', quantity - 1, parent);
            break;

          case 'battalion':
            unit.name = _names2['default'].battalions[0];
            _names2['default'].battalions.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('lcoronel', unit.id, this.HQ);

            parent.subunits.push(unit);

            this.generate('company', _config2['default'].unitDepth, unit);
            this.generate('battalion', quantity - 1, parent);
            break;

          case 'company':
            unit.name = _names2['default'].companies[0];
            _names2['default'].companies.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('major', unit.id, this.HQ);

            parent.subunits.push(unit);

            this.generate('platoon', _config2['default'].unitDepth, unit);
            this.generate('company', quantity - 1, parent);
            break;

          case 'platoon':
            unit.name = _names2['default'].platoons[0];
            _names2['default'].platoons.shift();
            unit.subunits = [];
            unit.commander = this.HQ.officers.recruit('captain', unit.id, this.HQ);

            parent.subunits.push(unit);

            this.generate('squad', _config2['default'].unitDepth, unit);
            this.generate('platoon', quantity - 1, parent);
            break;

          case 'squad':
            unit.name = _names2['default'].squads[0];
            _names2['default'].squads.shift();
            unit.commander = this.HQ.officers.recruit('lieutenant', unit.id, this.HQ);

            parent.subunits.push(unit);

            this.generate('squad', quantity - 1, parent);
            break;
        }

        this.HQ.add(unit);
      }
    }
  }]);

  return Army;
})();

exports['default'] = Army;
module.exports = exports['default'];

},{"./config":8,"./hq":12,"./names":13,"./officers":15,"./unit":22,"./world":23}],6:[function(require,module,exports){
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

var _uiJsx = require('./ui.jsx');

var _uiJsx2 = _interopRequireDefault(_uiJsx);

var Engine = (function () {
  function Engine(army) {
    _classCallCheck(this, Engine);

    this.ui = new _uiJsx2['default'](this);
    this.army = army;
    this.turn = 0;
    this.running = true;
    this.start(this);
  }

  _createClass(Engine, [{
    key: 'start',
    value: function start(engine) {
      this.update(engine);
    }
  }, {
    key: 'pause',
    value: function pause() {
      this.running = !this.running;
      if (this.running) this.update();
    }
  }, {
    key: 'update',
    value: function update() {
      var _this = this;

      this.turn++;
      this.army.HQ.update();
      this.ui.render(this.army);

      if (this.running) {
        setTimeout(function () {
          _this.update();
        }, 250);
      }
    }
  }]);

  return Engine;
})();

exports['default'] = Engine;
module.exports = exports['default'];

},{"./ui.jsx":21}],11:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _engine = require('./engine');

var _engine2 = _interopRequireDefault(_engine);

var _army = require('./army');

var _army2 = _interopRequireDefault(_army);

var army = new _army2['default']();
var engine = new _engine2['default'](army);

},{"./army":5,"./engine":10}],12:[function(require,module,exports){
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

var _operations = require('./operations');

var _operations2 = _interopRequireDefault(_operations);

var HQ = (function () {
  function HQ() {
    _classCallCheck(this, HQ);

    this.operations = new _operations2['default']();
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
      this.updateDate();
      this.units.map(this.retire.bind(this));
      this.operations.update(this);
      this.officers.update(this);
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
      var _this = this;

      this.units.some(function (unit) {
        if (unit.id === unitId) {
          _this.replace(unit);
          return true;
        }
      });
    }
  }, {
    key: 'retire',
    value: function retire(unit) {
      if (unit.commander.retired) {
        this.replace(unit);
      }
    }
  }, {
    key: 'replace',
    value: function replace(unit) {
      unit.commander = this.officers.replace(unit.commander, this);
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

},{"./config":8,"./date.js":9,"./operations":16}],13:[function(require,module,exports){
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

var Officer = (function () {
  function Officer(spec) {
    _classCallCheck(this, Officer);

    var chance = new Chance();
    var traits = new _traits2['default']();

    this.id = spec.id;

    this.unitId = spec.unitId;
    this.rank = _config2['default'].ranks[spec.rank];
    this.experience = _config2['default'].ranks[spec.rank].startxp + _config2['default'].random(10);

    this.traits = {
      base: traits.random()
    };

    this.alignment = _config2['default'].random(1000);
    this.militancy = _config2['default'].random(10);
    this.drift = 0;
    this.operations = [];

    this.administration = this.traits.base.administration + _config2['default'].random(10);
    this.intelligence = this.traits.base.intelligence + _config2['default'].random(10);
    this.commanding = this.traits.base.commanding + _config2['default'].random(10);
    this.diplomacy = this.traits.base.diplomacy + _config2['default'].random(10);

    this.lname = chance.last();
    this.fname = chance.first({ gender: 'male' });

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
    value: function update(HQ) {
      this.align();
      this.militate(HQ);
      this.experience++;
      if (this.experience > this.rank.maxxp) this.retire();
    }
  }, {
    key: 'drifts',
    value: function drifts(officers, units) {
      var _this = this;

      this.unit = units.filter(function (unit) {
        return unit.id === _this.unitId;
      })[0];

      this.commander = officers.filter(function (officer) {
        return officer.unitId === _this.unit.parentId;
      })[0];

      if (this.commander && this.commander.alignment > 500) {
        this.drift++;
      } else {
        this.drift--;
      }
    }
  }, {
    key: 'align',
    value: function align() {
      if (this.drift > 0 && this.alignment < 1000) {
        this.alignment += this.drift;
      } else if (this.drift < 0 && this.alignment > 0) {
        this.alignment += this.drift;
      }
    }
  }, {
    key: 'militate',
    value: function militate(HQ) {
      if (this.drift > 0 && this.alignment > 900 || this.drift < 0 && this.alignment < 100) {
        if (this.militancy < 10) this.militancy++;
      }
      if (this.militancy === 10) {
        this.operations.push(HQ.operations.add(this, HQ));
        this.militancy = 0;
      }
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

},{"./chance":6,"./config":8,"./traits":20}],15:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _hq = require('./hq');

var _hq2 = _interopRequireDefault(_hq);

var _officer = require('./officer');

var _officer2 = _interopRequireDefault(_officer);

var _comparisons = require('./comparisons');

var _comparisons2 = _interopRequireDefault(_comparisons);

var _secretary = require('./secretary');

var _secretary2 = _interopRequireDefault(_secretary);

var comparisons = new _comparisons2['default']();

var Officers = (function () {
  function Officers(HQ) {
    _classCallCheck(this, Officers);

    this.active = [];
    this.__officersID = 1;
    this.secretary = new _secretary2['default']();
  }

  _createClass(Officers, [{
    key: 'update',
    value: function update(HQ) {
      this.active.forEach(function (officer) {
        officer.update(HQ);
      });
    }
  }, {
    key: 'recruit',
    value: function recruit(rank, unitId, HQ) {
      var options = {
        date: HQ.realDate,
        unitName: HQ.unitName(unitId),
        id: this.__officersID,
        unitId: unitId,
        rank: rank
      };

      var recruit = new _officer2['default'](options);
      this.active.push(recruit);
      this.__officersID++;
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
    value: function replace(commander, HQ) {
      var lowerRank = this.secretary.rankLower(commander.rank);

      var spec = {
        unitId: commander.unitId,
        rank: commander.rank.alias,
        rankToPromote: lowerRank,
        HQ: HQ
      };

      if (!lowerRank) {
        return this.recruit('lieutenant', commander.unitId, HQ);
      } else {
        return this.candidate(spec);
      }
    }
  }, {
    key: 'candidate',
    value: function candidate(spec) {
      var candidates = [];

      this.active.map(function (officer) {
        if (officer.rank.alias === spec.rankToPromote) {
          candidates.push(officer);
        }
      });

      var candidate = candidates.sort(comparisons.byExperience)[0];

      return this.promote(candidate, spec);
    }
  }, {
    key: 'promotion',
    value: function promotion(officer, spec) {
      officer.unitId = spec.unitId;
      officer.rank = _config2['default'].ranks[spec.rank];

      return {
        rank: spec.rank,
        date: spec.HQ.realDate,
        unit: spec.HQ.unitName(officer.unitId)
      };
    }
  }, {
    key: 'promote',
    value: function promote(officer, spec) {
      spec.HQ.deassign(officer.unitId);

      var promotion = this.promotion(officer, spec);

      officer.history.push(_config2['default'].promoted(promotion));
      officer.drifts(this.active, spec.HQ.units);

      return officer;
    }
  }]);

  return Officers;
})();

exports['default'] = Officers;
module.exports = exports['default'];

},{"./comparisons":7,"./config":8,"./hq":12,"./officer":14,"./secretary":19}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Operations = (function () {
  function Operations() {
    _classCallCheck(this, Operations);

    this.__operationID = 1;
    this.ongoing = [];
  }

  _createClass(Operations, [{
    key: 'add',
    value: function add(officer, HQ) {
      var operation = new Operation(officer, HQ);
      operation.id = this.__operationID;
      this.ongoing.push(operation);
      return operation.id;
    }
  }, {
    key: 'update',
    value: function update(HQ) {
      this.ongoing = this.ongoing.filter(function (operation) {
        if (!operation.done && !operation.failed && !operation.lead.retired && !operation.target.retired) {
          return true;
        }
      });

      this.ongoing.map(function (operation) {
        operation.execute(HQ);
      });
    }
  }]);

  return Operations;
})();

var Operation = (function () {
  function Operation(officer, HQ) {
    _classCallCheck(this, Operation);

    this.types = {
      administration: { action: 'deviate', area: 'administration' },
      commanding: { action: 'coup', area: 'commanding' },
      diplomacy: { action: 'influence', area: 'diplomacy' },
      intelligence: { action: 'spy', area: 'intelligence' }
    };

    this.failed = null;
    this.done = null;

    this.side = officer.alignment > 500 ? 'right' : 'left';
    this.type = this.types[officer.traits.base.area];
    this.strength = 0;

    this.lead = officer;
    this.target = this.pick(officer, HQ);
    if (this.target === undefined) this.failed = true;
  }

  _createClass(Operation, [{
    key: 'pick',
    value: function pick(officer, HQ) {
      var _this = this;

      this.targets = HQ.officers.active.filter(function (officer) {
        if (officer.militancy > 5) {
          if (officer.alignment > 500 && _this.side === 'left' || officer.alignment < 500 && _this.side === 'right') {
            return true;
          }
        }
      }) || [];

      return this.targets[Math.ceil(Math.random() * this.targets.length)];
    }
  }, {
    key: 'execute',
    value: function execute(HQ) {
      this.strength++;
      if (this.strength > 5) {
        if (this.target[this.type.area] < this.lead[this.type.area]) {
          this[this.type.action](HQ.realDate);
          HQ.deassign(this.target.unitId);
          this.done = true;
        } else {
          this.failed = true;
        }
      }
    }
  }, {
    key: 'deviate',
    value: function deviate(date) {
      this.lead.history.push('Forced ' + this.target.name() + ' into retirement after revealing a fraudulent scheme on ' + date);
    }
  }, {
    key: 'coup',
    value: function coup(date) {
      this.lead.history.push('Forced ' + this.target.name() + ' into retirement after taking control of his unit on ' + date);
    }
  }, {
    key: 'influence',
    value: function influence(date) {
      this.lead.history.push('Forced ' + this.target.name() + ' into retirement after influencing key staff members on ' + date);
    }
  }, {
    key: 'spy',
    value: function spy(date) {
      this.lead.history.push('Forced ' + this.target.name() + ' into retirement after revealing personal secrets on ' + date);
    }
  }]);

  return Operation;
})();

exports['default'] = Operations;
module.exports = exports['default'];

},{}],17:[function(require,module,exports){
(function (global){
"use strict";(function(f){if(typeof exports === "object" && typeof module !== "undefined"){module.exports = f();}else if(typeof define === "function" && define.amd){define([], f);}else {var g;if(typeof window !== "undefined"){g = window;}else if(typeof global !== "undefined"){g = global;}else if(typeof self !== "undefined"){g = self;}else {g = this;}g.React = f();}})(function(){var define, module, exports;return (function e(t, n, r){function s(o, u){if(!n[o]){if(!t[o]){var a=typeof require == "function" && require;if(!u && a)return a(o, !0);if(i)return i(o, !0);var f=new Error("Cannot find module '" + o + "'");throw (f.code = "MODULE_NOT_FOUND", f);}var l=n[o] = {exports:{}};t[o][0].call(l.exports, function(e){var n=t[o][1][e];return s(n?n:e);}, l, l.exports, e, t, n, r);}return n[o].exports;}var i=typeof require == "function" && require;for(var o=0; o < r.length; o++) s(r[o]);return s;})({1:[function(_dereq_, module, exports){"use strict";var EventPluginUtils=_dereq_(19);var ReactChildren=_dereq_(32);var ReactComponent=_dereq_(34);var ReactClass=_dereq_(33);var ReactContext=_dereq_(38);var ReactCurrentOwner=_dereq_(39);var ReactElement=_dereq_(57);var ReactElementValidator=_dereq_(58);var ReactDOM=_dereq_(40);var ReactDOMTextComponent=_dereq_(51);var ReactDefaultInjection=_dereq_(54);var ReactInstanceHandles=_dereq_(66);var ReactMount=_dereq_(70);var ReactPerf=_dereq_(75);var ReactPropTypes=_dereq_(78);var ReactReconciler=_dereq_(81);var ReactServerRendering=_dereq_(84);var assign=_dereq_(27);var findDOMNode=_dereq_(117);var onlyChild=_dereq_(144);ReactDefaultInjection.inject();var createElement=ReactElement.createElement;var createFactory=ReactElement.createFactory;var cloneElement=ReactElement.cloneElement;if("production" !== "development"){createElement = ReactElementValidator.createElement;createFactory = ReactElementValidator.createFactory;cloneElement = ReactElementValidator.cloneElement;}var render=ReactPerf.measure("React", "render", ReactMount.render);var React={Children:{map:ReactChildren.map, forEach:ReactChildren.forEach, count:ReactChildren.count, only:onlyChild}, Component:ReactComponent, DOM:ReactDOM, PropTypes:ReactPropTypes, initializeTouchEvents:function initializeTouchEvents(shouldUseTouch){EventPluginUtils.useTouchEvents = shouldUseTouch;}, createClass:ReactClass.createClass, createElement:createElement, cloneElement:cloneElement, createFactory:createFactory, createMixin:function createMixin(mixin){return mixin;}, constructAndRenderComponent:ReactMount.constructAndRenderComponent, constructAndRenderComponentByID:ReactMount.constructAndRenderComponentByID, findDOMNode:findDOMNode, render:render, renderToString:ReactServerRendering.renderToString, renderToStaticMarkup:ReactServerRendering.renderToStaticMarkup, unmountComponentAtNode:ReactMount.unmountComponentAtNode, isValidElement:ReactElement.isValidElement, withContext:ReactContext.withContext, __spread:assign};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject === "function"){__REACT_DEVTOOLS_GLOBAL_HOOK__.inject({CurrentOwner:ReactCurrentOwner, InstanceHandles:ReactInstanceHandles, Mount:ReactMount, Reconciler:ReactReconciler, TextComponent:ReactDOMTextComponent});}if("production" !== "development"){var ExecutionEnvironment=_dereq_(21);if(ExecutionEnvironment.canUseDOM && window.top === window.self){if(navigator.userAgent.indexOf("Chrome") > -1){if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined"){console.debug("Download the React DevTools for a better development experience: " + "https://fb.me/react-devtools");}}var expectedFeatures=[Array.isArray, Array.prototype.every, Array.prototype.forEach, Array.prototype.indexOf, Array.prototype.map, Date.now, Function.prototype.bind, Object.keys, String.prototype.split, String.prototype.trim, Object.create, Object.freeze];for(var i=0; i < expectedFeatures.length; i++) {if(!expectedFeatures[i]){console.error("One or more ES5 shim/shams expected by React are not available: " + "https://fb.me/react-warning-polyfills");break;}}}}React.version = "0.13.3";module.exports = React;}, {"117":117, "144":144, "19":19, "21":21, "27":27, "32":32, "33":33, "34":34, "38":38, "39":39, "40":40, "51":51, "54":54, "57":57, "58":58, "66":66, "70":70, "75":75, "78":78, "81":81, "84":84}], 2:[function(_dereq_, module, exports){"use strict";var focusNode=_dereq_(119);var AutoFocusMixin={componentDidMount:function componentDidMount(){if(this.props.autoFocus){focusNode(this.getDOMNode());}}};module.exports = AutoFocusMixin;}, {"119":119}], 3:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var EventPropagators=_dereq_(20);var ExecutionEnvironment=_dereq_(21);var FallbackCompositionState=_dereq_(22);var SyntheticCompositionEvent=_dereq_(93);var SyntheticInputEvent=_dereq_(97);var keyOf=_dereq_(141);var END_KEYCODES=[9, 13, 27, 32];var START_KEYCODE=229;var canUseCompositionEvent=ExecutionEnvironment.canUseDOM && "CompositionEvent" in window;var documentMode=null;if(ExecutionEnvironment.canUseDOM && "documentMode" in document){documentMode = document.documentMode;}var canUseTextInputEvent=ExecutionEnvironment.canUseDOM && "TextEvent" in window && !documentMode && !isPresto();var useFallbackCompositionData=ExecutionEnvironment.canUseDOM && (!canUseCompositionEvent || documentMode && documentMode > 8 && documentMode <= 11);function isPresto(){var opera=window.opera;return typeof opera === "object" && typeof opera.version === "function" && parseInt(opera.version(), 10) <= 12;}var SPACEBAR_CODE=32;var SPACEBAR_CHAR=String.fromCharCode(SPACEBAR_CODE);var topLevelTypes=EventConstants.topLevelTypes;var eventTypes={beforeInput:{phasedRegistrationNames:{bubbled:keyOf({onBeforeInput:null}), captured:keyOf({onBeforeInputCapture:null})}, dependencies:[topLevelTypes.topCompositionEnd, topLevelTypes.topKeyPress, topLevelTypes.topTextInput, topLevelTypes.topPaste]}, compositionEnd:{phasedRegistrationNames:{bubbled:keyOf({onCompositionEnd:null}), captured:keyOf({onCompositionEndCapture:null})}, dependencies:[topLevelTypes.topBlur, topLevelTypes.topCompositionEnd, topLevelTypes.topKeyDown, topLevelTypes.topKeyPress, topLevelTypes.topKeyUp, topLevelTypes.topMouseDown]}, compositionStart:{phasedRegistrationNames:{bubbled:keyOf({onCompositionStart:null}), captured:keyOf({onCompositionStartCapture:null})}, dependencies:[topLevelTypes.topBlur, topLevelTypes.topCompositionStart, topLevelTypes.topKeyDown, topLevelTypes.topKeyPress, topLevelTypes.topKeyUp, topLevelTypes.topMouseDown]}, compositionUpdate:{phasedRegistrationNames:{bubbled:keyOf({onCompositionUpdate:null}), captured:keyOf({onCompositionUpdateCapture:null})}, dependencies:[topLevelTypes.topBlur, topLevelTypes.topCompositionUpdate, topLevelTypes.topKeyDown, topLevelTypes.topKeyPress, topLevelTypes.topKeyUp, topLevelTypes.topMouseDown]}};var hasSpaceKeypress=false;function isKeypressCommand(nativeEvent){return (nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) && !(nativeEvent.ctrlKey && nativeEvent.altKey);}function getCompositionEventType(topLevelType){switch(topLevelType){case topLevelTypes.topCompositionStart:return eventTypes.compositionStart;case topLevelTypes.topCompositionEnd:return eventTypes.compositionEnd;case topLevelTypes.topCompositionUpdate:return eventTypes.compositionUpdate;}}function isFallbackCompositionStart(topLevelType, nativeEvent){return topLevelType === topLevelTypes.topKeyDown && nativeEvent.keyCode === START_KEYCODE;}function isFallbackCompositionEnd(topLevelType, nativeEvent){switch(topLevelType){case topLevelTypes.topKeyUp:return END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1;case topLevelTypes.topKeyDown:return nativeEvent.keyCode !== START_KEYCODE;case topLevelTypes.topKeyPress:case topLevelTypes.topMouseDown:case topLevelTypes.topBlur:return true;default:return false;}}function getDataFromCustomEvent(nativeEvent){var detail=nativeEvent.detail;if(typeof detail === "object" && "data" in detail){return detail.data;}return null;}var currentComposition=null;function extractCompositionEvent(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent){var eventType;var fallbackData;if(canUseCompositionEvent){eventType = getCompositionEventType(topLevelType);}else if(!currentComposition){if(isFallbackCompositionStart(topLevelType, nativeEvent)){eventType = eventTypes.compositionStart;}}else if(isFallbackCompositionEnd(topLevelType, nativeEvent)){eventType = eventTypes.compositionEnd;}if(!eventType){return null;}if(useFallbackCompositionData){if(!currentComposition && eventType === eventTypes.compositionStart){currentComposition = FallbackCompositionState.getPooled(topLevelTarget);}else if(eventType === eventTypes.compositionEnd){if(currentComposition){fallbackData = currentComposition.getData();}}}var event=SyntheticCompositionEvent.getPooled(eventType, topLevelTargetID, nativeEvent);if(fallbackData){event.data = fallbackData;}else {var customData=getDataFromCustomEvent(nativeEvent);if(customData !== null){event.data = customData;}}EventPropagators.accumulateTwoPhaseDispatches(event);return event;}function getNativeBeforeInputChars(topLevelType, nativeEvent){switch(topLevelType){case topLevelTypes.topCompositionEnd:return getDataFromCustomEvent(nativeEvent);case topLevelTypes.topKeyPress:var which=nativeEvent.which;if(which !== SPACEBAR_CODE){return null;}hasSpaceKeypress = true;return SPACEBAR_CHAR;case topLevelTypes.topTextInput:var chars=nativeEvent.data;if(chars === SPACEBAR_CHAR && hasSpaceKeypress){return null;}return chars;default:return null;}}function getFallbackBeforeInputChars(topLevelType, nativeEvent){if(currentComposition){if(topLevelType === topLevelTypes.topCompositionEnd || isFallbackCompositionEnd(topLevelType, nativeEvent)){var chars=currentComposition.getData();FallbackCompositionState.release(currentComposition);currentComposition = null;return chars;}return null;}switch(topLevelType){case topLevelTypes.topPaste:return null;case topLevelTypes.topKeyPress:if(nativeEvent.which && !isKeypressCommand(nativeEvent)){return String.fromCharCode(nativeEvent.which);}return null;case topLevelTypes.topCompositionEnd:return useFallbackCompositionData?null:nativeEvent.data;default:return null;}}function extractBeforeInputEvent(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent){var chars;if(canUseTextInputEvent){chars = getNativeBeforeInputChars(topLevelType, nativeEvent);}else {chars = getFallbackBeforeInputChars(topLevelType, nativeEvent);}if(!chars){return null;}var event=SyntheticInputEvent.getPooled(eventTypes.beforeInput, topLevelTargetID, nativeEvent);event.data = chars;EventPropagators.accumulateTwoPhaseDispatches(event);return event;}var BeforeInputEventPlugin={eventTypes:eventTypes, extractEvents:function extractEvents(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent){return [extractCompositionEvent(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent), extractBeforeInputEvent(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent)];}};module.exports = BeforeInputEventPlugin;}, {"141":141, "15":15, "20":20, "21":21, "22":22, "93":93, "97":97}], 4:[function(_dereq_, module, exports){"use strict";var isUnitlessNumber={boxFlex:true, boxFlexGroup:true, columnCount:true, flex:true, flexGrow:true, flexPositive:true, flexShrink:true, flexNegative:true, fontWeight:true, lineClamp:true, lineHeight:true, opacity:true, order:true, orphans:true, widows:true, zIndex:true, zoom:true, fillOpacity:true, strokeDashoffset:true, strokeOpacity:true, strokeWidth:true};function prefixKey(prefix, key){return prefix + key.charAt(0).toUpperCase() + key.substring(1);}var prefixes=["Webkit", "ms", "Moz", "O"];Object.keys(isUnitlessNumber).forEach(function(prop){prefixes.forEach(function(prefix){isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];});});var shorthandPropertyExpansions={background:{backgroundImage:true, backgroundPosition:true, backgroundRepeat:true, backgroundColor:true}, border:{borderWidth:true, borderStyle:true, borderColor:true}, borderBottom:{borderBottomWidth:true, borderBottomStyle:true, borderBottomColor:true}, borderLeft:{borderLeftWidth:true, borderLeftStyle:true, borderLeftColor:true}, borderRight:{borderRightWidth:true, borderRightStyle:true, borderRightColor:true}, borderTop:{borderTopWidth:true, borderTopStyle:true, borderTopColor:true}, font:{fontStyle:true, fontVariant:true, fontWeight:true, fontSize:true, lineHeight:true, fontFamily:true}};var CSSProperty={isUnitlessNumber:isUnitlessNumber, shorthandPropertyExpansions:shorthandPropertyExpansions};module.exports = CSSProperty;}, {}], 5:[function(_dereq_, module, exports){"use strict";var CSSProperty=_dereq_(4);var ExecutionEnvironment=_dereq_(21);var camelizeStyleName=_dereq_(108);var dangerousStyleValue=_dereq_(113);var hyphenateStyleName=_dereq_(133);var memoizeStringOnly=_dereq_(143);var warning=_dereq_(154);var processStyleName=memoizeStringOnly(function(styleName){return hyphenateStyleName(styleName);});var styleFloatAccessor="cssFloat";if(ExecutionEnvironment.canUseDOM){if(document.documentElement.style.cssFloat === undefined){styleFloatAccessor = "styleFloat";}}if("production" !== "development"){var badVendoredStyleNamePattern=/^(?:webkit|moz|o)[A-Z]/;var badStyleValueWithSemicolonPattern=/;\s*$/;var warnedStyleNames={};var warnedStyleValues={};var warnHyphenatedStyleName=function warnHyphenatedStyleName(name){if(warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]){return;}warnedStyleNames[name] = true;"production" !== "development"?warning(false, "Unsupported style property %s. Did you mean %s?", name, camelizeStyleName(name)):null;};var warnBadVendoredStyleName=function warnBadVendoredStyleName(name){if(warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]){return;}warnedStyleNames[name] = true;"production" !== "development"?warning(false, "Unsupported vendor-prefixed style property %s. Did you mean %s?", name, name.charAt(0).toUpperCase() + name.slice(1)):null;};var warnStyleValueWithSemicolon=function warnStyleValueWithSemicolon(name, value){if(warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]){return;}warnedStyleValues[value] = true;"production" !== "development"?warning(false, "Style property values shouldn't contain a semicolon. " + "Try \"%s: %s\" instead.", name, value.replace(badStyleValueWithSemicolonPattern, "")):null;};var warnValidStyle=function warnValidStyle(name, value){if(name.indexOf("-") > -1){warnHyphenatedStyleName(name);}else if(badVendoredStyleNamePattern.test(name)){warnBadVendoredStyleName(name);}else if(badStyleValueWithSemicolonPattern.test(value)){warnStyleValueWithSemicolon(name, value);}};}var CSSPropertyOperations={createMarkupForStyles:function createMarkupForStyles(styles){var serialized="";for(var styleName in styles) {if(!styles.hasOwnProperty(styleName)){continue;}var styleValue=styles[styleName];if("production" !== "development"){warnValidStyle(styleName, styleValue);}if(styleValue != null){serialized += processStyleName(styleName) + ":";serialized += dangerousStyleValue(styleName, styleValue) + ";";}}return serialized || null;}, setValueForStyles:function setValueForStyles(node, styles){var style=node.style;for(var styleName in styles) {if(!styles.hasOwnProperty(styleName)){continue;}if("production" !== "development"){warnValidStyle(styleName, styles[styleName]);}var styleValue=dangerousStyleValue(styleName, styles[styleName]);if(styleName === "float"){styleName = styleFloatAccessor;}if(styleValue){style[styleName] = styleValue;}else {var expansion=CSSProperty.shorthandPropertyExpansions[styleName];if(expansion){for(var individualStyleName in expansion) {style[individualStyleName] = "";}}else {style[styleName] = "";}}}}};module.exports = CSSPropertyOperations;}, {"108":108, "113":113, "133":133, "143":143, "154":154, "21":21, "4":4}], 6:[function(_dereq_, module, exports){"use strict";var PooledClass=_dereq_(28);var assign=_dereq_(27);var invariant=_dereq_(135);function CallbackQueue(){this._callbacks = null;this._contexts = null;}assign(CallbackQueue.prototype, {enqueue:function enqueue(callback, context){this._callbacks = this._callbacks || [];this._contexts = this._contexts || [];this._callbacks.push(callback);this._contexts.push(context);}, notifyAll:function notifyAll(){var callbacks=this._callbacks;var contexts=this._contexts;if(callbacks){"production" !== "development"?invariant(callbacks.length === contexts.length, "Mismatched list of contexts in callback queue"):invariant(callbacks.length === contexts.length);this._callbacks = null;this._contexts = null;for(var i=0, l=callbacks.length; i < l; i++) {callbacks[i].call(contexts[i]);}callbacks.length = 0;contexts.length = 0;}}, reset:function reset(){this._callbacks = null;this._contexts = null;}, destructor:function destructor(){this.reset();}});PooledClass.addPoolingTo(CallbackQueue);module.exports = CallbackQueue;}, {"135":135, "27":27, "28":28}], 7:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var EventPluginHub=_dereq_(17);var EventPropagators=_dereq_(20);var ExecutionEnvironment=_dereq_(21);var ReactUpdates=_dereq_(87);var SyntheticEvent=_dereq_(95);var isEventSupported=_dereq_(136);var isTextInputElement=_dereq_(138);var keyOf=_dereq_(141);var topLevelTypes=EventConstants.topLevelTypes;var eventTypes={change:{phasedRegistrationNames:{bubbled:keyOf({onChange:null}), captured:keyOf({onChangeCapture:null})}, dependencies:[topLevelTypes.topBlur, topLevelTypes.topChange, topLevelTypes.topClick, topLevelTypes.topFocus, topLevelTypes.topInput, topLevelTypes.topKeyDown, topLevelTypes.topKeyUp, topLevelTypes.topSelectionChange]}};var activeElement=null;var activeElementID=null;var activeElementValue=null;var activeElementValueProp=null;function shouldUseChangeEvent(elem){return elem.nodeName === "SELECT" || elem.nodeName === "INPUT" && elem.type === "file";}var doesChangeEventBubble=false;if(ExecutionEnvironment.canUseDOM){doesChangeEventBubble = isEventSupported("change") && (!("documentMode" in document) || document.documentMode > 8);}function manualDispatchChangeEvent(nativeEvent){var event=SyntheticEvent.getPooled(eventTypes.change, activeElementID, nativeEvent);EventPropagators.accumulateTwoPhaseDispatches(event);ReactUpdates.batchedUpdates(runEventInBatch, event);}function runEventInBatch(event){EventPluginHub.enqueueEvents(event);EventPluginHub.processEventQueue();}function startWatchingForChangeEventIE8(target, targetID){activeElement = target;activeElementID = targetID;activeElement.attachEvent("onchange", manualDispatchChangeEvent);}function stopWatchingForChangeEventIE8(){if(!activeElement){return;}activeElement.detachEvent("onchange", manualDispatchChangeEvent);activeElement = null;activeElementID = null;}function getTargetIDForChangeEvent(topLevelType, topLevelTarget, topLevelTargetID){if(topLevelType === topLevelTypes.topChange){return topLevelTargetID;}}function handleEventsForChangeEventIE8(topLevelType, topLevelTarget, topLevelTargetID){if(topLevelType === topLevelTypes.topFocus){stopWatchingForChangeEventIE8();startWatchingForChangeEventIE8(topLevelTarget, topLevelTargetID);}else if(topLevelType === topLevelTypes.topBlur){stopWatchingForChangeEventIE8();}}var isInputEventSupported=false;if(ExecutionEnvironment.canUseDOM){isInputEventSupported = isEventSupported("input") && (!("documentMode" in document) || document.documentMode > 9);}var newValueProp={get:function get(){return activeElementValueProp.get.call(this);}, set:function set(val){activeElementValue = "" + val;activeElementValueProp.set.call(this, val);}};function startWatchingForValueChange(target, targetID){activeElement = target;activeElementID = targetID;activeElementValue = target.value;activeElementValueProp = Object.getOwnPropertyDescriptor(target.constructor.prototype, "value");Object.defineProperty(activeElement, "value", newValueProp);activeElement.attachEvent("onpropertychange", handlePropertyChange);}function stopWatchingForValueChange(){if(!activeElement){return;}delete activeElement.value;activeElement.detachEvent("onpropertychange", handlePropertyChange);activeElement = null;activeElementID = null;activeElementValue = null;activeElementValueProp = null;}function handlePropertyChange(nativeEvent){if(nativeEvent.propertyName !== "value"){return;}var value=nativeEvent.srcElement.value;if(value === activeElementValue){return;}activeElementValue = value;manualDispatchChangeEvent(nativeEvent);}function getTargetIDForInputEvent(topLevelType, topLevelTarget, topLevelTargetID){if(topLevelType === topLevelTypes.topInput){return topLevelTargetID;}}function handleEventsForInputEventIE(topLevelType, topLevelTarget, topLevelTargetID){if(topLevelType === topLevelTypes.topFocus){stopWatchingForValueChange();startWatchingForValueChange(topLevelTarget, topLevelTargetID);}else if(topLevelType === topLevelTypes.topBlur){stopWatchingForValueChange();}}function getTargetIDForInputEventIE(topLevelType, topLevelTarget, topLevelTargetID){if(topLevelType === topLevelTypes.topSelectionChange || topLevelType === topLevelTypes.topKeyUp || topLevelType === topLevelTypes.topKeyDown){if(activeElement && activeElement.value !== activeElementValue){activeElementValue = activeElement.value;return activeElementID;}}}function shouldUseClickEvent(elem){return elem.nodeName === "INPUT" && (elem.type === "checkbox" || elem.type === "radio");}function getTargetIDForClickEvent(topLevelType, topLevelTarget, topLevelTargetID){if(topLevelType === topLevelTypes.topClick){return topLevelTargetID;}}var ChangeEventPlugin={eventTypes:eventTypes, extractEvents:function extractEvents(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent){var getTargetIDFunc, handleEventFunc;if(shouldUseChangeEvent(topLevelTarget)){if(doesChangeEventBubble){getTargetIDFunc = getTargetIDForChangeEvent;}else {handleEventFunc = handleEventsForChangeEventIE8;}}else if(isTextInputElement(topLevelTarget)){if(isInputEventSupported){getTargetIDFunc = getTargetIDForInputEvent;}else {getTargetIDFunc = getTargetIDForInputEventIE;handleEventFunc = handleEventsForInputEventIE;}}else if(shouldUseClickEvent(topLevelTarget)){getTargetIDFunc = getTargetIDForClickEvent;}if(getTargetIDFunc){var targetID=getTargetIDFunc(topLevelType, topLevelTarget, topLevelTargetID);if(targetID){var event=SyntheticEvent.getPooled(eventTypes.change, targetID, nativeEvent);EventPropagators.accumulateTwoPhaseDispatches(event);return event;}}if(handleEventFunc){handleEventFunc(topLevelType, topLevelTarget, topLevelTargetID);}}};module.exports = ChangeEventPlugin;}, {"136":136, "138":138, "141":141, "15":15, "17":17, "20":20, "21":21, "87":87, "95":95}], 8:[function(_dereq_, module, exports){"use strict";var nextReactRootIndex=0;var ClientReactRootIndex={createReactRootIndex:function createReactRootIndex(){return nextReactRootIndex++;}};module.exports = ClientReactRootIndex;}, {}], 9:[function(_dereq_, module, exports){"use strict";var Danger=_dereq_(12);var ReactMultiChildUpdateTypes=_dereq_(72);var setTextContent=_dereq_(149);var invariant=_dereq_(135);function insertChildAt(parentNode, childNode, index){parentNode.insertBefore(childNode, parentNode.childNodes[index] || null);}var DOMChildrenOperations={dangerouslyReplaceNodeWithMarkup:Danger.dangerouslyReplaceNodeWithMarkup, updateTextContent:setTextContent, processUpdates:function processUpdates(updates, markupList){var update;var initialChildren=null;var updatedChildren=null;for(var i=0; i < updates.length; i++) {update = updates[i];if(update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING || update.type === ReactMultiChildUpdateTypes.REMOVE_NODE){var updatedIndex=update.fromIndex;var updatedChild=update.parentNode.childNodes[updatedIndex];var parentID=update.parentID;"production" !== "development"?invariant(updatedChild, "processUpdates(): Unable to find child %s of element. This " + "probably means the DOM was unexpectedly mutated (e.g., by the " + "browser), usually due to forgetting a <tbody> when using tables, " + "nesting tags like <form>, <p>, or <a>, or using non-SVG elements " + "in an <svg> parent. Try inspecting the child nodes of the element " + "with React ID `%s`.", updatedIndex, parentID):invariant(updatedChild);initialChildren = initialChildren || {};initialChildren[parentID] = initialChildren[parentID] || [];initialChildren[parentID][updatedIndex] = updatedChild;updatedChildren = updatedChildren || [];updatedChildren.push(updatedChild);}}var renderedMarkup=Danger.dangerouslyRenderMarkup(markupList);if(updatedChildren){for(var j=0; j < updatedChildren.length; j++) {updatedChildren[j].parentNode.removeChild(updatedChildren[j]);}}for(var k=0; k < updates.length; k++) {update = updates[k];switch(update.type){case ReactMultiChildUpdateTypes.INSERT_MARKUP:insertChildAt(update.parentNode, renderedMarkup[update.markupIndex], update.toIndex);break;case ReactMultiChildUpdateTypes.MOVE_EXISTING:insertChildAt(update.parentNode, initialChildren[update.parentID][update.fromIndex], update.toIndex);break;case ReactMultiChildUpdateTypes.TEXT_CONTENT:setTextContent(update.parentNode, update.textContent);break;case ReactMultiChildUpdateTypes.REMOVE_NODE:break;}}}};module.exports = DOMChildrenOperations;}, {"12":12, "135":135, "149":149, "72":72}], 10:[function(_dereq_, module, exports){"use strict";var invariant=_dereq_(135);function checkMask(value, bitmask){return (value & bitmask) === bitmask;}var DOMPropertyInjection={MUST_USE_ATTRIBUTE:1, MUST_USE_PROPERTY:2, HAS_SIDE_EFFECTS:4, HAS_BOOLEAN_VALUE:8, HAS_NUMERIC_VALUE:16, HAS_POSITIVE_NUMERIC_VALUE:32 | 16, HAS_OVERLOADED_BOOLEAN_VALUE:64, injectDOMPropertyConfig:function injectDOMPropertyConfig(domPropertyConfig){var Properties=domPropertyConfig.Properties || {};var DOMAttributeNames=domPropertyConfig.DOMAttributeNames || {};var DOMPropertyNames=domPropertyConfig.DOMPropertyNames || {};var DOMMutationMethods=domPropertyConfig.DOMMutationMethods || {};if(domPropertyConfig.isCustomAttribute){DOMProperty._isCustomAttributeFunctions.push(domPropertyConfig.isCustomAttribute);}for(var propName in Properties) {"production" !== "development"?invariant(!DOMProperty.isStandardName.hasOwnProperty(propName), "injectDOMPropertyConfig(...): You're trying to inject DOM property " + "'%s' which has already been injected. You may be accidentally " + "injecting the same DOM property config twice, or you may be " + "injecting two configs that have conflicting property names.", propName):invariant(!DOMProperty.isStandardName.hasOwnProperty(propName));DOMProperty.isStandardName[propName] = true;var lowerCased=propName.toLowerCase();DOMProperty.getPossibleStandardName[lowerCased] = propName;if(DOMAttributeNames.hasOwnProperty(propName)){var attributeName=DOMAttributeNames[propName];DOMProperty.getPossibleStandardName[attributeName] = propName;DOMProperty.getAttributeName[propName] = attributeName;}else {DOMProperty.getAttributeName[propName] = lowerCased;}DOMProperty.getPropertyName[propName] = DOMPropertyNames.hasOwnProperty(propName)?DOMPropertyNames[propName]:propName;if(DOMMutationMethods.hasOwnProperty(propName)){DOMProperty.getMutationMethod[propName] = DOMMutationMethods[propName];}else {DOMProperty.getMutationMethod[propName] = null;}var propConfig=Properties[propName];DOMProperty.mustUseAttribute[propName] = checkMask(propConfig, DOMPropertyInjection.MUST_USE_ATTRIBUTE);DOMProperty.mustUseProperty[propName] = checkMask(propConfig, DOMPropertyInjection.MUST_USE_PROPERTY);DOMProperty.hasSideEffects[propName] = checkMask(propConfig, DOMPropertyInjection.HAS_SIDE_EFFECTS);DOMProperty.hasBooleanValue[propName] = checkMask(propConfig, DOMPropertyInjection.HAS_BOOLEAN_VALUE);DOMProperty.hasNumericValue[propName] = checkMask(propConfig, DOMPropertyInjection.HAS_NUMERIC_VALUE);DOMProperty.hasPositiveNumericValue[propName] = checkMask(propConfig, DOMPropertyInjection.HAS_POSITIVE_NUMERIC_VALUE);DOMProperty.hasOverloadedBooleanValue[propName] = checkMask(propConfig, DOMPropertyInjection.HAS_OVERLOADED_BOOLEAN_VALUE);"production" !== "development"?invariant(!DOMProperty.mustUseAttribute[propName] || !DOMProperty.mustUseProperty[propName], "DOMProperty: Cannot require using both attribute and property: %s", propName):invariant(!DOMProperty.mustUseAttribute[propName] || !DOMProperty.mustUseProperty[propName]);"production" !== "development"?invariant(DOMProperty.mustUseProperty[propName] || !DOMProperty.hasSideEffects[propName], "DOMProperty: Properties that have side effects must use property: %s", propName):invariant(DOMProperty.mustUseProperty[propName] || !DOMProperty.hasSideEffects[propName]);"production" !== "development"?invariant(!!DOMProperty.hasBooleanValue[propName] + !!DOMProperty.hasNumericValue[propName] + !!DOMProperty.hasOverloadedBooleanValue[propName] <= 1, "DOMProperty: Value can be one of boolean, overloaded boolean, or " + "numeric value, but not a combination: %s", propName):invariant(!!DOMProperty.hasBooleanValue[propName] + !!DOMProperty.hasNumericValue[propName] + !!DOMProperty.hasOverloadedBooleanValue[propName] <= 1);}}};var defaultValueCache={};var DOMProperty={ID_ATTRIBUTE_NAME:"data-reactid", isStandardName:{}, getPossibleStandardName:{}, getAttributeName:{}, getPropertyName:{}, getMutationMethod:{}, mustUseAttribute:{}, mustUseProperty:{}, hasSideEffects:{}, hasBooleanValue:{}, hasNumericValue:{}, hasPositiveNumericValue:{}, hasOverloadedBooleanValue:{}, _isCustomAttributeFunctions:[], isCustomAttribute:function isCustomAttribute(attributeName){for(var i=0; i < DOMProperty._isCustomAttributeFunctions.length; i++) {var isCustomAttributeFn=DOMProperty._isCustomAttributeFunctions[i];if(isCustomAttributeFn(attributeName)){return true;}}return false;}, getDefaultValueForProperty:function getDefaultValueForProperty(nodeName, prop){var nodeDefaults=defaultValueCache[nodeName];var testElement;if(!nodeDefaults){defaultValueCache[nodeName] = nodeDefaults = {};}if(!(prop in nodeDefaults)){testElement = document.createElement(nodeName);nodeDefaults[prop] = testElement[prop];}return nodeDefaults[prop];}, injection:DOMPropertyInjection};module.exports = DOMProperty;}, {"135":135}], 11:[function(_dereq_, module, exports){"use strict";var DOMProperty=_dereq_(10);var quoteAttributeValueForBrowser=_dereq_(147);var warning=_dereq_(154);function shouldIgnoreValue(name, value){return value == null || DOMProperty.hasBooleanValue[name] && !value || DOMProperty.hasNumericValue[name] && isNaN(value) || DOMProperty.hasPositiveNumericValue[name] && value < 1 || DOMProperty.hasOverloadedBooleanValue[name] && value === false;}if("production" !== "development"){var reactProps={children:true, dangerouslySetInnerHTML:true, key:true, ref:true};var warnedProperties={};var warnUnknownProperty=function warnUnknownProperty(name){if(reactProps.hasOwnProperty(name) && reactProps[name] || warnedProperties.hasOwnProperty(name) && warnedProperties[name]){return;}warnedProperties[name] = true;var lowerCasedName=name.toLowerCase();var standardName=DOMProperty.isCustomAttribute(lowerCasedName)?lowerCasedName:DOMProperty.getPossibleStandardName.hasOwnProperty(lowerCasedName)?DOMProperty.getPossibleStandardName[lowerCasedName]:null;"production" !== "development"?warning(standardName == null, "Unknown DOM property %s. Did you mean %s?", name, standardName):null;};}var DOMPropertyOperations={createMarkupForID:function createMarkupForID(id){return DOMProperty.ID_ATTRIBUTE_NAME + "=" + quoteAttributeValueForBrowser(id);}, createMarkupForProperty:function createMarkupForProperty(name, value){if(DOMProperty.isStandardName.hasOwnProperty(name) && DOMProperty.isStandardName[name]){if(shouldIgnoreValue(name, value)){return "";}var attributeName=DOMProperty.getAttributeName[name];if(DOMProperty.hasBooleanValue[name] || DOMProperty.hasOverloadedBooleanValue[name] && value === true){return attributeName;}return attributeName + "=" + quoteAttributeValueForBrowser(value);}else if(DOMProperty.isCustomAttribute(name)){if(value == null){return "";}return name + "=" + quoteAttributeValueForBrowser(value);}else if("production" !== "development"){warnUnknownProperty(name);}return null;}, setValueForProperty:function setValueForProperty(node, name, value){if(DOMProperty.isStandardName.hasOwnProperty(name) && DOMProperty.isStandardName[name]){var mutationMethod=DOMProperty.getMutationMethod[name];if(mutationMethod){mutationMethod(node, value);}else if(shouldIgnoreValue(name, value)){this.deleteValueForProperty(node, name);}else if(DOMProperty.mustUseAttribute[name]){node.setAttribute(DOMProperty.getAttributeName[name], "" + value);}else {var propName=DOMProperty.getPropertyName[name];if(!DOMProperty.hasSideEffects[name] || "" + node[propName] !== "" + value){node[propName] = value;}}}else if(DOMProperty.isCustomAttribute(name)){if(value == null){node.removeAttribute(name);}else {node.setAttribute(name, "" + value);}}else if("production" !== "development"){warnUnknownProperty(name);}}, deleteValueForProperty:function deleteValueForProperty(node, name){if(DOMProperty.isStandardName.hasOwnProperty(name) && DOMProperty.isStandardName[name]){var mutationMethod=DOMProperty.getMutationMethod[name];if(mutationMethod){mutationMethod(node, undefined);}else if(DOMProperty.mustUseAttribute[name]){node.removeAttribute(DOMProperty.getAttributeName[name]);}else {var propName=DOMProperty.getPropertyName[name];var defaultValue=DOMProperty.getDefaultValueForProperty(node.nodeName, propName);if(!DOMProperty.hasSideEffects[name] || "" + node[propName] !== defaultValue){node[propName] = defaultValue;}}}else if(DOMProperty.isCustomAttribute(name)){node.removeAttribute(name);}else if("production" !== "development"){warnUnknownProperty(name);}}};module.exports = DOMPropertyOperations;}, {"10":10, "147":147, "154":154}], 12:[function(_dereq_, module, exports){"use strict";var ExecutionEnvironment=_dereq_(21);var createNodesFromMarkup=_dereq_(112);var emptyFunction=_dereq_(114);var getMarkupWrap=_dereq_(127);var invariant=_dereq_(135);var OPEN_TAG_NAME_EXP=/^(<[^ \/>]+)/;var RESULT_INDEX_ATTR="data-danger-index";function getNodeName(markup){return markup.substring(1, markup.indexOf(" "));}var Danger={dangerouslyRenderMarkup:function dangerouslyRenderMarkup(markupList){"production" !== "development"?invariant(ExecutionEnvironment.canUseDOM, "dangerouslyRenderMarkup(...): Cannot render markup in a worker " + "thread. Make sure `window` and `document` are available globally " + "before requiring React when unit testing or use " + "React.renderToString for server rendering."):invariant(ExecutionEnvironment.canUseDOM);var nodeName;var markupByNodeName={};for(var i=0; i < markupList.length; i++) {"production" !== "development"?invariant(markupList[i], "dangerouslyRenderMarkup(...): Missing markup."):invariant(markupList[i]);nodeName = getNodeName(markupList[i]);nodeName = getMarkupWrap(nodeName)?nodeName:"*";markupByNodeName[nodeName] = markupByNodeName[nodeName] || [];markupByNodeName[nodeName][i] = markupList[i];}var resultList=[];var resultListAssignmentCount=0;for(nodeName in markupByNodeName) {if(!markupByNodeName.hasOwnProperty(nodeName)){continue;}var markupListByNodeName=markupByNodeName[nodeName];var resultIndex;for(resultIndex in markupListByNodeName) {if(markupListByNodeName.hasOwnProperty(resultIndex)){var markup=markupListByNodeName[resultIndex];markupListByNodeName[resultIndex] = markup.replace(OPEN_TAG_NAME_EXP, "$1 " + RESULT_INDEX_ATTR + "=\"" + resultIndex + "\" ");}}var renderNodes=createNodesFromMarkup(markupListByNodeName.join(""), emptyFunction);for(var j=0; j < renderNodes.length; ++j) {var renderNode=renderNodes[j];if(renderNode.hasAttribute && renderNode.hasAttribute(RESULT_INDEX_ATTR)){resultIndex = +renderNode.getAttribute(RESULT_INDEX_ATTR);renderNode.removeAttribute(RESULT_INDEX_ATTR);"production" !== "development"?invariant(!resultList.hasOwnProperty(resultIndex), "Danger: Assigning to an already-occupied result index."):invariant(!resultList.hasOwnProperty(resultIndex));resultList[resultIndex] = renderNode;resultListAssignmentCount += 1;}else if("production" !== "development"){console.error("Danger: Discarding unexpected node:", renderNode);}}}"production" !== "development"?invariant(resultListAssignmentCount === resultList.length, "Danger: Did not assign to every index of resultList."):invariant(resultListAssignmentCount === resultList.length);"production" !== "development"?invariant(resultList.length === markupList.length, "Danger: Expected markup to render %s nodes, but rendered %s.", markupList.length, resultList.length):invariant(resultList.length === markupList.length);return resultList;}, dangerouslyReplaceNodeWithMarkup:function dangerouslyReplaceNodeWithMarkup(oldChild, markup){"production" !== "development"?invariant(ExecutionEnvironment.canUseDOM, "dangerouslyReplaceNodeWithMarkup(...): Cannot render markup in a " + "worker thread. Make sure `window` and `document` are available " + "globally before requiring React when unit testing or use " + "React.renderToString for server rendering."):invariant(ExecutionEnvironment.canUseDOM);"production" !== "development"?invariant(markup, "dangerouslyReplaceNodeWithMarkup(...): Missing markup."):invariant(markup);"production" !== "development"?invariant(oldChild.tagName.toLowerCase() !== "html", "dangerouslyReplaceNodeWithMarkup(...): Cannot replace markup of the " + "<html> node. This is because browser quirks make this unreliable " + "and/or slow. If you want to render to the root you must use " + "server rendering. See React.renderToString()."):invariant(oldChild.tagName.toLowerCase() !== "html");var newChild=createNodesFromMarkup(markup, emptyFunction)[0];oldChild.parentNode.replaceChild(newChild, oldChild);}};module.exports = Danger;}, {"112":112, "114":114, "127":127, "135":135, "21":21}], 13:[function(_dereq_, module, exports){"use strict";var keyOf=_dereq_(141);var DefaultEventPluginOrder=[keyOf({ResponderEventPlugin:null}), keyOf({SimpleEventPlugin:null}), keyOf({TapEventPlugin:null}), keyOf({EnterLeaveEventPlugin:null}), keyOf({ChangeEventPlugin:null}), keyOf({SelectEventPlugin:null}), keyOf({BeforeInputEventPlugin:null}), keyOf({AnalyticsEventPlugin:null}), keyOf({MobileSafariClickEventPlugin:null})];module.exports = DefaultEventPluginOrder;}, {"141":141}], 14:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var EventPropagators=_dereq_(20);var SyntheticMouseEvent=_dereq_(99);var ReactMount=_dereq_(70);var keyOf=_dereq_(141);var topLevelTypes=EventConstants.topLevelTypes;var getFirstReactDOM=ReactMount.getFirstReactDOM;var eventTypes={mouseEnter:{registrationName:keyOf({onMouseEnter:null}), dependencies:[topLevelTypes.topMouseOut, topLevelTypes.topMouseOver]}, mouseLeave:{registrationName:keyOf({onMouseLeave:null}), dependencies:[topLevelTypes.topMouseOut, topLevelTypes.topMouseOver]}};var extractedEvents=[null, null];var EnterLeaveEventPlugin={eventTypes:eventTypes, extractEvents:function extractEvents(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent){if(topLevelType === topLevelTypes.topMouseOver && (nativeEvent.relatedTarget || nativeEvent.fromElement)){return null;}if(topLevelType !== topLevelTypes.topMouseOut && topLevelType !== topLevelTypes.topMouseOver){return null;}var win;if(topLevelTarget.window === topLevelTarget){win = topLevelTarget;}else {var doc=topLevelTarget.ownerDocument;if(doc){win = doc.defaultView || doc.parentWindow;}else {win = window;}}var from, to;if(topLevelType === topLevelTypes.topMouseOut){from = topLevelTarget;to = getFirstReactDOM(nativeEvent.relatedTarget || nativeEvent.toElement) || win;}else {from = win;to = topLevelTarget;}if(from === to){return null;}var fromID=from?ReactMount.getID(from):"";var toID=to?ReactMount.getID(to):"";var leave=SyntheticMouseEvent.getPooled(eventTypes.mouseLeave, fromID, nativeEvent);leave.type = "mouseleave";leave.target = from;leave.relatedTarget = to;var enter=SyntheticMouseEvent.getPooled(eventTypes.mouseEnter, toID, nativeEvent);enter.type = "mouseenter";enter.target = to;enter.relatedTarget = from;EventPropagators.accumulateEnterLeaveDispatches(leave, enter, fromID, toID);extractedEvents[0] = leave;extractedEvents[1] = enter;return extractedEvents;}};module.exports = EnterLeaveEventPlugin;}, {"141":141, "15":15, "20":20, "70":70, "99":99}], 15:[function(_dereq_, module, exports){"use strict";var keyMirror=_dereq_(140);var PropagationPhases=keyMirror({bubbled:null, captured:null});var topLevelTypes=keyMirror({topBlur:null, topChange:null, topClick:null, topCompositionEnd:null, topCompositionStart:null, topCompositionUpdate:null, topContextMenu:null, topCopy:null, topCut:null, topDoubleClick:null, topDrag:null, topDragEnd:null, topDragEnter:null, topDragExit:null, topDragLeave:null, topDragOver:null, topDragStart:null, topDrop:null, topError:null, topFocus:null, topInput:null, topKeyDown:null, topKeyPress:null, topKeyUp:null, topLoad:null, topMouseDown:null, topMouseMove:null, topMouseOut:null, topMouseOver:null, topMouseUp:null, topPaste:null, topReset:null, topScroll:null, topSelectionChange:null, topSubmit:null, topTextInput:null, topTouchCancel:null, topTouchEnd:null, topTouchMove:null, topTouchStart:null, topWheel:null});var EventConstants={topLevelTypes:topLevelTypes, PropagationPhases:PropagationPhases};module.exports = EventConstants;}, {"140":140}], 16:[function(_dereq_, module, exports){var emptyFunction=_dereq_(114);var EventListener={listen:function listen(target, eventType, callback){if(target.addEventListener){target.addEventListener(eventType, callback, false);return {remove:function remove(){target.removeEventListener(eventType, callback, false);}};}else if(target.attachEvent){target.attachEvent("on" + eventType, callback);return {remove:function remove(){target.detachEvent("on" + eventType, callback);}};}}, capture:function capture(target, eventType, callback){if(!target.addEventListener){if("production" !== "development"){console.error("Attempted to listen to events during the capture phase on a " + "browser that does not support the capture phase. Your application " + "will not receive some events.");}return {remove:emptyFunction};}else {target.addEventListener(eventType, callback, true);return {remove:function remove(){target.removeEventListener(eventType, callback, true);}};}}, registerDefault:function registerDefault(){}};module.exports = EventListener;}, {"114":114}], 17:[function(_dereq_, module, exports){"use strict";var EventPluginRegistry=_dereq_(18);var EventPluginUtils=_dereq_(19);var accumulateInto=_dereq_(105);var forEachAccumulated=_dereq_(120);var invariant=_dereq_(135);var listenerBank={};var eventQueue=null;var executeDispatchesAndRelease=function executeDispatchesAndRelease(event){if(event){var executeDispatch=EventPluginUtils.executeDispatch;var PluginModule=EventPluginRegistry.getPluginModuleForEvent(event);if(PluginModule && PluginModule.executeDispatch){executeDispatch = PluginModule.executeDispatch;}EventPluginUtils.executeDispatchesInOrder(event, executeDispatch);if(!event.isPersistent()){event.constructor.release(event);}}};var InstanceHandle=null;function validateInstanceHandle(){var valid=InstanceHandle && InstanceHandle.traverseTwoPhase && InstanceHandle.traverseEnterLeave;"production" !== "development"?invariant(valid, "InstanceHandle not injected before use!"):invariant(valid);}var EventPluginHub={injection:{injectMount:EventPluginUtils.injection.injectMount, injectInstanceHandle:function injectInstanceHandle(InjectedInstanceHandle){InstanceHandle = InjectedInstanceHandle;if("production" !== "development"){validateInstanceHandle();}}, getInstanceHandle:function getInstanceHandle(){if("production" !== "development"){validateInstanceHandle();}return InstanceHandle;}, injectEventPluginOrder:EventPluginRegistry.injectEventPluginOrder, injectEventPluginsByName:EventPluginRegistry.injectEventPluginsByName}, eventNameDispatchConfigs:EventPluginRegistry.eventNameDispatchConfigs, registrationNameModules:EventPluginRegistry.registrationNameModules, putListener:function putListener(id, registrationName, listener){"production" !== "development"?invariant(!listener || typeof listener === "function", "Expected %s listener to be a function, instead got type %s", registrationName, typeof listener):invariant(!listener || typeof listener === "function");var bankForRegistrationName=listenerBank[registrationName] || (listenerBank[registrationName] = {});bankForRegistrationName[id] = listener;}, getListener:function getListener(id, registrationName){var bankForRegistrationName=listenerBank[registrationName];return bankForRegistrationName && bankForRegistrationName[id];}, deleteListener:function deleteListener(id, registrationName){var bankForRegistrationName=listenerBank[registrationName];if(bankForRegistrationName){delete bankForRegistrationName[id];}}, deleteAllListeners:function deleteAllListeners(id){for(var registrationName in listenerBank) {delete listenerBank[registrationName][id];}}, extractEvents:function extractEvents(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent){var events;var plugins=EventPluginRegistry.plugins;for(var i=0, l=plugins.length; i < l; i++) {var possiblePlugin=plugins[i];if(possiblePlugin){var extractedEvents=possiblePlugin.extractEvents(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent);if(extractedEvents){events = accumulateInto(events, extractedEvents);}}}return events;}, enqueueEvents:function enqueueEvents(events){if(events){eventQueue = accumulateInto(eventQueue, events);}}, processEventQueue:function processEventQueue(){var processingEventQueue=eventQueue;eventQueue = null;forEachAccumulated(processingEventQueue, executeDispatchesAndRelease);"production" !== "development"?invariant(!eventQueue, "processEventQueue(): Additional events were enqueued while processing " + "an event queue. Support for this has not yet been implemented."):invariant(!eventQueue);}, __purge:function __purge(){listenerBank = {};}, __getListenerBank:function __getListenerBank(){return listenerBank;}};module.exports = EventPluginHub;}, {"105":105, "120":120, "135":135, "18":18, "19":19}], 18:[function(_dereq_, module, exports){"use strict";var invariant=_dereq_(135);var EventPluginOrder=null;var namesToPlugins={};function recomputePluginOrdering(){if(!EventPluginOrder){return;}for(var pluginName in namesToPlugins) {var PluginModule=namesToPlugins[pluginName];var pluginIndex=EventPluginOrder.indexOf(pluginName);"production" !== "development"?invariant(pluginIndex > -1, "EventPluginRegistry: Cannot inject event plugins that do not exist in " + "the plugin ordering, `%s`.", pluginName):invariant(pluginIndex > -1);if(EventPluginRegistry.plugins[pluginIndex]){continue;}"production" !== "development"?invariant(PluginModule.extractEvents, "EventPluginRegistry: Event plugins must implement an `extractEvents` " + "method, but `%s` does not.", pluginName):invariant(PluginModule.extractEvents);EventPluginRegistry.plugins[pluginIndex] = PluginModule;var publishedEvents=PluginModule.eventTypes;for(var eventName in publishedEvents) {"production" !== "development"?invariant(publishEventForPlugin(publishedEvents[eventName], PluginModule, eventName), "EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.", eventName, pluginName):invariant(publishEventForPlugin(publishedEvents[eventName], PluginModule, eventName));}}}function publishEventForPlugin(dispatchConfig, PluginModule, eventName){"production" !== "development"?invariant(!EventPluginRegistry.eventNameDispatchConfigs.hasOwnProperty(eventName), "EventPluginHub: More than one plugin attempted to publish the same " + "event name, `%s`.", eventName):invariant(!EventPluginRegistry.eventNameDispatchConfigs.hasOwnProperty(eventName));EventPluginRegistry.eventNameDispatchConfigs[eventName] = dispatchConfig;var phasedRegistrationNames=dispatchConfig.phasedRegistrationNames;if(phasedRegistrationNames){for(var phaseName in phasedRegistrationNames) {if(phasedRegistrationNames.hasOwnProperty(phaseName)){var phasedRegistrationName=phasedRegistrationNames[phaseName];publishRegistrationName(phasedRegistrationName, PluginModule, eventName);}}return true;}else if(dispatchConfig.registrationName){publishRegistrationName(dispatchConfig.registrationName, PluginModule, eventName);return true;}return false;}function publishRegistrationName(registrationName, PluginModule, eventName){"production" !== "development"?invariant(!EventPluginRegistry.registrationNameModules[registrationName], "EventPluginHub: More than one plugin attempted to publish the same " + "registration name, `%s`.", registrationName):invariant(!EventPluginRegistry.registrationNameModules[registrationName]);EventPluginRegistry.registrationNameModules[registrationName] = PluginModule;EventPluginRegistry.registrationNameDependencies[registrationName] = PluginModule.eventTypes[eventName].dependencies;}var EventPluginRegistry={plugins:[], eventNameDispatchConfigs:{}, registrationNameModules:{}, registrationNameDependencies:{}, injectEventPluginOrder:function injectEventPluginOrder(InjectedEventPluginOrder){"production" !== "development"?invariant(!EventPluginOrder, "EventPluginRegistry: Cannot inject event plugin ordering more than " + "once. You are likely trying to load more than one copy of React."):invariant(!EventPluginOrder);EventPluginOrder = Array.prototype.slice.call(InjectedEventPluginOrder);recomputePluginOrdering();}, injectEventPluginsByName:function injectEventPluginsByName(injectedNamesToPlugins){var isOrderingDirty=false;for(var pluginName in injectedNamesToPlugins) {if(!injectedNamesToPlugins.hasOwnProperty(pluginName)){continue;}var PluginModule=injectedNamesToPlugins[pluginName];if(!namesToPlugins.hasOwnProperty(pluginName) || namesToPlugins[pluginName] !== PluginModule){"production" !== "development"?invariant(!namesToPlugins[pluginName], "EventPluginRegistry: Cannot inject two different event plugins " + "using the same name, `%s`.", pluginName):invariant(!namesToPlugins[pluginName]);namesToPlugins[pluginName] = PluginModule;isOrderingDirty = true;}}if(isOrderingDirty){recomputePluginOrdering();}}, getPluginModuleForEvent:function getPluginModuleForEvent(event){var dispatchConfig=event.dispatchConfig;if(dispatchConfig.registrationName){return EventPluginRegistry.registrationNameModules[dispatchConfig.registrationName] || null;}for(var phase in dispatchConfig.phasedRegistrationNames) {if(!dispatchConfig.phasedRegistrationNames.hasOwnProperty(phase)){continue;}var PluginModule=EventPluginRegistry.registrationNameModules[dispatchConfig.phasedRegistrationNames[phase]];if(PluginModule){return PluginModule;}}return null;}, _resetEventPlugins:function _resetEventPlugins(){EventPluginOrder = null;for(var pluginName in namesToPlugins) {if(namesToPlugins.hasOwnProperty(pluginName)){delete namesToPlugins[pluginName];}}EventPluginRegistry.plugins.length = 0;var eventNameDispatchConfigs=EventPluginRegistry.eventNameDispatchConfigs;for(var eventName in eventNameDispatchConfigs) {if(eventNameDispatchConfigs.hasOwnProperty(eventName)){delete eventNameDispatchConfigs[eventName];}}var registrationNameModules=EventPluginRegistry.registrationNameModules;for(var registrationName in registrationNameModules) {if(registrationNameModules.hasOwnProperty(registrationName)){delete registrationNameModules[registrationName];}}}};module.exports = EventPluginRegistry;}, {"135":135}], 19:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var invariant=_dereq_(135);var injection={Mount:null, injectMount:function injectMount(InjectedMount){injection.Mount = InjectedMount;if("production" !== "development"){"production" !== "development"?invariant(InjectedMount && InjectedMount.getNode, "EventPluginUtils.injection.injectMount(...): Injected Mount module " + "is missing getNode."):invariant(InjectedMount && InjectedMount.getNode);}}};var topLevelTypes=EventConstants.topLevelTypes;function isEndish(topLevelType){return topLevelType === topLevelTypes.topMouseUp || topLevelType === topLevelTypes.topTouchEnd || topLevelType === topLevelTypes.topTouchCancel;}function isMoveish(topLevelType){return topLevelType === topLevelTypes.topMouseMove || topLevelType === topLevelTypes.topTouchMove;}function isStartish(topLevelType){return topLevelType === topLevelTypes.topMouseDown || topLevelType === topLevelTypes.topTouchStart;}var validateEventDispatches;if("production" !== "development"){validateEventDispatches = function(event){var dispatchListeners=event._dispatchListeners;var dispatchIDs=event._dispatchIDs;var listenersIsArr=Array.isArray(dispatchListeners);var idsIsArr=Array.isArray(dispatchIDs);var IDsLen=idsIsArr?dispatchIDs.length:dispatchIDs?1:0;var listenersLen=listenersIsArr?dispatchListeners.length:dispatchListeners?1:0;"production" !== "development"?invariant(idsIsArr === listenersIsArr && IDsLen === listenersLen, "EventPluginUtils: Invalid `event`."):invariant(idsIsArr === listenersIsArr && IDsLen === listenersLen);};}function forEachEventDispatch(event, cb){var dispatchListeners=event._dispatchListeners;var dispatchIDs=event._dispatchIDs;if("production" !== "development"){validateEventDispatches(event);}if(Array.isArray(dispatchListeners)){for(var i=0; i < dispatchListeners.length; i++) {if(event.isPropagationStopped()){break;}cb(event, dispatchListeners[i], dispatchIDs[i]);}}else if(dispatchListeners){cb(event, dispatchListeners, dispatchIDs);}}function executeDispatch(event, listener, domID){event.currentTarget = injection.Mount.getNode(domID);var returnValue=listener(event, domID);event.currentTarget = null;return returnValue;}function executeDispatchesInOrder(event, cb){forEachEventDispatch(event, cb);event._dispatchListeners = null;event._dispatchIDs = null;}function executeDispatchesInOrderStopAtTrueImpl(event){var dispatchListeners=event._dispatchListeners;var dispatchIDs=event._dispatchIDs;if("production" !== "development"){validateEventDispatches(event);}if(Array.isArray(dispatchListeners)){for(var i=0; i < dispatchListeners.length; i++) {if(event.isPropagationStopped()){break;}if(dispatchListeners[i](event, dispatchIDs[i])){return dispatchIDs[i];}}}else if(dispatchListeners){if(dispatchListeners(event, dispatchIDs)){return dispatchIDs;}}return null;}function executeDispatchesInOrderStopAtTrue(event){var ret=executeDispatchesInOrderStopAtTrueImpl(event);event._dispatchIDs = null;event._dispatchListeners = null;return ret;}function executeDirectDispatch(event){if("production" !== "development"){validateEventDispatches(event);}var dispatchListener=event._dispatchListeners;var dispatchID=event._dispatchIDs;"production" !== "development"?invariant(!Array.isArray(dispatchListener), "executeDirectDispatch(...): Invalid `event`."):invariant(!Array.isArray(dispatchListener));var res=dispatchListener?dispatchListener(event, dispatchID):null;event._dispatchListeners = null;event._dispatchIDs = null;return res;}function hasDispatches(event){return !!event._dispatchListeners;}var EventPluginUtils={isEndish:isEndish, isMoveish:isMoveish, isStartish:isStartish, executeDirectDispatch:executeDirectDispatch, executeDispatch:executeDispatch, executeDispatchesInOrder:executeDispatchesInOrder, executeDispatchesInOrderStopAtTrue:executeDispatchesInOrderStopAtTrue, hasDispatches:hasDispatches, injection:injection, useTouchEvents:false};module.exports = EventPluginUtils;}, {"135":135, "15":15}], 20:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var EventPluginHub=_dereq_(17);var accumulateInto=_dereq_(105);var forEachAccumulated=_dereq_(120);var PropagationPhases=EventConstants.PropagationPhases;var getListener=EventPluginHub.getListener;function listenerAtPhase(id, event, propagationPhase){var registrationName=event.dispatchConfig.phasedRegistrationNames[propagationPhase];return getListener(id, registrationName);}function accumulateDirectionalDispatches(domID, upwards, event){if("production" !== "development"){if(!domID){throw new Error("Dispatching id must not be null");}}var phase=upwards?PropagationPhases.bubbled:PropagationPhases.captured;var listener=listenerAtPhase(domID, event, phase);if(listener){event._dispatchListeners = accumulateInto(event._dispatchListeners, listener);event._dispatchIDs = accumulateInto(event._dispatchIDs, domID);}}function accumulateTwoPhaseDispatchesSingle(event){if(event && event.dispatchConfig.phasedRegistrationNames){EventPluginHub.injection.getInstanceHandle().traverseTwoPhase(event.dispatchMarker, accumulateDirectionalDispatches, event);}}function accumulateDispatches(id, ignoredDirection, event){if(event && event.dispatchConfig.registrationName){var registrationName=event.dispatchConfig.registrationName;var listener=getListener(id, registrationName);if(listener){event._dispatchListeners = accumulateInto(event._dispatchListeners, listener);event._dispatchIDs = accumulateInto(event._dispatchIDs, id);}}}function accumulateDirectDispatchesSingle(event){if(event && event.dispatchConfig.registrationName){accumulateDispatches(event.dispatchMarker, null, event);}}function accumulateTwoPhaseDispatches(events){forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);}function accumulateEnterLeaveDispatches(leave, enter, fromID, toID){EventPluginHub.injection.getInstanceHandle().traverseEnterLeave(fromID, toID, accumulateDispatches, leave, enter);}function accumulateDirectDispatches(events){forEachAccumulated(events, accumulateDirectDispatchesSingle);}var EventPropagators={accumulateTwoPhaseDispatches:accumulateTwoPhaseDispatches, accumulateDirectDispatches:accumulateDirectDispatches, accumulateEnterLeaveDispatches:accumulateEnterLeaveDispatches};module.exports = EventPropagators;}, {"105":105, "120":120, "15":15, "17":17}], 21:[function(_dereq_, module, exports){"use strict";var canUseDOM=!!(typeof window !== "undefined" && window.document && window.document.createElement);var ExecutionEnvironment={canUseDOM:canUseDOM, canUseWorkers:typeof Worker !== "undefined", canUseEventListeners:canUseDOM && !!(window.addEventListener || window.attachEvent), canUseViewport:canUseDOM && !!window.screen, isInWorker:!canUseDOM};module.exports = ExecutionEnvironment;}, {}], 22:[function(_dereq_, module, exports){"use strict";var PooledClass=_dereq_(28);var assign=_dereq_(27);var getTextContentAccessor=_dereq_(130);function FallbackCompositionState(root){this._root = root;this._startText = this.getText();this._fallbackText = null;}assign(FallbackCompositionState.prototype, {getText:function getText(){if("value" in this._root){return this._root.value;}return this._root[getTextContentAccessor()];}, getData:function getData(){if(this._fallbackText){return this._fallbackText;}var start;var startValue=this._startText;var startLength=startValue.length;var end;var endValue=this.getText();var endLength=endValue.length;for(start = 0; start < startLength; start++) {if(startValue[start] !== endValue[start]){break;}}var minEnd=startLength - start;for(end = 1; end <= minEnd; end++) {if(startValue[startLength - end] !== endValue[endLength - end]){break;}}var sliceTail=end > 1?1 - end:undefined;this._fallbackText = endValue.slice(start, sliceTail);return this._fallbackText;}});PooledClass.addPoolingTo(FallbackCompositionState);module.exports = FallbackCompositionState;}, {"130":130, "27":27, "28":28}], 23:[function(_dereq_, module, exports){"use strict";var DOMProperty=_dereq_(10);var ExecutionEnvironment=_dereq_(21);var MUST_USE_ATTRIBUTE=DOMProperty.injection.MUST_USE_ATTRIBUTE;var MUST_USE_PROPERTY=DOMProperty.injection.MUST_USE_PROPERTY;var HAS_BOOLEAN_VALUE=DOMProperty.injection.HAS_BOOLEAN_VALUE;var HAS_SIDE_EFFECTS=DOMProperty.injection.HAS_SIDE_EFFECTS;var HAS_NUMERIC_VALUE=DOMProperty.injection.HAS_NUMERIC_VALUE;var HAS_POSITIVE_NUMERIC_VALUE=DOMProperty.injection.HAS_POSITIVE_NUMERIC_VALUE;var HAS_OVERLOADED_BOOLEAN_VALUE=DOMProperty.injection.HAS_OVERLOADED_BOOLEAN_VALUE;var hasSVG;if(ExecutionEnvironment.canUseDOM){var implementation=document.implementation;hasSVG = implementation && implementation.hasFeature && implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");}var HTMLDOMPropertyConfig={isCustomAttribute:RegExp.prototype.test.bind(/^(data|aria)-[a-z_][a-z\d_.\-]*$/), Properties:{accept:null, acceptCharset:null, accessKey:null, action:null, allowFullScreen:MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE, allowTransparency:MUST_USE_ATTRIBUTE, alt:null, async:HAS_BOOLEAN_VALUE, autoComplete:null, autoPlay:HAS_BOOLEAN_VALUE, cellPadding:null, cellSpacing:null, charSet:MUST_USE_ATTRIBUTE, checked:MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE, classID:MUST_USE_ATTRIBUTE, className:hasSVG?MUST_USE_ATTRIBUTE:MUST_USE_PROPERTY, cols:MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE, colSpan:null, content:null, contentEditable:null, contextMenu:MUST_USE_ATTRIBUTE, controls:MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE, coords:null, crossOrigin:null, data:null, dateTime:MUST_USE_ATTRIBUTE, defer:HAS_BOOLEAN_VALUE, dir:null, disabled:MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE, download:HAS_OVERLOADED_BOOLEAN_VALUE, draggable:null, encType:null, form:MUST_USE_ATTRIBUTE, formAction:MUST_USE_ATTRIBUTE, formEncType:MUST_USE_ATTRIBUTE, formMethod:MUST_USE_ATTRIBUTE, formNoValidate:HAS_BOOLEAN_VALUE, formTarget:MUST_USE_ATTRIBUTE, frameBorder:MUST_USE_ATTRIBUTE, headers:null, height:MUST_USE_ATTRIBUTE, hidden:MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE, high:null, href:null, hrefLang:null, htmlFor:null, httpEquiv:null, icon:null, id:MUST_USE_PROPERTY, label:null, lang:null, list:MUST_USE_ATTRIBUTE, loop:MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE, low:null, manifest:MUST_USE_ATTRIBUTE, marginHeight:null, marginWidth:null, max:null, maxLength:MUST_USE_ATTRIBUTE, media:MUST_USE_ATTRIBUTE, mediaGroup:null, method:null, min:null, multiple:MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE, muted:MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE, name:null, noValidate:HAS_BOOLEAN_VALUE, open:HAS_BOOLEAN_VALUE, optimum:null, pattern:null, placeholder:null, poster:null, preload:null, radioGroup:null, readOnly:MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE, rel:null, required:HAS_BOOLEAN_VALUE, role:MUST_USE_ATTRIBUTE, rows:MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE, rowSpan:null, sandbox:null, scope:null, scoped:HAS_BOOLEAN_VALUE, scrolling:null, seamless:MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE, selected:MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE, shape:null, size:MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE, sizes:MUST_USE_ATTRIBUTE, span:HAS_POSITIVE_NUMERIC_VALUE, spellCheck:null, src:null, srcDoc:MUST_USE_PROPERTY, srcSet:MUST_USE_ATTRIBUTE, start:HAS_NUMERIC_VALUE, step:null, style:null, tabIndex:null, target:null, title:null, type:null, useMap:null, value:MUST_USE_PROPERTY | HAS_SIDE_EFFECTS, width:MUST_USE_ATTRIBUTE, wmode:MUST_USE_ATTRIBUTE, autoCapitalize:null, autoCorrect:null, itemProp:MUST_USE_ATTRIBUTE, itemScope:MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE, itemType:MUST_USE_ATTRIBUTE, itemID:MUST_USE_ATTRIBUTE, itemRef:MUST_USE_ATTRIBUTE, property:null, unselectable:MUST_USE_ATTRIBUTE}, DOMAttributeNames:{acceptCharset:"accept-charset", className:"class", htmlFor:"for", httpEquiv:"http-equiv"}, DOMPropertyNames:{autoCapitalize:"autocapitalize", autoComplete:"autocomplete", autoCorrect:"autocorrect", autoFocus:"autofocus", autoPlay:"autoplay", encType:"encoding", hrefLang:"hreflang", radioGroup:"radiogroup", spellCheck:"spellcheck", srcDoc:"srcdoc", srcSet:"srcset"}};module.exports = HTMLDOMPropertyConfig;}, {"10":10, "21":21}], 24:[function(_dereq_, module, exports){"use strict";var ReactPropTypes=_dereq_(78);var invariant=_dereq_(135);var hasReadOnlyValue={"button":true, "checkbox":true, "image":true, "hidden":true, "radio":true, "reset":true, "submit":true};function _assertSingleLink(input){"production" !== "development"?invariant(input.props.checkedLink == null || input.props.valueLink == null, "Cannot provide a checkedLink and a valueLink. If you want to use " + "checkedLink, you probably don't want to use valueLink and vice versa."):invariant(input.props.checkedLink == null || input.props.valueLink == null);}function _assertValueLink(input){_assertSingleLink(input);"production" !== "development"?invariant(input.props.value == null && input.props.onChange == null, "Cannot provide a valueLink and a value or onChange event. If you want " + "to use value or onChange, you probably don't want to use valueLink."):invariant(input.props.value == null && input.props.onChange == null);}function _assertCheckedLink(input){_assertSingleLink(input);"production" !== "development"?invariant(input.props.checked == null && input.props.onChange == null, "Cannot provide a checkedLink and a checked property or onChange event. " + "If you want to use checked or onChange, you probably don't want to " + "use checkedLink"):invariant(input.props.checked == null && input.props.onChange == null);}function _handleLinkedValueChange(e){this.props.valueLink.requestChange(e.target.value);}function _handleLinkedCheckChange(e){this.props.checkedLink.requestChange(e.target.checked);}var LinkedValueUtils={Mixin:{propTypes:{value:function value(props, propName, componentName){if(!props[propName] || hasReadOnlyValue[props.type] || props.onChange || props.readOnly || props.disabled){return null;}return new Error("You provided a `value` prop to a form field without an " + "`onChange` handler. This will render a read-only field. If " + "the field should be mutable use `defaultValue`. Otherwise, " + "set either `onChange` or `readOnly`.");}, checked:function checked(props, propName, componentName){if(!props[propName] || props.onChange || props.readOnly || props.disabled){return null;}return new Error("You provided a `checked` prop to a form field without an " + "`onChange` handler. This will render a read-only field. If " + "the field should be mutable use `defaultChecked`. Otherwise, " + "set either `onChange` or `readOnly`.");}, onChange:ReactPropTypes.func}}, getValue:function getValue(input){if(input.props.valueLink){_assertValueLink(input);return input.props.valueLink.value;}return input.props.value;}, getChecked:function getChecked(input){if(input.props.checkedLink){_assertCheckedLink(input);return input.props.checkedLink.value;}return input.props.checked;}, getOnChange:function getOnChange(input){if(input.props.valueLink){_assertValueLink(input);return _handleLinkedValueChange;}else if(input.props.checkedLink){_assertCheckedLink(input);return _handleLinkedCheckChange;}return input.props.onChange;}};module.exports = LinkedValueUtils;}, {"135":135, "78":78}], 25:[function(_dereq_, module, exports){"use strict";var ReactBrowserEventEmitter=_dereq_(30);var accumulateInto=_dereq_(105);var forEachAccumulated=_dereq_(120);var invariant=_dereq_(135);function remove(event){event.remove();}var LocalEventTrapMixin={trapBubbledEvent:function trapBubbledEvent(topLevelType, handlerBaseName){"production" !== "development"?invariant(this.isMounted(), "Must be mounted to trap events"):invariant(this.isMounted());var node=this.getDOMNode();"production" !== "development"?invariant(node, "LocalEventTrapMixin.trapBubbledEvent(...): Requires node to be rendered."):invariant(node);var listener=ReactBrowserEventEmitter.trapBubbledEvent(topLevelType, handlerBaseName, node);this._localEventListeners = accumulateInto(this._localEventListeners, listener);}, componentWillUnmount:function componentWillUnmount(){if(this._localEventListeners){forEachAccumulated(this._localEventListeners, remove);}}};module.exports = LocalEventTrapMixin;}, {"105":105, "120":120, "135":135, "30":30}], 26:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var emptyFunction=_dereq_(114);var topLevelTypes=EventConstants.topLevelTypes;var MobileSafariClickEventPlugin={eventTypes:null, extractEvents:function extractEvents(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent){if(topLevelType === topLevelTypes.topTouchStart){var target=nativeEvent.target;if(target && !target.onclick){target.onclick = emptyFunction;}}}};module.exports = MobileSafariClickEventPlugin;}, {"114":114, "15":15}], 27:[function(_dereq_, module, exports){"use strict";function assign(target, sources){if(target == null){throw new TypeError("Object.assign target cannot be null or undefined");}var to=Object(target);var hasOwnProperty=Object.prototype.hasOwnProperty;for(var nextIndex=1; nextIndex < arguments.length; nextIndex++) {var nextSource=arguments[nextIndex];if(nextSource == null){continue;}var from=Object(nextSource);for(var key in from) {if(hasOwnProperty.call(from, key)){to[key] = from[key];}}}return to;}module.exports = assign;}, {}], 28:[function(_dereq_, module, exports){"use strict";var invariant=_dereq_(135);var oneArgumentPooler=function oneArgumentPooler(copyFieldsFrom){var Klass=this;if(Klass.instancePool.length){var instance=Klass.instancePool.pop();Klass.call(instance, copyFieldsFrom);return instance;}else {return new Klass(copyFieldsFrom);}};var twoArgumentPooler=function twoArgumentPooler(a1, a2){var Klass=this;if(Klass.instancePool.length){var instance=Klass.instancePool.pop();Klass.call(instance, a1, a2);return instance;}else {return new Klass(a1, a2);}};var threeArgumentPooler=function threeArgumentPooler(a1, a2, a3){var Klass=this;if(Klass.instancePool.length){var instance=Klass.instancePool.pop();Klass.call(instance, a1, a2, a3);return instance;}else {return new Klass(a1, a2, a3);}};var fiveArgumentPooler=function fiveArgumentPooler(a1, a2, a3, a4, a5){var Klass=this;if(Klass.instancePool.length){var instance=Klass.instancePool.pop();Klass.call(instance, a1, a2, a3, a4, a5);return instance;}else {return new Klass(a1, a2, a3, a4, a5);}};var standardReleaser=function standardReleaser(instance){var Klass=this;"production" !== "development"?invariant(instance instanceof Klass, "Trying to release an instance into a pool of a different type."):invariant(instance instanceof Klass);if(instance.destructor){instance.destructor();}if(Klass.instancePool.length < Klass.poolSize){Klass.instancePool.push(instance);}};var DEFAULT_POOL_SIZE=10;var DEFAULT_POOLER=oneArgumentPooler;var addPoolingTo=function addPoolingTo(CopyConstructor, pooler){var NewKlass=CopyConstructor;NewKlass.instancePool = [];NewKlass.getPooled = pooler || DEFAULT_POOLER;if(!NewKlass.poolSize){NewKlass.poolSize = DEFAULT_POOL_SIZE;}NewKlass.release = standardReleaser;return NewKlass;};var PooledClass={addPoolingTo:addPoolingTo, oneArgumentPooler:oneArgumentPooler, twoArgumentPooler:twoArgumentPooler, threeArgumentPooler:threeArgumentPooler, fiveArgumentPooler:fiveArgumentPooler};module.exports = PooledClass;}, {"135":135}], 29:[function(_dereq_, module, exports){"use strict";var findDOMNode=_dereq_(117);var ReactBrowserComponentMixin={getDOMNode:function getDOMNode(){return findDOMNode(this);}};module.exports = ReactBrowserComponentMixin;}, {"117":117}], 30:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var EventPluginHub=_dereq_(17);var EventPluginRegistry=_dereq_(18);var ReactEventEmitterMixin=_dereq_(61);var ViewportMetrics=_dereq_(104);var assign=_dereq_(27);var isEventSupported=_dereq_(136);var alreadyListeningTo={};var isMonitoringScrollValue=false;var reactTopListenersCounter=0;var topEventMapping={topBlur:"blur", topChange:"change", topClick:"click", topCompositionEnd:"compositionend", topCompositionStart:"compositionstart", topCompositionUpdate:"compositionupdate", topContextMenu:"contextmenu", topCopy:"copy", topCut:"cut", topDoubleClick:"dblclick", topDrag:"drag", topDragEnd:"dragend", topDragEnter:"dragenter", topDragExit:"dragexit", topDragLeave:"dragleave", topDragOver:"dragover", topDragStart:"dragstart", topDrop:"drop", topFocus:"focus", topInput:"input", topKeyDown:"keydown", topKeyPress:"keypress", topKeyUp:"keyup", topMouseDown:"mousedown", topMouseMove:"mousemove", topMouseOut:"mouseout", topMouseOver:"mouseover", topMouseUp:"mouseup", topPaste:"paste", topScroll:"scroll", topSelectionChange:"selectionchange", topTextInput:"textInput", topTouchCancel:"touchcancel", topTouchEnd:"touchend", topTouchMove:"touchmove", topTouchStart:"touchstart", topWheel:"wheel"};var topListenersIDKey="_reactListenersID" + String(Math.random()).slice(2);function getListeningForDocument(mountAt){if(!Object.prototype.hasOwnProperty.call(mountAt, topListenersIDKey)){mountAt[topListenersIDKey] = reactTopListenersCounter++;alreadyListeningTo[mountAt[topListenersIDKey]] = {};}return alreadyListeningTo[mountAt[topListenersIDKey]];}var ReactBrowserEventEmitter=assign({}, ReactEventEmitterMixin, {ReactEventListener:null, injection:{injectReactEventListener:function injectReactEventListener(ReactEventListener){ReactEventListener.setHandleTopLevel(ReactBrowserEventEmitter.handleTopLevel);ReactBrowserEventEmitter.ReactEventListener = ReactEventListener;}}, setEnabled:function setEnabled(enabled){if(ReactBrowserEventEmitter.ReactEventListener){ReactBrowserEventEmitter.ReactEventListener.setEnabled(enabled);}}, isEnabled:function isEnabled(){return !!(ReactBrowserEventEmitter.ReactEventListener && ReactBrowserEventEmitter.ReactEventListener.isEnabled());}, listenTo:function listenTo(registrationName, contentDocumentHandle){var mountAt=contentDocumentHandle;var isListening=getListeningForDocument(mountAt);var dependencies=EventPluginRegistry.registrationNameDependencies[registrationName];var topLevelTypes=EventConstants.topLevelTypes;for(var i=0, l=dependencies.length; i < l; i++) {var dependency=dependencies[i];if(!(isListening.hasOwnProperty(dependency) && isListening[dependency])){if(dependency === topLevelTypes.topWheel){if(isEventSupported("wheel")){ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topWheel, "wheel", mountAt);}else if(isEventSupported("mousewheel")){ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topWheel, "mousewheel", mountAt);}else {ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topWheel, "DOMMouseScroll", mountAt);}}else if(dependency === topLevelTypes.topScroll){if(isEventSupported("scroll", true)){ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(topLevelTypes.topScroll, "scroll", mountAt);}else {ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topScroll, "scroll", ReactBrowserEventEmitter.ReactEventListener.WINDOW_HANDLE);}}else if(dependency === topLevelTypes.topFocus || dependency === topLevelTypes.topBlur){if(isEventSupported("focus", true)){ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(topLevelTypes.topFocus, "focus", mountAt);ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(topLevelTypes.topBlur, "blur", mountAt);}else if(isEventSupported("focusin")){ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topFocus, "focusin", mountAt);ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topBlur, "focusout", mountAt);}isListening[topLevelTypes.topBlur] = true;isListening[topLevelTypes.topFocus] = true;}else if(topEventMapping.hasOwnProperty(dependency)){ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(dependency, topEventMapping[dependency], mountAt);}isListening[dependency] = true;}}}, trapBubbledEvent:function trapBubbledEvent(topLevelType, handlerBaseName, handle){return ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelType, handlerBaseName, handle);}, trapCapturedEvent:function trapCapturedEvent(topLevelType, handlerBaseName, handle){return ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(topLevelType, handlerBaseName, handle);}, ensureScrollValueMonitoring:function ensureScrollValueMonitoring(){if(!isMonitoringScrollValue){var refresh=ViewportMetrics.refreshScrollValues;ReactBrowserEventEmitter.ReactEventListener.monitorScrollValue(refresh);isMonitoringScrollValue = true;}}, eventNameDispatchConfigs:EventPluginHub.eventNameDispatchConfigs, registrationNameModules:EventPluginHub.registrationNameModules, putListener:EventPluginHub.putListener, getListener:EventPluginHub.getListener, deleteListener:EventPluginHub.deleteListener, deleteAllListeners:EventPluginHub.deleteAllListeners});module.exports = ReactBrowserEventEmitter;}, {"104":104, "136":136, "15":15, "17":17, "18":18, "27":27, "61":61}], 31:[function(_dereq_, module, exports){"use strict";var ReactReconciler=_dereq_(81);var flattenChildren=_dereq_(118);var instantiateReactComponent=_dereq_(134);var shouldUpdateReactComponent=_dereq_(151);var ReactChildReconciler={instantiateChildren:function instantiateChildren(nestedChildNodes, transaction, context){var children=flattenChildren(nestedChildNodes);for(var name in children) {if(children.hasOwnProperty(name)){var child=children[name];var childInstance=instantiateReactComponent(child, null);children[name] = childInstance;}}return children;}, updateChildren:function updateChildren(prevChildren, nextNestedChildNodes, transaction, context){var nextChildren=flattenChildren(nextNestedChildNodes);if(!nextChildren && !prevChildren){return null;}var name;for(name in nextChildren) {if(!nextChildren.hasOwnProperty(name)){continue;}var prevChild=prevChildren && prevChildren[name];var prevElement=prevChild && prevChild._currentElement;var nextElement=nextChildren[name];if(shouldUpdateReactComponent(prevElement, nextElement)){ReactReconciler.receiveComponent(prevChild, nextElement, transaction, context);nextChildren[name] = prevChild;}else {if(prevChild){ReactReconciler.unmountComponent(prevChild, name);}var nextChildInstance=instantiateReactComponent(nextElement, null);nextChildren[name] = nextChildInstance;}}for(name in prevChildren) {if(prevChildren.hasOwnProperty(name) && !(nextChildren && nextChildren.hasOwnProperty(name))){ReactReconciler.unmountComponent(prevChildren[name]);}}return nextChildren;}, unmountChildren:function unmountChildren(renderedChildren){for(var name in renderedChildren) {var renderedChild=renderedChildren[name];ReactReconciler.unmountComponent(renderedChild);}}};module.exports = ReactChildReconciler;}, {"118":118, "134":134, "151":151, "81":81}], 32:[function(_dereq_, module, exports){"use strict";var PooledClass=_dereq_(28);var ReactFragment=_dereq_(63);var traverseAllChildren=_dereq_(153);var warning=_dereq_(154);var twoArgumentPooler=PooledClass.twoArgumentPooler;var threeArgumentPooler=PooledClass.threeArgumentPooler;function ForEachBookKeeping(forEachFunction, forEachContext){this.forEachFunction = forEachFunction;this.forEachContext = forEachContext;}PooledClass.addPoolingTo(ForEachBookKeeping, twoArgumentPooler);function forEachSingleChild(traverseContext, child, name, i){var forEachBookKeeping=traverseContext;forEachBookKeeping.forEachFunction.call(forEachBookKeeping.forEachContext, child, i);}function forEachChildren(children, forEachFunc, forEachContext){if(children == null){return children;}var traverseContext=ForEachBookKeeping.getPooled(forEachFunc, forEachContext);traverseAllChildren(children, forEachSingleChild, traverseContext);ForEachBookKeeping.release(traverseContext);}function MapBookKeeping(mapResult, mapFunction, mapContext){this.mapResult = mapResult;this.mapFunction = mapFunction;this.mapContext = mapContext;}PooledClass.addPoolingTo(MapBookKeeping, threeArgumentPooler);function mapSingleChildIntoContext(traverseContext, child, name, i){var mapBookKeeping=traverseContext;var mapResult=mapBookKeeping.mapResult;var keyUnique=!mapResult.hasOwnProperty(name);if("production" !== "development"){"production" !== "development"?warning(keyUnique, "ReactChildren.map(...): Encountered two children with the same key, " + "`%s`. Child keys must be unique; when two children share a key, only " + "the first child will be used.", name):null;}if(keyUnique){var mappedChild=mapBookKeeping.mapFunction.call(mapBookKeeping.mapContext, child, i);mapResult[name] = mappedChild;}}function mapChildren(children, func, context){if(children == null){return children;}var mapResult={};var traverseContext=MapBookKeeping.getPooled(mapResult, func, context);traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);MapBookKeeping.release(traverseContext);return ReactFragment.create(mapResult);}function forEachSingleChildDummy(traverseContext, child, name, i){return null;}function countChildren(children, context){return traverseAllChildren(children, forEachSingleChildDummy, null);}var ReactChildren={forEach:forEachChildren, map:mapChildren, count:countChildren};module.exports = ReactChildren;}, {"153":153, "154":154, "28":28, "63":63}], 33:[function(_dereq_, module, exports){"use strict";var ReactComponent=_dereq_(34);var ReactCurrentOwner=_dereq_(39);var ReactElement=_dereq_(57);var ReactErrorUtils=_dereq_(60);var ReactInstanceMap=_dereq_(67);var ReactLifeCycle=_dereq_(68);var ReactPropTypeLocations=_dereq_(77);var ReactPropTypeLocationNames=_dereq_(76);var ReactUpdateQueue=_dereq_(86);var assign=_dereq_(27);var invariant=_dereq_(135);var keyMirror=_dereq_(140);var keyOf=_dereq_(141);var warning=_dereq_(154);var MIXINS_KEY=keyOf({mixins:null});var SpecPolicy=keyMirror({DEFINE_ONCE:null, DEFINE_MANY:null, OVERRIDE_BASE:null, DEFINE_MANY_MERGED:null});var injectedMixins=[];var ReactClassInterface={mixins:SpecPolicy.DEFINE_MANY, statics:SpecPolicy.DEFINE_MANY, propTypes:SpecPolicy.DEFINE_MANY, contextTypes:SpecPolicy.DEFINE_MANY, childContextTypes:SpecPolicy.DEFINE_MANY, getDefaultProps:SpecPolicy.DEFINE_MANY_MERGED, getInitialState:SpecPolicy.DEFINE_MANY_MERGED, getChildContext:SpecPolicy.DEFINE_MANY_MERGED, render:SpecPolicy.DEFINE_ONCE, componentWillMount:SpecPolicy.DEFINE_MANY, componentDidMount:SpecPolicy.DEFINE_MANY, componentWillReceiveProps:SpecPolicy.DEFINE_MANY, shouldComponentUpdate:SpecPolicy.DEFINE_ONCE, componentWillUpdate:SpecPolicy.DEFINE_MANY, componentDidUpdate:SpecPolicy.DEFINE_MANY, componentWillUnmount:SpecPolicy.DEFINE_MANY, updateComponent:SpecPolicy.OVERRIDE_BASE};var RESERVED_SPEC_KEYS={displayName:function displayName(Constructor, _displayName){Constructor.displayName = _displayName;}, mixins:function mixins(Constructor, _mixins){if(_mixins){for(var i=0; i < _mixins.length; i++) {mixSpecIntoComponent(Constructor, _mixins[i]);}}}, childContextTypes:function childContextTypes(Constructor, _childContextTypes){if("production" !== "development"){validateTypeDef(Constructor, _childContextTypes, ReactPropTypeLocations.childContext);}Constructor.childContextTypes = assign({}, Constructor.childContextTypes, _childContextTypes);}, contextTypes:function contextTypes(Constructor, _contextTypes){if("production" !== "development"){validateTypeDef(Constructor, _contextTypes, ReactPropTypeLocations.context);}Constructor.contextTypes = assign({}, Constructor.contextTypes, _contextTypes);}, getDefaultProps:function getDefaultProps(Constructor, _getDefaultProps){if(Constructor.getDefaultProps){Constructor.getDefaultProps = createMergedResultFunction(Constructor.getDefaultProps, _getDefaultProps);}else {Constructor.getDefaultProps = _getDefaultProps;}}, propTypes:function propTypes(Constructor, _propTypes){if("production" !== "development"){validateTypeDef(Constructor, _propTypes, ReactPropTypeLocations.prop);}Constructor.propTypes = assign({}, Constructor.propTypes, _propTypes);}, statics:function statics(Constructor, _statics){mixStaticSpecIntoComponent(Constructor, _statics);}};function validateTypeDef(Constructor, typeDef, location){for(var propName in typeDef) {if(typeDef.hasOwnProperty(propName)){"production" !== "development"?warning(typeof typeDef[propName] === "function", "%s: %s type `%s` is invalid; it must be a function, usually from " + "React.PropTypes.", Constructor.displayName || "ReactClass", ReactPropTypeLocationNames[location], propName):null;}}}function validateMethodOverride(proto, name){var specPolicy=ReactClassInterface.hasOwnProperty(name)?ReactClassInterface[name]:null;if(ReactClassMixin.hasOwnProperty(name)){"production" !== "development"?invariant(specPolicy === SpecPolicy.OVERRIDE_BASE, "ReactClassInterface: You are attempting to override " + "`%s` from your class specification. Ensure that your method names " + "do not overlap with React methods.", name):invariant(specPolicy === SpecPolicy.OVERRIDE_BASE);}if(proto.hasOwnProperty(name)){"production" !== "development"?invariant(specPolicy === SpecPolicy.DEFINE_MANY || specPolicy === SpecPolicy.DEFINE_MANY_MERGED, "ReactClassInterface: You are attempting to define " + "`%s` on your component more than once. This conflict may be due " + "to a mixin.", name):invariant(specPolicy === SpecPolicy.DEFINE_MANY || specPolicy === SpecPolicy.DEFINE_MANY_MERGED);}}function mixSpecIntoComponent(Constructor, spec){if(!spec){return;}"production" !== "development"?invariant(typeof spec !== "function", "ReactClass: You're attempting to " + "use a component class as a mixin. Instead, just use a regular object."):invariant(typeof spec !== "function");"production" !== "development"?invariant(!ReactElement.isValidElement(spec), "ReactClass: You're attempting to " + "use a component as a mixin. Instead, just use a regular object."):invariant(!ReactElement.isValidElement(spec));var proto=Constructor.prototype;if(spec.hasOwnProperty(MIXINS_KEY)){RESERVED_SPEC_KEYS.mixins(Constructor, spec.mixins);}for(var name in spec) {if(!spec.hasOwnProperty(name)){continue;}if(name === MIXINS_KEY){continue;}var property=spec[name];validateMethodOverride(proto, name);if(RESERVED_SPEC_KEYS.hasOwnProperty(name)){RESERVED_SPEC_KEYS[name](Constructor, property);}else {var isReactClassMethod=ReactClassInterface.hasOwnProperty(name);var isAlreadyDefined=proto.hasOwnProperty(name);var markedDontBind=property && property.__reactDontBind;var isFunction=typeof property === "function";var shouldAutoBind=isFunction && !isReactClassMethod && !isAlreadyDefined && !markedDontBind;if(shouldAutoBind){if(!proto.__reactAutoBindMap){proto.__reactAutoBindMap = {};}proto.__reactAutoBindMap[name] = property;proto[name] = property;}else {if(isAlreadyDefined){var specPolicy=ReactClassInterface[name];"production" !== "development"?invariant(isReactClassMethod && (specPolicy === SpecPolicy.DEFINE_MANY_MERGED || specPolicy === SpecPolicy.DEFINE_MANY), "ReactClass: Unexpected spec policy %s for key %s " + "when mixing in component specs.", specPolicy, name):invariant(isReactClassMethod && (specPolicy === SpecPolicy.DEFINE_MANY_MERGED || specPolicy === SpecPolicy.DEFINE_MANY));if(specPolicy === SpecPolicy.DEFINE_MANY_MERGED){proto[name] = createMergedResultFunction(proto[name], property);}else if(specPolicy === SpecPolicy.DEFINE_MANY){proto[name] = createChainedFunction(proto[name], property);}}else {proto[name] = property;if("production" !== "development"){if(typeof property === "function" && spec.displayName){proto[name].displayName = spec.displayName + "_" + name;}}}}}}}function mixStaticSpecIntoComponent(Constructor, statics){if(!statics){return;}for(var name in statics) {var property=statics[name];if(!statics.hasOwnProperty(name)){continue;}var isReserved=(name in RESERVED_SPEC_KEYS);"production" !== "development"?invariant(!isReserved, "ReactClass: You are attempting to define a reserved " + "property, `%s`, that shouldn't be on the \"statics\" key. Define it " + "as an instance property instead; it will still be accessible on the " + "constructor.", name):invariant(!isReserved);var isInherited=(name in Constructor);"production" !== "development"?invariant(!isInherited, "ReactClass: You are attempting to define " + "`%s` on your component more than once. This conflict may be " + "due to a mixin.", name):invariant(!isInherited);Constructor[name] = property;}}function mergeIntoWithNoDuplicateKeys(one, two){"production" !== "development"?invariant(one && two && typeof one === "object" && typeof two === "object", "mergeIntoWithNoDuplicateKeys(): Cannot merge non-objects."):invariant(one && two && typeof one === "object" && typeof two === "object");for(var key in two) {if(two.hasOwnProperty(key)){"production" !== "development"?invariant(one[key] === undefined, "mergeIntoWithNoDuplicateKeys(): " + "Tried to merge two objects with the same key: `%s`. This conflict " + "may be due to a mixin; in particular, this may be caused by two " + "getInitialState() or getDefaultProps() methods returning objects " + "with clashing keys.", key):invariant(one[key] === undefined);one[key] = two[key];}}return one;}function createMergedResultFunction(one, two){return function mergedResult(){var a=one.apply(this, arguments);var b=two.apply(this, arguments);if(a == null){return b;}else if(b == null){return a;}var c={};mergeIntoWithNoDuplicateKeys(c, a);mergeIntoWithNoDuplicateKeys(c, b);return c;};}function createChainedFunction(one, two){return function chainedFunction(){one.apply(this, arguments);two.apply(this, arguments);};}function bindAutoBindMethod(component, method){var boundMethod=method.bind(component);if("production" !== "development"){boundMethod.__reactBoundContext = component;boundMethod.__reactBoundMethod = method;boundMethod.__reactBoundArguments = null;var componentName=component.constructor.displayName;var _bind=boundMethod.bind;boundMethod.bind = function(newThis){for(var args=[], $__0=1, $__1=arguments.length; $__0 < $__1; $__0++) args.push(arguments[$__0]);if(newThis !== component && newThis !== null){"production" !== "development"?warning(false, "bind(): React component methods may only be bound to the " + "component instance. See %s", componentName):null;}else if(!args.length){"production" !== "development"?warning(false, "bind(): You are binding a component method to the component. " + "React does this for you automatically in a high-performance " + "way, so you can safely remove this call. See %s", componentName):null;return boundMethod;}var reboundMethod=_bind.apply(boundMethod, arguments);reboundMethod.__reactBoundContext = component;reboundMethod.__reactBoundMethod = method;reboundMethod.__reactBoundArguments = args;return reboundMethod;};}return boundMethod;}function bindAutoBindMethods(component){for(var autoBindKey in component.__reactAutoBindMap) {if(component.__reactAutoBindMap.hasOwnProperty(autoBindKey)){var method=component.__reactAutoBindMap[autoBindKey];component[autoBindKey] = bindAutoBindMethod(component, ReactErrorUtils.guard(method, component.constructor.displayName + "." + autoBindKey));}}}var typeDeprecationDescriptor={enumerable:false, get:function get(){var displayName=this.displayName || this.name || "Component";"production" !== "development"?warning(false, "%s.type is deprecated. Use %s directly to access the class.", displayName, displayName):null;Object.defineProperty(this, "type", {value:this});return this;}};var ReactClassMixin={replaceState:function replaceState(newState, callback){ReactUpdateQueue.enqueueReplaceState(this, newState);if(callback){ReactUpdateQueue.enqueueCallback(this, callback);}}, isMounted:function isMounted(){if("production" !== "development"){var owner=ReactCurrentOwner.current;if(owner !== null){"production" !== "development"?warning(owner._warnedAboutRefsInRender, "%s is accessing isMounted inside its render() function. " + "render() should be a pure function of props and state. It should " + "never access something that requires stale data from the previous " + "render, such as refs. Move this logic to componentDidMount and " + "componentDidUpdate instead.", owner.getName() || "A component"):null;owner._warnedAboutRefsInRender = true;}}var internalInstance=ReactInstanceMap.get(this);return internalInstance && internalInstance !== ReactLifeCycle.currentlyMountingInstance;}, setProps:function setProps(partialProps, callback){ReactUpdateQueue.enqueueSetProps(this, partialProps);if(callback){ReactUpdateQueue.enqueueCallback(this, callback);}}, replaceProps:function replaceProps(newProps, callback){ReactUpdateQueue.enqueueReplaceProps(this, newProps);if(callback){ReactUpdateQueue.enqueueCallback(this, callback);}}};var ReactClassComponent=function ReactClassComponent(){};assign(ReactClassComponent.prototype, ReactComponent.prototype, ReactClassMixin);var ReactClass={createClass:function createClass(spec){var Constructor=function Constructor(props, context){if("production" !== "development"){"production" !== "development"?warning(this instanceof Constructor, "Something is calling a React component directly. Use a factory or " + "JSX instead. See: https://fb.me/react-legacyfactory"):null;}if(this.__reactAutoBindMap){bindAutoBindMethods(this);}this.props = props;this.context = context;this.state = null;var initialState=this.getInitialState?this.getInitialState():null;if("production" !== "development"){if(typeof initialState === "undefined" && this.getInitialState._isMockFunction){initialState = null;}}"production" !== "development"?invariant(typeof initialState === "object" && !Array.isArray(initialState), "%s.getInitialState(): must return an object or null", Constructor.displayName || "ReactCompositeComponent"):invariant(typeof initialState === "object" && !Array.isArray(initialState));this.state = initialState;};Constructor.prototype = new ReactClassComponent();Constructor.prototype.constructor = Constructor;injectedMixins.forEach(mixSpecIntoComponent.bind(null, Constructor));mixSpecIntoComponent(Constructor, spec);if(Constructor.getDefaultProps){Constructor.defaultProps = Constructor.getDefaultProps();}if("production" !== "development"){if(Constructor.getDefaultProps){Constructor.getDefaultProps.isReactClassApproved = {};}if(Constructor.prototype.getInitialState){Constructor.prototype.getInitialState.isReactClassApproved = {};}}"production" !== "development"?invariant(Constructor.prototype.render, "createClass(...): Class specification must implement a `render` method."):invariant(Constructor.prototype.render);if("production" !== "development"){"production" !== "development"?warning(!Constructor.prototype.componentShouldUpdate, "%s has a method called " + "componentShouldUpdate(). Did you mean shouldComponentUpdate()? " + "The name is phrased as a question because the function is " + "expected to return a value.", spec.displayName || "A component"):null;}for(var methodName in ReactClassInterface) {if(!Constructor.prototype[methodName]){Constructor.prototype[methodName] = null;}}Constructor.type = Constructor;if("production" !== "development"){try{Object.defineProperty(Constructor, "type", typeDeprecationDescriptor);}catch(x) {}}return Constructor;}, injection:{injectMixin:function injectMixin(mixin){injectedMixins.push(mixin);}}};module.exports = ReactClass;}, {"135":135, "140":140, "141":141, "154":154, "27":27, "34":34, "39":39, "57":57, "60":60, "67":67, "68":68, "76":76, "77":77, "86":86}], 34:[function(_dereq_, module, exports){"use strict";var ReactUpdateQueue=_dereq_(86);var invariant=_dereq_(135);var warning=_dereq_(154);function ReactComponent(props, context){this.props = props;this.context = context;}ReactComponent.prototype.setState = function(partialState, callback){"production" !== "development"?invariant(typeof partialState === "object" || typeof partialState === "function" || partialState == null, "setState(...): takes an object of state variables to update or a " + "function which returns an object of state variables."):invariant(typeof partialState === "object" || typeof partialState === "function" || partialState == null);if("production" !== "development"){"production" !== "development"?warning(partialState != null, "setState(...): You passed an undefined or null state object; " + "instead, use forceUpdate()."):null;}ReactUpdateQueue.enqueueSetState(this, partialState);if(callback){ReactUpdateQueue.enqueueCallback(this, callback);}};ReactComponent.prototype.forceUpdate = function(callback){ReactUpdateQueue.enqueueForceUpdate(this);if(callback){ReactUpdateQueue.enqueueCallback(this, callback);}};if("production" !== "development"){var deprecatedAPIs={getDOMNode:["getDOMNode", "Use React.findDOMNode(component) instead."], isMounted:["isMounted", "Instead, make sure to clean up subscriptions and pending requests in " + "componentWillUnmount to prevent memory leaks."], replaceProps:["replaceProps", "Instead call React.render again at the top level."], replaceState:["replaceState", "Refactor your code to use setState instead (see " + "https://github.com/facebook/react/issues/3236)."], setProps:["setProps", "Instead call React.render again at the top level."]};var defineDeprecationWarning=function defineDeprecationWarning(methodName, info){try{Object.defineProperty(ReactComponent.prototype, methodName, {get:function get(){"production" !== "development"?warning(false, "%s(...) is deprecated in plain JavaScript React classes. %s", info[0], info[1]):null;return undefined;}});}catch(x) {}};for(var fnName in deprecatedAPIs) {if(deprecatedAPIs.hasOwnProperty(fnName)){defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);}}}module.exports = ReactComponent;}, {"135":135, "154":154, "86":86}], 35:[function(_dereq_, module, exports){"use strict";var ReactDOMIDOperations=_dereq_(44);var ReactMount=_dereq_(70);var ReactComponentBrowserEnvironment={processChildrenUpdates:ReactDOMIDOperations.dangerouslyProcessChildrenUpdates, replaceNodeWithMarkupByID:ReactDOMIDOperations.dangerouslyReplaceNodeWithMarkupByID, unmountIDFromEnvironment:function unmountIDFromEnvironment(rootNodeID){ReactMount.purgeID(rootNodeID);}};module.exports = ReactComponentBrowserEnvironment;}, {"44":44, "70":70}], 36:[function(_dereq_, module, exports){"use strict";var invariant=_dereq_(135);var injected=false;var ReactComponentEnvironment={unmountIDFromEnvironment:null, replaceNodeWithMarkupByID:null, processChildrenUpdates:null, injection:{injectEnvironment:function injectEnvironment(environment){"production" !== "development"?invariant(!injected, "ReactCompositeComponent: injectEnvironment() can only be called once."):invariant(!injected);ReactComponentEnvironment.unmountIDFromEnvironment = environment.unmountIDFromEnvironment;ReactComponentEnvironment.replaceNodeWithMarkupByID = environment.replaceNodeWithMarkupByID;ReactComponentEnvironment.processChildrenUpdates = environment.processChildrenUpdates;injected = true;}}};module.exports = ReactComponentEnvironment;}, {"135":135}], 37:[function(_dereq_, module, exports){"use strict";var ReactComponentEnvironment=_dereq_(36);var ReactContext=_dereq_(38);var ReactCurrentOwner=_dereq_(39);var ReactElement=_dereq_(57);var ReactElementValidator=_dereq_(58);var ReactInstanceMap=_dereq_(67);var ReactLifeCycle=_dereq_(68);var ReactNativeComponent=_dereq_(73);var ReactPerf=_dereq_(75);var ReactPropTypeLocations=_dereq_(77);var ReactPropTypeLocationNames=_dereq_(76);var ReactReconciler=_dereq_(81);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var emptyObject=_dereq_(115);var invariant=_dereq_(135);var shouldUpdateReactComponent=_dereq_(151);var warning=_dereq_(154);function getDeclarationErrorAddendum(component){var owner=component._currentElement._owner || null;if(owner){var name=owner.getName();if(name){return " Check the render method of `" + name + "`.";}}return "";}var nextMountID=1;var ReactCompositeComponentMixin={construct:function construct(element){this._currentElement = element;this._rootNodeID = null;this._instance = null;this._pendingElement = null;this._pendingStateQueue = null;this._pendingReplaceState = false;this._pendingForceUpdate = false;this._renderedComponent = null;this._context = null;this._mountOrder = 0;this._isTopLevel = false;this._pendingCallbacks = null;}, mountComponent:function mountComponent(rootID, transaction, context){this._context = context;this._mountOrder = nextMountID++;this._rootNodeID = rootID;var publicProps=this._processProps(this._currentElement.props);var publicContext=this._processContext(this._currentElement._context);var Component=ReactNativeComponent.getComponentClassForElement(this._currentElement);var inst=new Component(publicProps, publicContext);if("production" !== "development"){"production" !== "development"?warning(inst.render != null, "%s(...): No `render` method found on the returned component " + "instance: you may have forgotten to define `render` in your " + "component or you may have accidentally tried to render an element " + "whose type is a function that isn't a React component.", Component.displayName || Component.name || "Component"):null;}inst.props = publicProps;inst.context = publicContext;inst.refs = emptyObject;this._instance = inst;ReactInstanceMap.set(inst, this);if("production" !== "development"){this._warnIfContextsDiffer(this._currentElement._context, context);}if("production" !== "development"){"production" !== "development"?warning(!inst.getInitialState || inst.getInitialState.isReactClassApproved, "getInitialState was defined on %s, a plain JavaScript class. " + "This is only supported for classes created using React.createClass. " + "Did you mean to define a state property instead?", this.getName() || "a component"):null;"production" !== "development"?warning(!inst.getDefaultProps || inst.getDefaultProps.isReactClassApproved, "getDefaultProps was defined on %s, a plain JavaScript class. " + "This is only supported for classes created using React.createClass. " + "Use a static property to define defaultProps instead.", this.getName() || "a component"):null;"production" !== "development"?warning(!inst.propTypes, "propTypes was defined as an instance property on %s. Use a static " + "property to define propTypes instead.", this.getName() || "a component"):null;"production" !== "development"?warning(!inst.contextTypes, "contextTypes was defined as an instance property on %s. Use a " + "static property to define contextTypes instead.", this.getName() || "a component"):null;"production" !== "development"?warning(typeof inst.componentShouldUpdate !== "function", "%s has a method called " + "componentShouldUpdate(). Did you mean shouldComponentUpdate()? " + "The name is phrased as a question because the function is " + "expected to return a value.", this.getName() || "A component"):null;}var initialState=inst.state;if(initialState === undefined){inst.state = initialState = null;}"production" !== "development"?invariant(typeof initialState === "object" && !Array.isArray(initialState), "%s.state: must be set to an object or null", this.getName() || "ReactCompositeComponent"):invariant(typeof initialState === "object" && !Array.isArray(initialState));this._pendingStateQueue = null;this._pendingReplaceState = false;this._pendingForceUpdate = false;var childContext;var renderedElement;var previouslyMounting=ReactLifeCycle.currentlyMountingInstance;ReactLifeCycle.currentlyMountingInstance = this;try{if(inst.componentWillMount){inst.componentWillMount();if(this._pendingStateQueue){inst.state = this._processPendingState(inst.props, inst.context);}}childContext = this._getValidatedChildContext(context);renderedElement = this._renderValidatedComponent(childContext);}finally {ReactLifeCycle.currentlyMountingInstance = previouslyMounting;}this._renderedComponent = this._instantiateReactComponent(renderedElement, this._currentElement.type);var markup=ReactReconciler.mountComponent(this._renderedComponent, rootID, transaction, this._mergeChildContext(context, childContext));if(inst.componentDidMount){transaction.getReactMountReady().enqueue(inst.componentDidMount, inst);}return markup;}, unmountComponent:function unmountComponent(){var inst=this._instance;if(inst.componentWillUnmount){var previouslyUnmounting=ReactLifeCycle.currentlyUnmountingInstance;ReactLifeCycle.currentlyUnmountingInstance = this;try{inst.componentWillUnmount();}finally {ReactLifeCycle.currentlyUnmountingInstance = previouslyUnmounting;}}ReactReconciler.unmountComponent(this._renderedComponent);this._renderedComponent = null;this._pendingStateQueue = null;this._pendingReplaceState = false;this._pendingForceUpdate = false;this._pendingCallbacks = null;this._pendingElement = null;this._context = null;this._rootNodeID = null;ReactInstanceMap.remove(inst);}, _setPropsInternal:function _setPropsInternal(partialProps, callback){var element=this._pendingElement || this._currentElement;this._pendingElement = ReactElement.cloneAndReplaceProps(element, assign({}, element.props, partialProps));ReactUpdates.enqueueUpdate(this, callback);}, _maskContext:function _maskContext(context){var maskedContext=null;if(typeof this._currentElement.type === "string"){return emptyObject;}var contextTypes=this._currentElement.type.contextTypes;if(!contextTypes){return emptyObject;}maskedContext = {};for(var contextName in contextTypes) {maskedContext[contextName] = context[contextName];}return maskedContext;}, _processContext:function _processContext(context){var maskedContext=this._maskContext(context);if("production" !== "development"){var Component=ReactNativeComponent.getComponentClassForElement(this._currentElement);if(Component.contextTypes){this._checkPropTypes(Component.contextTypes, maskedContext, ReactPropTypeLocations.context);}}return maskedContext;}, _getValidatedChildContext:function _getValidatedChildContext(currentContext){var inst=this._instance;var childContext=inst.getChildContext && inst.getChildContext();if(childContext){"production" !== "development"?invariant(typeof inst.constructor.childContextTypes === "object", "%s.getChildContext(): childContextTypes must be defined in order to " + "use getChildContext().", this.getName() || "ReactCompositeComponent"):invariant(typeof inst.constructor.childContextTypes === "object");if("production" !== "development"){this._checkPropTypes(inst.constructor.childContextTypes, childContext, ReactPropTypeLocations.childContext);}for(var name in childContext) {"production" !== "development"?invariant(name in inst.constructor.childContextTypes, "%s.getChildContext(): key \"%s\" is not defined in childContextTypes.", this.getName() || "ReactCompositeComponent", name):invariant(name in inst.constructor.childContextTypes);}return childContext;}return null;}, _mergeChildContext:function _mergeChildContext(currentContext, childContext){if(childContext){return assign({}, currentContext, childContext);}return currentContext;}, _processProps:function _processProps(newProps){if("production" !== "development"){var Component=ReactNativeComponent.getComponentClassForElement(this._currentElement);if(Component.propTypes){this._checkPropTypes(Component.propTypes, newProps, ReactPropTypeLocations.prop);}}return newProps;}, _checkPropTypes:function _checkPropTypes(propTypes, props, location){var componentName=this.getName();for(var propName in propTypes) {if(propTypes.hasOwnProperty(propName)){var error;try{"production" !== "development"?invariant(typeof propTypes[propName] === "function", "%s: %s type `%s` is invalid; it must be a function, usually " + "from React.PropTypes.", componentName || "React class", ReactPropTypeLocationNames[location], propName):invariant(typeof propTypes[propName] === "function");error = propTypes[propName](props, propName, componentName, location);}catch(ex) {error = ex;}if(error instanceof Error){var addendum=getDeclarationErrorAddendum(this);if(location === ReactPropTypeLocations.prop){"production" !== "development"?warning(false, "Failed Composite propType: %s%s", error.message, addendum):null;}else {"production" !== "development"?warning(false, "Failed Context Types: %s%s", error.message, addendum):null;}}}}}, receiveComponent:function receiveComponent(nextElement, transaction, nextContext){var prevElement=this._currentElement;var prevContext=this._context;this._pendingElement = null;this.updateComponent(transaction, prevElement, nextElement, prevContext, nextContext);}, performUpdateIfNecessary:function performUpdateIfNecessary(transaction){if(this._pendingElement != null){ReactReconciler.receiveComponent(this, this._pendingElement || this._currentElement, transaction, this._context);}if(this._pendingStateQueue !== null || this._pendingForceUpdate){if("production" !== "development"){ReactElementValidator.checkAndWarnForMutatedProps(this._currentElement);}this.updateComponent(transaction, this._currentElement, this._currentElement, this._context, this._context);}}, _warnIfContextsDiffer:function _warnIfContextsDiffer(ownerBasedContext, parentBasedContext){ownerBasedContext = this._maskContext(ownerBasedContext);parentBasedContext = this._maskContext(parentBasedContext);var parentKeys=Object.keys(parentBasedContext).sort();var displayName=this.getName() || "ReactCompositeComponent";for(var i=0; i < parentKeys.length; i++) {var key=parentKeys[i];"production" !== "development"?warning(ownerBasedContext[key] === parentBasedContext[key], "owner-based and parent-based contexts differ " + "(values: `%s` vs `%s`) for key (%s) while mounting %s " + "(see: http://fb.me/react-context-by-parent)", ownerBasedContext[key], parentBasedContext[key], key, displayName):null;}}, updateComponent:function updateComponent(transaction, prevParentElement, nextParentElement, prevUnmaskedContext, nextUnmaskedContext){var inst=this._instance;var nextContext=inst.context;var nextProps=inst.props;if(prevParentElement !== nextParentElement){nextContext = this._processContext(nextParentElement._context);nextProps = this._processProps(nextParentElement.props);if("production" !== "development"){if(nextUnmaskedContext != null){this._warnIfContextsDiffer(nextParentElement._context, nextUnmaskedContext);}}if(inst.componentWillReceiveProps){inst.componentWillReceiveProps(nextProps, nextContext);}}var nextState=this._processPendingState(nextProps, nextContext);var shouldUpdate=this._pendingForceUpdate || !inst.shouldComponentUpdate || inst.shouldComponentUpdate(nextProps, nextState, nextContext);if("production" !== "development"){"production" !== "development"?warning(typeof shouldUpdate !== "undefined", "%s.shouldComponentUpdate(): Returned undefined instead of a " + "boolean value. Make sure to return true or false.", this.getName() || "ReactCompositeComponent"):null;}if(shouldUpdate){this._pendingForceUpdate = false;this._performComponentUpdate(nextParentElement, nextProps, nextState, nextContext, transaction, nextUnmaskedContext);}else {this._currentElement = nextParentElement;this._context = nextUnmaskedContext;inst.props = nextProps;inst.state = nextState;inst.context = nextContext;}}, _processPendingState:function _processPendingState(props, context){var inst=this._instance;var queue=this._pendingStateQueue;var replace=this._pendingReplaceState;this._pendingReplaceState = false;this._pendingStateQueue = null;if(!queue){return inst.state;}if(replace && queue.length === 1){return queue[0];}var nextState=assign({}, replace?queue[0]:inst.state);for(var i=replace?1:0; i < queue.length; i++) {var partial=queue[i];assign(nextState, typeof partial === "function"?partial.call(inst, nextState, props, context):partial);}return nextState;}, _performComponentUpdate:function _performComponentUpdate(nextElement, nextProps, nextState, nextContext, transaction, unmaskedContext){var inst=this._instance;var prevProps=inst.props;var prevState=inst.state;var prevContext=inst.context;if(inst.componentWillUpdate){inst.componentWillUpdate(nextProps, nextState, nextContext);}this._currentElement = nextElement;this._context = unmaskedContext;inst.props = nextProps;inst.state = nextState;inst.context = nextContext;this._updateRenderedComponent(transaction, unmaskedContext);if(inst.componentDidUpdate){transaction.getReactMountReady().enqueue(inst.componentDidUpdate.bind(inst, prevProps, prevState, prevContext), inst);}}, _updateRenderedComponent:function _updateRenderedComponent(transaction, context){var prevComponentInstance=this._renderedComponent;var prevRenderedElement=prevComponentInstance._currentElement;var childContext=this._getValidatedChildContext();var nextRenderedElement=this._renderValidatedComponent(childContext);if(shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)){ReactReconciler.receiveComponent(prevComponentInstance, nextRenderedElement, transaction, this._mergeChildContext(context, childContext));}else {var thisID=this._rootNodeID;var prevComponentID=prevComponentInstance._rootNodeID;ReactReconciler.unmountComponent(prevComponentInstance);this._renderedComponent = this._instantiateReactComponent(nextRenderedElement, this._currentElement.type);var nextMarkup=ReactReconciler.mountComponent(this._renderedComponent, thisID, transaction, this._mergeChildContext(context, childContext));this._replaceNodeWithMarkupByID(prevComponentID, nextMarkup);}}, _replaceNodeWithMarkupByID:function _replaceNodeWithMarkupByID(prevComponentID, nextMarkup){ReactComponentEnvironment.replaceNodeWithMarkupByID(prevComponentID, nextMarkup);}, _renderValidatedComponentWithoutOwnerOrContext:function _renderValidatedComponentWithoutOwnerOrContext(){var inst=this._instance;var renderedComponent=inst.render();if("production" !== "development"){if(typeof renderedComponent === "undefined" && inst.render._isMockFunction){renderedComponent = null;}}return renderedComponent;}, _renderValidatedComponent:function _renderValidatedComponent(childContext){var renderedComponent;var previousContext=ReactContext.current;ReactContext.current = this._mergeChildContext(this._currentElement._context, childContext);ReactCurrentOwner.current = this;try{renderedComponent = this._renderValidatedComponentWithoutOwnerOrContext();}finally {ReactContext.current = previousContext;ReactCurrentOwner.current = null;}"production" !== "development"?invariant(renderedComponent === null || renderedComponent === false || ReactElement.isValidElement(renderedComponent), "%s.render(): A valid ReactComponent must be returned. You may have " + "returned undefined, an array or some other invalid object.", this.getName() || "ReactCompositeComponent"):invariant(renderedComponent === null || renderedComponent === false || ReactElement.isValidElement(renderedComponent));return renderedComponent;}, attachRef:function attachRef(ref, component){var inst=this.getPublicInstance();var refs=inst.refs === emptyObject?inst.refs = {}:inst.refs;refs[ref] = component.getPublicInstance();}, detachRef:function detachRef(ref){var refs=this.getPublicInstance().refs;delete refs[ref];}, getName:function getName(){var type=this._currentElement.type;var constructor=this._instance && this._instance.constructor;return type.displayName || constructor && constructor.displayName || type.name || constructor && constructor.name || null;}, getPublicInstance:function getPublicInstance(){return this._instance;}, _instantiateReactComponent:null};ReactPerf.measureMethods(ReactCompositeComponentMixin, "ReactCompositeComponent", {mountComponent:"mountComponent", updateComponent:"updateComponent", _renderValidatedComponent:"_renderValidatedComponent"});var ReactCompositeComponent={Mixin:ReactCompositeComponentMixin};module.exports = ReactCompositeComponent;}, {"115":115, "135":135, "151":151, "154":154, "27":27, "36":36, "38":38, "39":39, "57":57, "58":58, "67":67, "68":68, "73":73, "75":75, "76":76, "77":77, "81":81, "87":87}], 38:[function(_dereq_, module, exports){"use strict";var assign=_dereq_(27);var emptyObject=_dereq_(115);var warning=_dereq_(154);var didWarn=false;var ReactContext={current:emptyObject, withContext:function withContext(newContext, scopedCallback){if("production" !== "development"){"production" !== "development"?warning(didWarn, "withContext is deprecated and will be removed in a future version. " + "Use a wrapper component with getChildContext instead."):null;didWarn = true;}var result;var previousContext=ReactContext.current;ReactContext.current = assign({}, previousContext, newContext);try{result = scopedCallback();}finally {ReactContext.current = previousContext;}return result;}};module.exports = ReactContext;}, {"115":115, "154":154, "27":27}], 39:[function(_dereq_, module, exports){"use strict";var ReactCurrentOwner={current:null};module.exports = ReactCurrentOwner;}, {}], 40:[function(_dereq_, module, exports){"use strict";var ReactElement=_dereq_(57);var ReactElementValidator=_dereq_(58);var mapObject=_dereq_(142);function createDOMFactory(tag){if("production" !== "development"){return ReactElementValidator.createFactory(tag);}return ReactElement.createFactory(tag);}var ReactDOM=mapObject({a:"a", abbr:"abbr", address:"address", area:"area", article:"article", aside:"aside", audio:"audio", b:"b", base:"base", bdi:"bdi", bdo:"bdo", big:"big", blockquote:"blockquote", body:"body", br:"br", button:"button", canvas:"canvas", caption:"caption", cite:"cite", code:"code", col:"col", colgroup:"colgroup", data:"data", datalist:"datalist", dd:"dd", del:"del", details:"details", dfn:"dfn", dialog:"dialog", div:"div", dl:"dl", dt:"dt", em:"em", embed:"embed", fieldset:"fieldset", figcaption:"figcaption", figure:"figure", footer:"footer", form:"form", h1:"h1", h2:"h2", h3:"h3", h4:"h4", h5:"h5", h6:"h6", head:"head", header:"header", hr:"hr", html:"html", i:"i", iframe:"iframe", img:"img", input:"input", ins:"ins", kbd:"kbd", keygen:"keygen", label:"label", legend:"legend", li:"li", link:"link", main:"main", map:"map", mark:"mark", menu:"menu", menuitem:"menuitem", meta:"meta", meter:"meter", nav:"nav", noscript:"noscript", object:"object", ol:"ol", optgroup:"optgroup", option:"option", output:"output", p:"p", param:"param", picture:"picture", pre:"pre", progress:"progress", q:"q", rp:"rp", rt:"rt", ruby:"ruby", s:"s", samp:"samp", script:"script", section:"section", select:"select", small:"small", source:"source", span:"span", strong:"strong", style:"style", sub:"sub", summary:"summary", sup:"sup", table:"table", tbody:"tbody", td:"td", textarea:"textarea", tfoot:"tfoot", th:"th", thead:"thead", time:"time", title:"title", tr:"tr", track:"track", u:"u", ul:"ul", "var":"var", video:"video", wbr:"wbr", circle:"circle", clipPath:"clipPath", defs:"defs", ellipse:"ellipse", g:"g", line:"line", linearGradient:"linearGradient", mask:"mask", path:"path", pattern:"pattern", polygon:"polygon", polyline:"polyline", radialGradient:"radialGradient", rect:"rect", stop:"stop", svg:"svg", text:"text", tspan:"tspan"}, createDOMFactory);module.exports = ReactDOM;}, {"142":142, "57":57, "58":58}], 41:[function(_dereq_, module, exports){"use strict";var AutoFocusMixin=_dereq_(2);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var keyMirror=_dereq_(140);var button=ReactElement.createFactory("button");var mouseListenerNames=keyMirror({onClick:true, onDoubleClick:true, onMouseDown:true, onMouseMove:true, onMouseUp:true, onClickCapture:true, onDoubleClickCapture:true, onMouseDownCapture:true, onMouseMoveCapture:true, onMouseUpCapture:true});var ReactDOMButton=ReactClass.createClass({displayName:"ReactDOMButton", tagName:"BUTTON", mixins:[AutoFocusMixin, ReactBrowserComponentMixin], render:function render(){var props={};for(var key in this.props) {if(this.props.hasOwnProperty(key) && (!this.props.disabled || !mouseListenerNames[key])){props[key] = this.props[key];}}return button(props, this.props.children);}});module.exports = ReactDOMButton;}, {"140":140, "2":2, "29":29, "33":33, "57":57}], 42:[function(_dereq_, module, exports){"use strict";var CSSPropertyOperations=_dereq_(5);var DOMProperty=_dereq_(10);var DOMPropertyOperations=_dereq_(11);var ReactBrowserEventEmitter=_dereq_(30);var ReactComponentBrowserEnvironment=_dereq_(35);var ReactMount=_dereq_(70);var ReactMultiChild=_dereq_(71);var ReactPerf=_dereq_(75);var assign=_dereq_(27);var escapeTextContentForBrowser=_dereq_(116);var invariant=_dereq_(135);var isEventSupported=_dereq_(136);var keyOf=_dereq_(141);var warning=_dereq_(154);var deleteListener=ReactBrowserEventEmitter.deleteListener;var listenTo=ReactBrowserEventEmitter.listenTo;var registrationNameModules=ReactBrowserEventEmitter.registrationNameModules;var CONTENT_TYPES={"string":true, "number":true};var STYLE=keyOf({style:null});var ELEMENT_NODE_TYPE=1;var BackendIDOperations=null;function assertValidProps(props){if(!props){return;}if(props.dangerouslySetInnerHTML != null){"production" !== "development"?invariant(props.children == null, "Can only set one of `children` or `props.dangerouslySetInnerHTML`."):invariant(props.children == null);"production" !== "development"?invariant(typeof props.dangerouslySetInnerHTML === "object" && "__html" in props.dangerouslySetInnerHTML, "`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. " + "Please visit https://fb.me/react-invariant-dangerously-set-inner-html " + "for more information."):invariant(typeof props.dangerouslySetInnerHTML === "object" && "__html" in props.dangerouslySetInnerHTML);}if("production" !== "development"){"production" !== "development"?warning(props.innerHTML == null, "Directly setting property `innerHTML` is not permitted. " + "For more information, lookup documentation on `dangerouslySetInnerHTML`."):null;"production" !== "development"?warning(!props.contentEditable || props.children == null, "A component is `contentEditable` and contains `children` managed by " + "React. It is now your responsibility to guarantee that none of " + "those nodes are unexpectedly modified or duplicated. This is " + "probably not intentional."):null;}"production" !== "development"?invariant(props.style == null || typeof props.style === "object", "The `style` prop expects a mapping from style properties to values, " + "not a string. For example, style={{marginRight: spacing + 'em'}} when " + "using JSX."):invariant(props.style == null || typeof props.style === "object");}function putListener(id, registrationName, listener, transaction){if("production" !== "development"){"production" !== "development"?warning(registrationName !== "onScroll" || isEventSupported("scroll", true), "This browser doesn't support the `onScroll` event"):null;}var container=ReactMount.findReactContainerForID(id);if(container){var doc=container.nodeType === ELEMENT_NODE_TYPE?container.ownerDocument:container;listenTo(registrationName, doc);}transaction.getPutListenerQueue().enqueuePutListener(id, registrationName, listener);}var omittedCloseTags={"area":true, "base":true, "br":true, "col":true, "embed":true, "hr":true, "img":true, "input":true, "keygen":true, "link":true, "meta":true, "param":true, "source":true, "track":true, "wbr":true};var VALID_TAG_REGEX=/^[a-zA-Z][a-zA-Z:_\.\-\d]*$/;var validatedTagCache={};var hasOwnProperty=({}).hasOwnProperty;function validateDangerousTag(tag){if(!hasOwnProperty.call(validatedTagCache, tag)){"production" !== "development"?invariant(VALID_TAG_REGEX.test(tag), "Invalid tag: %s", tag):invariant(VALID_TAG_REGEX.test(tag));validatedTagCache[tag] = true;}}function ReactDOMComponent(tag){validateDangerousTag(tag);this._tag = tag;this._renderedChildren = null;this._previousStyleCopy = null;this._rootNodeID = null;}ReactDOMComponent.displayName = "ReactDOMComponent";ReactDOMComponent.Mixin = {construct:function construct(element){this._currentElement = element;}, mountComponent:function mountComponent(rootID, transaction, context){this._rootNodeID = rootID;assertValidProps(this._currentElement.props);var closeTag=omittedCloseTags[this._tag]?"":"</" + this._tag + ">";return this._createOpenTagMarkupAndPutListeners(transaction) + this._createContentMarkup(transaction, context) + closeTag;}, _createOpenTagMarkupAndPutListeners:function _createOpenTagMarkupAndPutListeners(transaction){var props=this._currentElement.props;var ret="<" + this._tag;for(var propKey in props) {if(!props.hasOwnProperty(propKey)){continue;}var propValue=props[propKey];if(propValue == null){continue;}if(registrationNameModules.hasOwnProperty(propKey)){putListener(this._rootNodeID, propKey, propValue, transaction);}else {if(propKey === STYLE){if(propValue){propValue = this._previousStyleCopy = assign({}, props.style);}propValue = CSSPropertyOperations.createMarkupForStyles(propValue);}var markup=DOMPropertyOperations.createMarkupForProperty(propKey, propValue);if(markup){ret += " " + markup;}}}if(transaction.renderToStaticMarkup){return ret + ">";}var markupForID=DOMPropertyOperations.createMarkupForID(this._rootNodeID);return ret + " " + markupForID + ">";}, _createContentMarkup:function _createContentMarkup(transaction, context){var prefix="";if(this._tag === "listing" || this._tag === "pre" || this._tag === "textarea"){prefix = "\n";}var props=this._currentElement.props;var innerHTML=props.dangerouslySetInnerHTML;if(innerHTML != null){if(innerHTML.__html != null){return prefix + innerHTML.__html;}}else {var contentToUse=CONTENT_TYPES[typeof props.children]?props.children:null;var childrenToUse=contentToUse != null?null:props.children;if(contentToUse != null){return prefix + escapeTextContentForBrowser(contentToUse);}else if(childrenToUse != null){var mountImages=this.mountChildren(childrenToUse, transaction, context);return prefix + mountImages.join("");}}return prefix;}, receiveComponent:function receiveComponent(nextElement, transaction, context){var prevElement=this._currentElement;this._currentElement = nextElement;this.updateComponent(transaction, prevElement, nextElement, context);}, updateComponent:function updateComponent(transaction, prevElement, nextElement, context){assertValidProps(this._currentElement.props);this._updateDOMProperties(prevElement.props, transaction);this._updateDOMChildren(prevElement.props, transaction, context);}, _updateDOMProperties:function _updateDOMProperties(lastProps, transaction){var nextProps=this._currentElement.props;var propKey;var styleName;var styleUpdates;for(propKey in lastProps) {if(nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey)){continue;}if(propKey === STYLE){var lastStyle=this._previousStyleCopy;for(styleName in lastStyle) {if(lastStyle.hasOwnProperty(styleName)){styleUpdates = styleUpdates || {};styleUpdates[styleName] = "";}}this._previousStyleCopy = null;}else if(registrationNameModules.hasOwnProperty(propKey)){deleteListener(this._rootNodeID, propKey);}else if(DOMProperty.isStandardName[propKey] || DOMProperty.isCustomAttribute(propKey)){BackendIDOperations.deletePropertyByID(this._rootNodeID, propKey);}}for(propKey in nextProps) {var nextProp=nextProps[propKey];var lastProp=propKey === STYLE?this._previousStyleCopy:lastProps[propKey];if(!nextProps.hasOwnProperty(propKey) || nextProp === lastProp){continue;}if(propKey === STYLE){if(nextProp){nextProp = this._previousStyleCopy = assign({}, nextProp);}else {this._previousStyleCopy = null;}if(lastProp){for(styleName in lastProp) {if(lastProp.hasOwnProperty(styleName) && (!nextProp || !nextProp.hasOwnProperty(styleName))){styleUpdates = styleUpdates || {};styleUpdates[styleName] = "";}}for(styleName in nextProp) {if(nextProp.hasOwnProperty(styleName) && lastProp[styleName] !== nextProp[styleName]){styleUpdates = styleUpdates || {};styleUpdates[styleName] = nextProp[styleName];}}}else {styleUpdates = nextProp;}}else if(registrationNameModules.hasOwnProperty(propKey)){putListener(this._rootNodeID, propKey, nextProp, transaction);}else if(DOMProperty.isStandardName[propKey] || DOMProperty.isCustomAttribute(propKey)){BackendIDOperations.updatePropertyByID(this._rootNodeID, propKey, nextProp);}}if(styleUpdates){BackendIDOperations.updateStylesByID(this._rootNodeID, styleUpdates);}}, _updateDOMChildren:function _updateDOMChildren(lastProps, transaction, context){var nextProps=this._currentElement.props;var lastContent=CONTENT_TYPES[typeof lastProps.children]?lastProps.children:null;var nextContent=CONTENT_TYPES[typeof nextProps.children]?nextProps.children:null;var lastHtml=lastProps.dangerouslySetInnerHTML && lastProps.dangerouslySetInnerHTML.__html;var nextHtml=nextProps.dangerouslySetInnerHTML && nextProps.dangerouslySetInnerHTML.__html;var lastChildren=lastContent != null?null:lastProps.children;var nextChildren=nextContent != null?null:nextProps.children;var lastHasContentOrHtml=lastContent != null || lastHtml != null;var nextHasContentOrHtml=nextContent != null || nextHtml != null;if(lastChildren != null && nextChildren == null){this.updateChildren(null, transaction, context);}else if(lastHasContentOrHtml && !nextHasContentOrHtml){this.updateTextContent("");}if(nextContent != null){if(lastContent !== nextContent){this.updateTextContent("" + nextContent);}}else if(nextHtml != null){if(lastHtml !== nextHtml){BackendIDOperations.updateInnerHTMLByID(this._rootNodeID, nextHtml);}}else if(nextChildren != null){this.updateChildren(nextChildren, transaction, context);}}, unmountComponent:function unmountComponent(){this.unmountChildren();ReactBrowserEventEmitter.deleteAllListeners(this._rootNodeID);ReactComponentBrowserEnvironment.unmountIDFromEnvironment(this._rootNodeID);this._rootNodeID = null;}};ReactPerf.measureMethods(ReactDOMComponent, "ReactDOMComponent", {mountComponent:"mountComponent", updateComponent:"updateComponent"});assign(ReactDOMComponent.prototype, ReactDOMComponent.Mixin, ReactMultiChild.Mixin);ReactDOMComponent.injection = {injectIDOperations:function injectIDOperations(IDOperations){ReactDOMComponent.BackendIDOperations = BackendIDOperations = IDOperations;}};module.exports = ReactDOMComponent;}, {"10":10, "11":11, "116":116, "135":135, "136":136, "141":141, "154":154, "27":27, "30":30, "35":35, "5":5, "70":70, "71":71, "75":75}], 43:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var LocalEventTrapMixin=_dereq_(25);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var form=ReactElement.createFactory("form");var ReactDOMForm=ReactClass.createClass({displayName:"ReactDOMForm", tagName:"FORM", mixins:[ReactBrowserComponentMixin, LocalEventTrapMixin], render:function render(){return form(this.props);}, componentDidMount:function componentDidMount(){this.trapBubbledEvent(EventConstants.topLevelTypes.topReset, "reset");this.trapBubbledEvent(EventConstants.topLevelTypes.topSubmit, "submit");}});module.exports = ReactDOMForm;}, {"15":15, "25":25, "29":29, "33":33, "57":57}], 44:[function(_dereq_, module, exports){"use strict";var CSSPropertyOperations=_dereq_(5);var DOMChildrenOperations=_dereq_(9);var DOMPropertyOperations=_dereq_(11);var ReactMount=_dereq_(70);var ReactPerf=_dereq_(75);var invariant=_dereq_(135);var setInnerHTML=_dereq_(148);var INVALID_PROPERTY_ERRORS={dangerouslySetInnerHTML:"`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.", style:"`style` must be set using `updateStylesByID()`."};var ReactDOMIDOperations={updatePropertyByID:function updatePropertyByID(id, name, value){var node=ReactMount.getNode(id);"production" !== "development"?invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name), "updatePropertyByID(...): %s", INVALID_PROPERTY_ERRORS[name]):invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name));if(value != null){DOMPropertyOperations.setValueForProperty(node, name, value);}else {DOMPropertyOperations.deleteValueForProperty(node, name);}}, deletePropertyByID:function deletePropertyByID(id, name, value){var node=ReactMount.getNode(id);"production" !== "development"?invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name), "updatePropertyByID(...): %s", INVALID_PROPERTY_ERRORS[name]):invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name));DOMPropertyOperations.deleteValueForProperty(node, name, value);}, updateStylesByID:function updateStylesByID(id, styles){var node=ReactMount.getNode(id);CSSPropertyOperations.setValueForStyles(node, styles);}, updateInnerHTMLByID:function updateInnerHTMLByID(id, html){var node=ReactMount.getNode(id);setInnerHTML(node, html);}, updateTextContentByID:function updateTextContentByID(id, content){var node=ReactMount.getNode(id);DOMChildrenOperations.updateTextContent(node, content);}, dangerouslyReplaceNodeWithMarkupByID:function dangerouslyReplaceNodeWithMarkupByID(id, markup){var node=ReactMount.getNode(id);DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup(node, markup);}, dangerouslyProcessChildrenUpdates:function dangerouslyProcessChildrenUpdates(updates, markup){for(var i=0; i < updates.length; i++) {updates[i].parentNode = ReactMount.getNode(updates[i].parentID);}DOMChildrenOperations.processUpdates(updates, markup);}};ReactPerf.measureMethods(ReactDOMIDOperations, "ReactDOMIDOperations", {updatePropertyByID:"updatePropertyByID", deletePropertyByID:"deletePropertyByID", updateStylesByID:"updateStylesByID", updateInnerHTMLByID:"updateInnerHTMLByID", updateTextContentByID:"updateTextContentByID", dangerouslyReplaceNodeWithMarkupByID:"dangerouslyReplaceNodeWithMarkupByID", dangerouslyProcessChildrenUpdates:"dangerouslyProcessChildrenUpdates"});module.exports = ReactDOMIDOperations;}, {"11":11, "135":135, "148":148, "5":5, "70":70, "75":75, "9":9}], 45:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var LocalEventTrapMixin=_dereq_(25);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var iframe=ReactElement.createFactory("iframe");var ReactDOMIframe=ReactClass.createClass({displayName:"ReactDOMIframe", tagName:"IFRAME", mixins:[ReactBrowserComponentMixin, LocalEventTrapMixin], render:function render(){return iframe(this.props);}, componentDidMount:function componentDidMount(){this.trapBubbledEvent(EventConstants.topLevelTypes.topLoad, "load");}});module.exports = ReactDOMIframe;}, {"15":15, "25":25, "29":29, "33":33, "57":57}], 46:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var LocalEventTrapMixin=_dereq_(25);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var img=ReactElement.createFactory("img");var ReactDOMImg=ReactClass.createClass({displayName:"ReactDOMImg", tagName:"IMG", mixins:[ReactBrowserComponentMixin, LocalEventTrapMixin], render:function render(){return img(this.props);}, componentDidMount:function componentDidMount(){this.trapBubbledEvent(EventConstants.topLevelTypes.topLoad, "load");this.trapBubbledEvent(EventConstants.topLevelTypes.topError, "error");}});module.exports = ReactDOMImg;}, {"15":15, "25":25, "29":29, "33":33, "57":57}], 47:[function(_dereq_, module, exports){"use strict";var AutoFocusMixin=_dereq_(2);var DOMPropertyOperations=_dereq_(11);var LinkedValueUtils=_dereq_(24);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var ReactMount=_dereq_(70);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var invariant=_dereq_(135);var input=ReactElement.createFactory("input");var instancesByReactID={};function forceUpdateIfMounted(){if(this.isMounted()){this.forceUpdate();}}var ReactDOMInput=ReactClass.createClass({displayName:"ReactDOMInput", tagName:"INPUT", mixins:[AutoFocusMixin, LinkedValueUtils.Mixin, ReactBrowserComponentMixin], getInitialState:function getInitialState(){var defaultValue=this.props.defaultValue;return {initialChecked:this.props.defaultChecked || false, initialValue:defaultValue != null?defaultValue:null};}, render:function render(){var props=assign({}, this.props);props.defaultChecked = null;props.defaultValue = null;var value=LinkedValueUtils.getValue(this);props.value = value != null?value:this.state.initialValue;var checked=LinkedValueUtils.getChecked(this);props.checked = checked != null?checked:this.state.initialChecked;props.onChange = this._handleChange;return input(props, this.props.children);}, componentDidMount:function componentDidMount(){var id=ReactMount.getID(this.getDOMNode());instancesByReactID[id] = this;}, componentWillUnmount:function componentWillUnmount(){var rootNode=this.getDOMNode();var id=ReactMount.getID(rootNode);delete instancesByReactID[id];}, componentDidUpdate:function componentDidUpdate(prevProps, prevState, prevContext){var rootNode=this.getDOMNode();if(this.props.checked != null){DOMPropertyOperations.setValueForProperty(rootNode, "checked", this.props.checked || false);}var value=LinkedValueUtils.getValue(this);if(value != null){DOMPropertyOperations.setValueForProperty(rootNode, "value", "" + value);}}, _handleChange:function _handleChange(event){var returnValue;var onChange=LinkedValueUtils.getOnChange(this);if(onChange){returnValue = onChange.call(this, event);}ReactUpdates.asap(forceUpdateIfMounted, this);var name=this.props.name;if(this.props.type === "radio" && name != null){var rootNode=this.getDOMNode();var queryRoot=rootNode;while(queryRoot.parentNode) {queryRoot = queryRoot.parentNode;}var group=queryRoot.querySelectorAll("input[name=" + JSON.stringify("" + name) + "][type=\"radio\"]");for(var i=0, groupLen=group.length; i < groupLen; i++) {var otherNode=group[i];if(otherNode === rootNode || otherNode.form !== rootNode.form){continue;}var otherID=ReactMount.getID(otherNode);"production" !== "development"?invariant(otherID, "ReactDOMInput: Mixing React and non-React radio inputs with the " + "same `name` is not supported."):invariant(otherID);var otherInstance=instancesByReactID[otherID];"production" !== "development"?invariant(otherInstance, "ReactDOMInput: Unknown radio button ID %s.", otherID):invariant(otherInstance);ReactUpdates.asap(forceUpdateIfMounted, otherInstance);}}return returnValue;}});module.exports = ReactDOMInput;}, {"11":11, "135":135, "2":2, "24":24, "27":27, "29":29, "33":33, "57":57, "70":70, "87":87}], 48:[function(_dereq_, module, exports){"use strict";var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var warning=_dereq_(154);var option=ReactElement.createFactory("option");var ReactDOMOption=ReactClass.createClass({displayName:"ReactDOMOption", tagName:"OPTION", mixins:[ReactBrowserComponentMixin], componentWillMount:function componentWillMount(){if("production" !== "development"){"production" !== "development"?warning(this.props.selected == null, "Use the `defaultValue` or `value` props on <select> instead of " + "setting `selected` on <option>."):null;}}, render:function render(){return option(this.props, this.props.children);}});module.exports = ReactDOMOption;}, {"154":154, "29":29, "33":33, "57":57}], 49:[function(_dereq_, module, exports){"use strict";var AutoFocusMixin=_dereq_(2);var LinkedValueUtils=_dereq_(24);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var select=ReactElement.createFactory("select");function updateOptionsIfPendingUpdateAndMounted(){if(this._pendingUpdate){this._pendingUpdate = false;var value=LinkedValueUtils.getValue(this);if(value != null && this.isMounted()){updateOptions(this, value);}}}function selectValueType(props, propName, componentName){if(props[propName] == null){return null;}if(props.multiple){if(!Array.isArray(props[propName])){return new Error("The `" + propName + "` prop supplied to <select> must be an array if " + "`multiple` is true.");}}else {if(Array.isArray(props[propName])){return new Error("The `" + propName + "` prop supplied to <select> must be a scalar " + "value if `multiple` is false.");}}}function updateOptions(component, propValue){var selectedValue, i, l;var options=component.getDOMNode().options;if(component.props.multiple){selectedValue = {};for(i = 0, l = propValue.length; i < l; i++) {selectedValue["" + propValue[i]] = true;}for(i = 0, l = options.length; i < l; i++) {var selected=selectedValue.hasOwnProperty(options[i].value);if(options[i].selected !== selected){options[i].selected = selected;}}}else {selectedValue = "" + propValue;for(i = 0, l = options.length; i < l; i++) {if(options[i].value === selectedValue){options[i].selected = true;return;}}if(options.length){options[0].selected = true;}}}var ReactDOMSelect=ReactClass.createClass({displayName:"ReactDOMSelect", tagName:"SELECT", mixins:[AutoFocusMixin, LinkedValueUtils.Mixin, ReactBrowserComponentMixin], propTypes:{defaultValue:selectValueType, value:selectValueType}, render:function render(){var props=assign({}, this.props);props.onChange = this._handleChange;props.value = null;return select(props, this.props.children);}, componentWillMount:function componentWillMount(){this._pendingUpdate = false;}, componentDidMount:function componentDidMount(){var value=LinkedValueUtils.getValue(this);if(value != null){updateOptions(this, value);}else if(this.props.defaultValue != null){updateOptions(this, this.props.defaultValue);}}, componentDidUpdate:function componentDidUpdate(prevProps){var value=LinkedValueUtils.getValue(this);if(value != null){this._pendingUpdate = false;updateOptions(this, value);}else if(!prevProps.multiple !== !this.props.multiple){if(this.props.defaultValue != null){updateOptions(this, this.props.defaultValue);}else {updateOptions(this, this.props.multiple?[]:"");}}}, _handleChange:function _handleChange(event){var returnValue;var onChange=LinkedValueUtils.getOnChange(this);if(onChange){returnValue = onChange.call(this, event);}this._pendingUpdate = true;ReactUpdates.asap(updateOptionsIfPendingUpdateAndMounted, this);return returnValue;}});module.exports = ReactDOMSelect;}, {"2":2, "24":24, "27":27, "29":29, "33":33, "57":57, "87":87}], 50:[function(_dereq_, module, exports){"use strict";var ExecutionEnvironment=_dereq_(21);var getNodeForCharacterOffset=_dereq_(128);var getTextContentAccessor=_dereq_(130);function isCollapsed(anchorNode, anchorOffset, focusNode, focusOffset){return anchorNode === focusNode && anchorOffset === focusOffset;}function getIEOffsets(node){var selection=document.selection;var selectedRange=selection.createRange();var selectedLength=selectedRange.text.length;var fromStart=selectedRange.duplicate();fromStart.moveToElementText(node);fromStart.setEndPoint("EndToStart", selectedRange);var startOffset=fromStart.text.length;var endOffset=startOffset + selectedLength;return {start:startOffset, end:endOffset};}function getModernOffsets(node){var selection=window.getSelection && window.getSelection();if(!selection || selection.rangeCount === 0){return null;}var anchorNode=selection.anchorNode;var anchorOffset=selection.anchorOffset;var focusNode=selection.focusNode;var focusOffset=selection.focusOffset;var currentRange=selection.getRangeAt(0);var isSelectionCollapsed=isCollapsed(selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset);var rangeLength=isSelectionCollapsed?0:currentRange.toString().length;var tempRange=currentRange.cloneRange();tempRange.selectNodeContents(node);tempRange.setEnd(currentRange.startContainer, currentRange.startOffset);var isTempRangeCollapsed=isCollapsed(tempRange.startContainer, tempRange.startOffset, tempRange.endContainer, tempRange.endOffset);var start=isTempRangeCollapsed?0:tempRange.toString().length;var end=start + rangeLength;var detectionRange=document.createRange();detectionRange.setStart(anchorNode, anchorOffset);detectionRange.setEnd(focusNode, focusOffset);var isBackward=detectionRange.collapsed;return {start:isBackward?end:start, end:isBackward?start:end};}function setIEOffsets(node, offsets){var range=document.selection.createRange().duplicate();var start, end;if(typeof offsets.end === "undefined"){start = offsets.start;end = start;}else if(offsets.start > offsets.end){start = offsets.end;end = offsets.start;}else {start = offsets.start;end = offsets.end;}range.moveToElementText(node);range.moveStart("character", start);range.setEndPoint("EndToStart", range);range.moveEnd("character", end - start);range.select();}function setModernOffsets(node, offsets){if(!window.getSelection){return;}var selection=window.getSelection();var length=node[getTextContentAccessor()].length;var start=Math.min(offsets.start, length);var end=typeof offsets.end === "undefined"?start:Math.min(offsets.end, length);if(!selection.extend && start > end){var temp=end;end = start;start = temp;}var startMarker=getNodeForCharacterOffset(node, start);var endMarker=getNodeForCharacterOffset(node, end);if(startMarker && endMarker){var range=document.createRange();range.setStart(startMarker.node, startMarker.offset);selection.removeAllRanges();if(start > end){selection.addRange(range);selection.extend(endMarker.node, endMarker.offset);}else {range.setEnd(endMarker.node, endMarker.offset);selection.addRange(range);}}}var useIEOffsets=ExecutionEnvironment.canUseDOM && "selection" in document && !("getSelection" in window);var ReactDOMSelection={getOffsets:useIEOffsets?getIEOffsets:getModernOffsets, setOffsets:useIEOffsets?setIEOffsets:setModernOffsets};module.exports = ReactDOMSelection;}, {"128":128, "130":130, "21":21}], 51:[function(_dereq_, module, exports){"use strict";var DOMPropertyOperations=_dereq_(11);var ReactComponentBrowserEnvironment=_dereq_(35);var ReactDOMComponent=_dereq_(42);var assign=_dereq_(27);var escapeTextContentForBrowser=_dereq_(116);var ReactDOMTextComponent=function ReactDOMTextComponent(props){};assign(ReactDOMTextComponent.prototype, {construct:function construct(text){this._currentElement = text;this._stringText = "" + text;this._rootNodeID = null;this._mountIndex = 0;}, mountComponent:function mountComponent(rootID, transaction, context){this._rootNodeID = rootID;var escapedText=escapeTextContentForBrowser(this._stringText);if(transaction.renderToStaticMarkup){return escapedText;}return "<span " + DOMPropertyOperations.createMarkupForID(rootID) + ">" + escapedText + "</span>";}, receiveComponent:function receiveComponent(nextText, transaction){if(nextText !== this._currentElement){this._currentElement = nextText;var nextStringText="" + nextText;if(nextStringText !== this._stringText){this._stringText = nextStringText;ReactDOMComponent.BackendIDOperations.updateTextContentByID(this._rootNodeID, nextStringText);}}}, unmountComponent:function unmountComponent(){ReactComponentBrowserEnvironment.unmountIDFromEnvironment(this._rootNodeID);}});module.exports = ReactDOMTextComponent;}, {"11":11, "116":116, "27":27, "35":35, "42":42}], 52:[function(_dereq_, module, exports){"use strict";var AutoFocusMixin=_dereq_(2);var DOMPropertyOperations=_dereq_(11);var LinkedValueUtils=_dereq_(24);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var invariant=_dereq_(135);var warning=_dereq_(154);var textarea=ReactElement.createFactory("textarea");function forceUpdateIfMounted(){if(this.isMounted()){this.forceUpdate();}}var ReactDOMTextarea=ReactClass.createClass({displayName:"ReactDOMTextarea", tagName:"TEXTAREA", mixins:[AutoFocusMixin, LinkedValueUtils.Mixin, ReactBrowserComponentMixin], getInitialState:function getInitialState(){var defaultValue=this.props.defaultValue;var children=this.props.children;if(children != null){if("production" !== "development"){"production" !== "development"?warning(false, "Use the `defaultValue` or `value` props instead of setting " + "children on <textarea>."):null;}"production" !== "development"?invariant(defaultValue == null, "If you supply `defaultValue` on a <textarea>, do not pass children."):invariant(defaultValue == null);if(Array.isArray(children)){"production" !== "development"?invariant(children.length <= 1, "<textarea> can only have at most one child."):invariant(children.length <= 1);children = children[0];}defaultValue = "" + children;}if(defaultValue == null){defaultValue = "";}var value=LinkedValueUtils.getValue(this);return {initialValue:"" + (value != null?value:defaultValue)};}, render:function render(){var props=assign({}, this.props);"production" !== "development"?invariant(props.dangerouslySetInnerHTML == null, "`dangerouslySetInnerHTML` does not make sense on <textarea>."):invariant(props.dangerouslySetInnerHTML == null);props.defaultValue = null;props.value = null;props.onChange = this._handleChange;return textarea(props, this.state.initialValue);}, componentDidUpdate:function componentDidUpdate(prevProps, prevState, prevContext){var value=LinkedValueUtils.getValue(this);if(value != null){var rootNode=this.getDOMNode();DOMPropertyOperations.setValueForProperty(rootNode, "value", "" + value);}}, _handleChange:function _handleChange(event){var returnValue;var onChange=LinkedValueUtils.getOnChange(this);if(onChange){returnValue = onChange.call(this, event);}ReactUpdates.asap(forceUpdateIfMounted, this);return returnValue;}});module.exports = ReactDOMTextarea;}, {"11":11, "135":135, "154":154, "2":2, "24":24, "27":27, "29":29, "33":33, "57":57, "87":87}], 53:[function(_dereq_, module, exports){"use strict";var ReactUpdates=_dereq_(87);var Transaction=_dereq_(103);var assign=_dereq_(27);var emptyFunction=_dereq_(114);var RESET_BATCHED_UPDATES={initialize:emptyFunction, close:function close(){ReactDefaultBatchingStrategy.isBatchingUpdates = false;}};var FLUSH_BATCHED_UPDATES={initialize:emptyFunction, close:ReactUpdates.flushBatchedUpdates.bind(ReactUpdates)};var TRANSACTION_WRAPPERS=[FLUSH_BATCHED_UPDATES, RESET_BATCHED_UPDATES];function ReactDefaultBatchingStrategyTransaction(){this.reinitializeTransaction();}assign(ReactDefaultBatchingStrategyTransaction.prototype, Transaction.Mixin, {getTransactionWrappers:function getTransactionWrappers(){return TRANSACTION_WRAPPERS;}});var transaction=new ReactDefaultBatchingStrategyTransaction();var ReactDefaultBatchingStrategy={isBatchingUpdates:false, batchedUpdates:function batchedUpdates(callback, a, b, c, d){var alreadyBatchingUpdates=ReactDefaultBatchingStrategy.isBatchingUpdates;ReactDefaultBatchingStrategy.isBatchingUpdates = true;if(alreadyBatchingUpdates){callback(a, b, c, d);}else {transaction.perform(callback, null, a, b, c, d);}}};module.exports = ReactDefaultBatchingStrategy;}, {"103":103, "114":114, "27":27, "87":87}], 54:[function(_dereq_, module, exports){"use strict";var BeforeInputEventPlugin=_dereq_(3);var ChangeEventPlugin=_dereq_(7);var ClientReactRootIndex=_dereq_(8);var DefaultEventPluginOrder=_dereq_(13);var EnterLeaveEventPlugin=_dereq_(14);var ExecutionEnvironment=_dereq_(21);var HTMLDOMPropertyConfig=_dereq_(23);var MobileSafariClickEventPlugin=_dereq_(26);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactComponentBrowserEnvironment=_dereq_(35);var ReactDefaultBatchingStrategy=_dereq_(53);var ReactDOMComponent=_dereq_(42);var ReactDOMButton=_dereq_(41);var ReactDOMForm=_dereq_(43);var ReactDOMImg=_dereq_(46);var ReactDOMIDOperations=_dereq_(44);var ReactDOMIframe=_dereq_(45);var ReactDOMInput=_dereq_(47);var ReactDOMOption=_dereq_(48);var ReactDOMSelect=_dereq_(49);var ReactDOMTextarea=_dereq_(52);var ReactDOMTextComponent=_dereq_(51);var ReactElement=_dereq_(57);var ReactEventListener=_dereq_(62);var ReactInjection=_dereq_(64);var ReactInstanceHandles=_dereq_(66);var ReactMount=_dereq_(70);var ReactReconcileTransaction=_dereq_(80);var SelectEventPlugin=_dereq_(89);var ServerReactRootIndex=_dereq_(90);var SimpleEventPlugin=_dereq_(91);var SVGDOMPropertyConfig=_dereq_(88);var createFullPageComponent=_dereq_(111);function autoGenerateWrapperClass(type){return ReactClass.createClass({tagName:type.toUpperCase(), render:function render(){return new ReactElement(type, null, null, null, null, this.props);}});}function inject(){ReactInjection.EventEmitter.injectReactEventListener(ReactEventListener);ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);ReactInjection.EventPluginHub.injectInstanceHandle(ReactInstanceHandles);ReactInjection.EventPluginHub.injectMount(ReactMount);ReactInjection.EventPluginHub.injectEventPluginsByName({SimpleEventPlugin:SimpleEventPlugin, EnterLeaveEventPlugin:EnterLeaveEventPlugin, ChangeEventPlugin:ChangeEventPlugin, MobileSafariClickEventPlugin:MobileSafariClickEventPlugin, SelectEventPlugin:SelectEventPlugin, BeforeInputEventPlugin:BeforeInputEventPlugin});ReactInjection.NativeComponent.injectGenericComponentClass(ReactDOMComponent);ReactInjection.NativeComponent.injectTextComponentClass(ReactDOMTextComponent);ReactInjection.NativeComponent.injectAutoWrapper(autoGenerateWrapperClass);ReactInjection.Class.injectMixin(ReactBrowserComponentMixin);ReactInjection.NativeComponent.injectComponentClasses({"button":ReactDOMButton, "form":ReactDOMForm, "iframe":ReactDOMIframe, "img":ReactDOMImg, "input":ReactDOMInput, "option":ReactDOMOption, "select":ReactDOMSelect, "textarea":ReactDOMTextarea, "html":createFullPageComponent("html"), "head":createFullPageComponent("head"), "body":createFullPageComponent("body")});ReactInjection.DOMProperty.injectDOMPropertyConfig(HTMLDOMPropertyConfig);ReactInjection.DOMProperty.injectDOMPropertyConfig(SVGDOMPropertyConfig);ReactInjection.EmptyComponent.injectEmptyComponent("noscript");ReactInjection.Updates.injectReconcileTransaction(ReactReconcileTransaction);ReactInjection.Updates.injectBatchingStrategy(ReactDefaultBatchingStrategy);ReactInjection.RootIndex.injectCreateReactRootIndex(ExecutionEnvironment.canUseDOM?ClientReactRootIndex.createReactRootIndex:ServerReactRootIndex.createReactRootIndex);ReactInjection.Component.injectEnvironment(ReactComponentBrowserEnvironment);ReactInjection.DOMComponent.injectIDOperations(ReactDOMIDOperations);if("production" !== "development"){var url=ExecutionEnvironment.canUseDOM && window.location.href || "";if(/[?&]react_perf\b/.test(url)){var ReactDefaultPerf=_dereq_(55);ReactDefaultPerf.start();}}}module.exports = {inject:inject};}, {"111":111, "13":13, "14":14, "21":21, "23":23, "26":26, "29":29, "3":3, "33":33, "35":35, "41":41, "42":42, "43":43, "44":44, "45":45, "46":46, "47":47, "48":48, "49":49, "51":51, "52":52, "53":53, "55":55, "57":57, "62":62, "64":64, "66":66, "7":7, "70":70, "8":8, "80":80, "88":88, "89":89, "90":90, "91":91}], 55:[function(_dereq_, module, exports){"use strict";var DOMProperty=_dereq_(10);var ReactDefaultPerfAnalysis=_dereq_(56);var ReactMount=_dereq_(70);var ReactPerf=_dereq_(75);var performanceNow=_dereq_(146);function roundFloat(val){return Math.floor(val * 100) / 100;}function addValue(obj, key, val){obj[key] = (obj[key] || 0) + val;}var ReactDefaultPerf={_allMeasurements:[], _mountStack:[0], _injected:false, start:function start(){if(!ReactDefaultPerf._injected){ReactPerf.injection.injectMeasure(ReactDefaultPerf.measure);}ReactDefaultPerf._allMeasurements.length = 0;ReactPerf.enableMeasure = true;}, stop:function stop(){ReactPerf.enableMeasure = false;}, getLastMeasurements:function getLastMeasurements(){return ReactDefaultPerf._allMeasurements;}, printExclusive:function printExclusive(measurements){measurements = measurements || ReactDefaultPerf._allMeasurements;var summary=ReactDefaultPerfAnalysis.getExclusiveSummary(measurements);console.table(summary.map(function(item){return {"Component class name":item.componentName, "Total inclusive time (ms)":roundFloat(item.inclusive), "Exclusive mount time (ms)":roundFloat(item.exclusive), "Exclusive render time (ms)":roundFloat(item.render), "Mount time per instance (ms)":roundFloat(item.exclusive / item.count), "Render time per instance (ms)":roundFloat(item.render / item.count), "Instances":item.count};}));}, printInclusive:function printInclusive(measurements){measurements = measurements || ReactDefaultPerf._allMeasurements;var summary=ReactDefaultPerfAnalysis.getInclusiveSummary(measurements);console.table(summary.map(function(item){return {"Owner > component":item.componentName, "Inclusive time (ms)":roundFloat(item.time), "Instances":item.count};}));console.log("Total time:", ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + " ms");}, getMeasurementsSummaryMap:function getMeasurementsSummaryMap(measurements){var summary=ReactDefaultPerfAnalysis.getInclusiveSummary(measurements, true);return summary.map(function(item){return {"Owner > component":item.componentName, "Wasted time (ms)":item.time, "Instances":item.count};});}, printWasted:function printWasted(measurements){measurements = measurements || ReactDefaultPerf._allMeasurements;console.table(ReactDefaultPerf.getMeasurementsSummaryMap(measurements));console.log("Total time:", ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + " ms");}, printDOM:function printDOM(measurements){measurements = measurements || ReactDefaultPerf._allMeasurements;var summary=ReactDefaultPerfAnalysis.getDOMSummary(measurements);console.table(summary.map(function(item){var result={};result[DOMProperty.ID_ATTRIBUTE_NAME] = item.id;result["type"] = item.type;result["args"] = JSON.stringify(item.args);return result;}));console.log("Total time:", ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + " ms");}, _recordWrite:function _recordWrite(id, fnName, totalTime, args){var writes=ReactDefaultPerf._allMeasurements[ReactDefaultPerf._allMeasurements.length - 1].writes;writes[id] = writes[id] || [];writes[id].push({type:fnName, time:totalTime, args:args});}, measure:function measure(moduleName, fnName, func){return function(){for(var args=[], $__0=0, $__1=arguments.length; $__0 < $__1; $__0++) args.push(arguments[$__0]);var totalTime;var rv;var start;if(fnName === "_renderNewRootComponent" || fnName === "flushBatchedUpdates"){ReactDefaultPerf._allMeasurements.push({exclusive:{}, inclusive:{}, render:{}, counts:{}, writes:{}, displayNames:{}, totalTime:0});start = performanceNow();rv = func.apply(this, args);ReactDefaultPerf._allMeasurements[ReactDefaultPerf._allMeasurements.length - 1].totalTime = performanceNow() - start;return rv;}else if(fnName === "_mountImageIntoNode" || moduleName === "ReactDOMIDOperations"){start = performanceNow();rv = func.apply(this, args);totalTime = performanceNow() - start;if(fnName === "_mountImageIntoNode"){var mountID=ReactMount.getID(args[1]);ReactDefaultPerf._recordWrite(mountID, fnName, totalTime, args[0]);}else if(fnName === "dangerouslyProcessChildrenUpdates"){args[0].forEach(function(update){var writeArgs={};if(update.fromIndex !== null){writeArgs.fromIndex = update.fromIndex;}if(update.toIndex !== null){writeArgs.toIndex = update.toIndex;}if(update.textContent !== null){writeArgs.textContent = update.textContent;}if(update.markupIndex !== null){writeArgs.markup = args[1][update.markupIndex];}ReactDefaultPerf._recordWrite(update.parentID, update.type, totalTime, writeArgs);});}else {ReactDefaultPerf._recordWrite(args[0], fnName, totalTime, Array.prototype.slice.call(args, 1));}return rv;}else if(moduleName === "ReactCompositeComponent" && (fnName === "mountComponent" || fnName === "updateComponent" || fnName === "_renderValidatedComponent")){if(typeof this._currentElement.type === "string"){return func.apply(this, args);}var rootNodeID=fnName === "mountComponent"?args[0]:this._rootNodeID;var isRender=fnName === "_renderValidatedComponent";var isMount=fnName === "mountComponent";var mountStack=ReactDefaultPerf._mountStack;var entry=ReactDefaultPerf._allMeasurements[ReactDefaultPerf._allMeasurements.length - 1];if(isRender){addValue(entry.counts, rootNodeID, 1);}else if(isMount){mountStack.push(0);}start = performanceNow();rv = func.apply(this, args);totalTime = performanceNow() - start;if(isRender){addValue(entry.render, rootNodeID, totalTime);}else if(isMount){var subMountTime=mountStack.pop();mountStack[mountStack.length - 1] += totalTime;addValue(entry.exclusive, rootNodeID, totalTime - subMountTime);addValue(entry.inclusive, rootNodeID, totalTime);}else {addValue(entry.inclusive, rootNodeID, totalTime);}entry.displayNames[rootNodeID] = {current:this.getName(), owner:this._currentElement._owner?this._currentElement._owner.getName():"<root>"};return rv;}else {return func.apply(this, args);}};}};module.exports = ReactDefaultPerf;}, {"10":10, "146":146, "56":56, "70":70, "75":75}], 56:[function(_dereq_, module, exports){var assign=_dereq_(27);var DONT_CARE_THRESHOLD=1.2;var DOM_OPERATION_TYPES={"_mountImageIntoNode":"set innerHTML", INSERT_MARKUP:"set innerHTML", MOVE_EXISTING:"move", REMOVE_NODE:"remove", TEXT_CONTENT:"set textContent", "updatePropertyByID":"update attribute", "deletePropertyByID":"delete attribute", "updateStylesByID":"update styles", "updateInnerHTMLByID":"set innerHTML", "dangerouslyReplaceNodeWithMarkupByID":"replace"};function getTotalTime(measurements){var totalTime=0;for(var i=0; i < measurements.length; i++) {var measurement=measurements[i];totalTime += measurement.totalTime;}return totalTime;}function getDOMSummary(measurements){var items=[];for(var i=0; i < measurements.length; i++) {var measurement=measurements[i];var id;for(id in measurement.writes) {measurement.writes[id].forEach(function(write){items.push({id:id, type:DOM_OPERATION_TYPES[write.type] || write.type, args:write.args});});}}return items;}function getExclusiveSummary(measurements){var candidates={};var displayName;for(var i=0; i < measurements.length; i++) {var measurement=measurements[i];var allIDs=assign({}, measurement.exclusive, measurement.inclusive);for(var id in allIDs) {displayName = measurement.displayNames[id].current;candidates[displayName] = candidates[displayName] || {componentName:displayName, inclusive:0, exclusive:0, render:0, count:0};if(measurement.render[id]){candidates[displayName].render += measurement.render[id];}if(measurement.exclusive[id]){candidates[displayName].exclusive += measurement.exclusive[id];}if(measurement.inclusive[id]){candidates[displayName].inclusive += measurement.inclusive[id];}if(measurement.counts[id]){candidates[displayName].count += measurement.counts[id];}}}var arr=[];for(displayName in candidates) {if(candidates[displayName].exclusive >= DONT_CARE_THRESHOLD){arr.push(candidates[displayName]);}}arr.sort(function(a, b){return b.exclusive - a.exclusive;});return arr;}function getInclusiveSummary(measurements, onlyClean){var candidates={};var inclusiveKey;for(var i=0; i < measurements.length; i++) {var measurement=measurements[i];var allIDs=assign({}, measurement.exclusive, measurement.inclusive);var cleanComponents;if(onlyClean){cleanComponents = getUnchangedComponents(measurement);}for(var id in allIDs) {if(onlyClean && !cleanComponents[id]){continue;}var displayName=measurement.displayNames[id];inclusiveKey = displayName.owner + " > " + displayName.current;candidates[inclusiveKey] = candidates[inclusiveKey] || {componentName:inclusiveKey, time:0, count:0};if(measurement.inclusive[id]){candidates[inclusiveKey].time += measurement.inclusive[id];}if(measurement.counts[id]){candidates[inclusiveKey].count += measurement.counts[id];}}}var arr=[];for(inclusiveKey in candidates) {if(candidates[inclusiveKey].time >= DONT_CARE_THRESHOLD){arr.push(candidates[inclusiveKey]);}}arr.sort(function(a, b){return b.time - a.time;});return arr;}function getUnchangedComponents(measurement){var cleanComponents={};var dirtyLeafIDs=Object.keys(measurement.writes);var allIDs=assign({}, measurement.exclusive, measurement.inclusive);for(var id in allIDs) {var isDirty=false;for(var i=0; i < dirtyLeafIDs.length; i++) {if(dirtyLeafIDs[i].indexOf(id) === 0){isDirty = true;break;}}if(!isDirty && measurement.counts[id] > 0){cleanComponents[id] = true;}}return cleanComponents;}var ReactDefaultPerfAnalysis={getExclusiveSummary:getExclusiveSummary, getInclusiveSummary:getInclusiveSummary, getDOMSummary:getDOMSummary, getTotalTime:getTotalTime};module.exports = ReactDefaultPerfAnalysis;}, {"27":27}], 57:[function(_dereq_, module, exports){"use strict";var ReactContext=_dereq_(38);var ReactCurrentOwner=_dereq_(39);var assign=_dereq_(27);var warning=_dereq_(154);var RESERVED_PROPS={key:true, ref:true};function defineWarningProperty(object, key){Object.defineProperty(object, key, {configurable:false, enumerable:true, get:function get(){if(!this._store){return null;}return this._store[key];}, set:function set(value){"production" !== "development"?warning(false, "Don't set the %s property of the React element. Instead, " + "specify the correct value when initially creating the element.", key):null;this._store[key] = value;}});}var useMutationMembrane=false;function defineMutationMembrane(prototype){try{var pseudoFrozenProperties={props:true};for(var key in pseudoFrozenProperties) {defineWarningProperty(prototype, key);}useMutationMembrane = true;}catch(x) {}}var ReactElement=function ReactElement(type, key, ref, owner, context, props){this.type = type;this.key = key;this.ref = ref;this._owner = owner;this._context = context;if("production" !== "development"){this._store = {props:props, originalProps:assign({}, props)};try{Object.defineProperty(this._store, "validated", {configurable:false, enumerable:false, writable:true});}catch(x) {}this._store.validated = false;if(useMutationMembrane){Object.freeze(this);return;}}this.props = props;};ReactElement.prototype = {_isReactElement:true};if("production" !== "development"){defineMutationMembrane(ReactElement.prototype);}ReactElement.createElement = function(type, config, children){var propName;var props={};var key=null;var ref=null;if(config != null){ref = config.ref === undefined?null:config.ref;key = config.key === undefined?null:"" + config.key;for(propName in config) {if(config.hasOwnProperty(propName) && !RESERVED_PROPS.hasOwnProperty(propName)){props[propName] = config[propName];}}}var childrenLength=arguments.length - 2;if(childrenLength === 1){props.children = children;}else if(childrenLength > 1){var childArray=Array(childrenLength);for(var i=0; i < childrenLength; i++) {childArray[i] = arguments[i + 2];}props.children = childArray;}if(type && type.defaultProps){var defaultProps=type.defaultProps;for(propName in defaultProps) {if(typeof props[propName] === "undefined"){props[propName] = defaultProps[propName];}}}return new ReactElement(type, key, ref, ReactCurrentOwner.current, ReactContext.current, props);};ReactElement.createFactory = function(type){var factory=ReactElement.createElement.bind(null, type);factory.type = type;return factory;};ReactElement.cloneAndReplaceProps = function(oldElement, newProps){var newElement=new ReactElement(oldElement.type, oldElement.key, oldElement.ref, oldElement._owner, oldElement._context, newProps);if("production" !== "development"){newElement._store.validated = oldElement._store.validated;}return newElement;};ReactElement.cloneElement = function(element, config, children){var propName;var props=assign({}, element.props);var key=element.key;var ref=element.ref;var owner=element._owner;if(config != null){if(config.ref !== undefined){ref = config.ref;owner = ReactCurrentOwner.current;}if(config.key !== undefined){key = "" + config.key;}for(propName in config) {if(config.hasOwnProperty(propName) && !RESERVED_PROPS.hasOwnProperty(propName)){props[propName] = config[propName];}}}var childrenLength=arguments.length - 2;if(childrenLength === 1){props.children = children;}else if(childrenLength > 1){var childArray=Array(childrenLength);for(var i=0; i < childrenLength; i++) {childArray[i] = arguments[i + 2];}props.children = childArray;}return new ReactElement(element.type, key, ref, owner, element._context, props);};ReactElement.isValidElement = function(object){var isElement=!!(object && object._isReactElement);return isElement;};module.exports = ReactElement;}, {"154":154, "27":27, "38":38, "39":39}], 58:[function(_dereq_, module, exports){"use strict";var ReactElement=_dereq_(57);var ReactFragment=_dereq_(63);var ReactPropTypeLocations=_dereq_(77);var ReactPropTypeLocationNames=_dereq_(76);var ReactCurrentOwner=_dereq_(39);var ReactNativeComponent=_dereq_(73);var getIteratorFn=_dereq_(126);var invariant=_dereq_(135);var warning=_dereq_(154);function getDeclarationErrorAddendum(){if(ReactCurrentOwner.current){var name=ReactCurrentOwner.current.getName();if(name){return " Check the render method of `" + name + "`.";}}return "";}var ownerHasKeyUseWarning={};var loggedTypeFailures={};var NUMERIC_PROPERTY_REGEX=/^\d+$/;function getName(instance){var publicInstance=instance && instance.getPublicInstance();if(!publicInstance){return undefined;}var constructor=publicInstance.constructor;if(!constructor){return undefined;}return constructor.displayName || constructor.name || undefined;}function getCurrentOwnerDisplayName(){var current=ReactCurrentOwner.current;return current && getName(current) || undefined;}function validateExplicitKey(element, parentType){if(element._store.validated || element.key != null){return;}element._store.validated = true;warnAndMonitorForKeyUse("Each child in an array or iterator should have a unique \"key\" prop.", element, parentType);}function validatePropertyKey(name, element, parentType){if(!NUMERIC_PROPERTY_REGEX.test(name)){return;}warnAndMonitorForKeyUse("Child objects should have non-numeric keys so ordering is preserved.", element, parentType);}function warnAndMonitorForKeyUse(message, element, parentType){var ownerName=getCurrentOwnerDisplayName();var parentName=typeof parentType === "string"?parentType:parentType.displayName || parentType.name;var useName=ownerName || parentName;var memoizer=ownerHasKeyUseWarning[message] || (ownerHasKeyUseWarning[message] = {});if(memoizer.hasOwnProperty(useName)){return;}memoizer[useName] = true;var parentOrOwnerAddendum=ownerName?" Check the render method of " + ownerName + ".":parentName?" Check the React.render call using <" + parentName + ">.":"";var childOwnerAddendum="";if(element && element._owner && element._owner !== ReactCurrentOwner.current){var childOwnerName=getName(element._owner);childOwnerAddendum = " It was passed a child from " + childOwnerName + ".";}"production" !== "development"?warning(false, message + "%s%s See https://fb.me/react-warning-keys for more information.", parentOrOwnerAddendum, childOwnerAddendum):null;}function validateChildKeys(node, parentType){if(Array.isArray(node)){for(var i=0; i < node.length; i++) {var child=node[i];if(ReactElement.isValidElement(child)){validateExplicitKey(child, parentType);}}}else if(ReactElement.isValidElement(node)){node._store.validated = true;}else if(node){var iteratorFn=getIteratorFn(node);if(iteratorFn){if(iteratorFn !== node.entries){var iterator=iteratorFn.call(node);var step;while(!(step = iterator.next()).done) {if(ReactElement.isValidElement(step.value)){validateExplicitKey(step.value, parentType);}}}}else if(typeof node === "object"){var fragment=ReactFragment.extractIfFragment(node);for(var key in fragment) {if(fragment.hasOwnProperty(key)){validatePropertyKey(key, fragment[key], parentType);}}}}}function checkPropTypes(componentName, propTypes, props, location){for(var propName in propTypes) {if(propTypes.hasOwnProperty(propName)){var error;try{"production" !== "development"?invariant(typeof propTypes[propName] === "function", "%s: %s type `%s` is invalid; it must be a function, usually from " + "React.PropTypes.", componentName || "React class", ReactPropTypeLocationNames[location], propName):invariant(typeof propTypes[propName] === "function");error = propTypes[propName](props, propName, componentName, location);}catch(ex) {error = ex;}if(error instanceof Error && !(error.message in loggedTypeFailures)){loggedTypeFailures[error.message] = true;var addendum=getDeclarationErrorAddendum(this);"production" !== "development"?warning(false, "Failed propType: %s%s", error.message, addendum):null;}}}}var warnedPropsMutations={};function warnForPropsMutation(propName, element){var type=element.type;var elementName=typeof type === "string"?type:type.displayName;var ownerName=element._owner?element._owner.getPublicInstance().constructor.displayName:null;var warningKey=propName + "|" + elementName + "|" + ownerName;if(warnedPropsMutations.hasOwnProperty(warningKey)){return;}warnedPropsMutations[warningKey] = true;var elementInfo="";if(elementName){elementInfo = " <" + elementName + " />";}var ownerInfo="";if(ownerName){ownerInfo = " The element was created by " + ownerName + ".";}"production" !== "development"?warning(false, "Don't set .props.%s of the React component%s. Instead, specify the " + "correct value when initially creating the element or use " + "React.cloneElement to make a new element with updated props.%s", propName, elementInfo, ownerInfo):null;}function is(a, b){if(a !== a){return b !== b;}if(a === 0 && b === 0){return 1 / a === 1 / b;}return a === b;}function checkAndWarnForMutatedProps(element){if(!element._store){return;}var originalProps=element._store.originalProps;var props=element.props;for(var propName in props) {if(props.hasOwnProperty(propName)){if(!originalProps.hasOwnProperty(propName) || !is(originalProps[propName], props[propName])){warnForPropsMutation(propName, element);originalProps[propName] = props[propName];}}}}function validatePropTypes(element){if(element.type == null){return;}var componentClass=ReactNativeComponent.getComponentClassForElement(element);var name=componentClass.displayName || componentClass.name;if(componentClass.propTypes){checkPropTypes(name, componentClass.propTypes, element.props, ReactPropTypeLocations.prop);}if(typeof componentClass.getDefaultProps === "function"){"production" !== "development"?warning(componentClass.getDefaultProps.isReactClassApproved, "getDefaultProps is only used on classic React.createClass " + "definitions. Use a static property named `defaultProps` instead."):null;}}var ReactElementValidator={checkAndWarnForMutatedProps:checkAndWarnForMutatedProps, createElement:function createElement(type, props, children){"production" !== "development"?warning(type != null, "React.createElement: type should not be null or undefined. It should " + "be a string (for DOM elements) or a ReactClass (for composite " + "components)."):null;var element=ReactElement.createElement.apply(this, arguments);if(element == null){return element;}for(var i=2; i < arguments.length; i++) {validateChildKeys(arguments[i], type);}validatePropTypes(element);return element;}, createFactory:function createFactory(type){var validatedFactory=ReactElementValidator.createElement.bind(null, type);validatedFactory.type = type;if("production" !== "development"){try{Object.defineProperty(validatedFactory, "type", {enumerable:false, get:function get(){"production" !== "development"?warning(false, "Factory.type is deprecated. Access the class directly " + "before passing it to createFactory."):null;Object.defineProperty(this, "type", {value:type});return type;}});}catch(x) {}}return validatedFactory;}, cloneElement:function cloneElement(element, props, children){var newElement=ReactElement.cloneElement.apply(this, arguments);for(var i=2; i < arguments.length; i++) {validateChildKeys(arguments[i], newElement.type);}validatePropTypes(newElement);return newElement;}};module.exports = ReactElementValidator;}, {"126":126, "135":135, "154":154, "39":39, "57":57, "63":63, "73":73, "76":76, "77":77}], 59:[function(_dereq_, module, exports){"use strict";var ReactElement=_dereq_(57);var ReactInstanceMap=_dereq_(67);var invariant=_dereq_(135);var component;var nullComponentIDsRegistry={};var ReactEmptyComponentInjection={injectEmptyComponent:function injectEmptyComponent(emptyComponent){component = ReactElement.createFactory(emptyComponent);}};var ReactEmptyComponentType=function ReactEmptyComponentType(){};ReactEmptyComponentType.prototype.componentDidMount = function(){var internalInstance=ReactInstanceMap.get(this);if(!internalInstance){return;}registerNullComponentID(internalInstance._rootNodeID);};ReactEmptyComponentType.prototype.componentWillUnmount = function(){var internalInstance=ReactInstanceMap.get(this);if(!internalInstance){return;}deregisterNullComponentID(internalInstance._rootNodeID);};ReactEmptyComponentType.prototype.render = function(){"production" !== "development"?invariant(component, "Trying to return null from a render, but no null placeholder component " + "was injected."):invariant(component);return component();};var emptyElement=ReactElement.createElement(ReactEmptyComponentType);function registerNullComponentID(id){nullComponentIDsRegistry[id] = true;}function deregisterNullComponentID(id){delete nullComponentIDsRegistry[id];}function isNullComponentID(id){return !!nullComponentIDsRegistry[id];}var ReactEmptyComponent={emptyElement:emptyElement, injection:ReactEmptyComponentInjection, isNullComponentID:isNullComponentID};module.exports = ReactEmptyComponent;}, {"135":135, "57":57, "67":67}], 60:[function(_dereq_, module, exports){"use strict";var ReactErrorUtils={guard:function guard(func, name){return func;}};module.exports = ReactErrorUtils;}, {}], 61:[function(_dereq_, module, exports){"use strict";var EventPluginHub=_dereq_(17);function runEventQueueInBatch(events){EventPluginHub.enqueueEvents(events);EventPluginHub.processEventQueue();}var ReactEventEmitterMixin={handleTopLevel:function handleTopLevel(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent){var events=EventPluginHub.extractEvents(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent);runEventQueueInBatch(events);}};module.exports = ReactEventEmitterMixin;}, {"17":17}], 62:[function(_dereq_, module, exports){"use strict";var EventListener=_dereq_(16);var ExecutionEnvironment=_dereq_(21);var PooledClass=_dereq_(28);var ReactInstanceHandles=_dereq_(66);var ReactMount=_dereq_(70);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var getEventTarget=_dereq_(125);var getUnboundedScrollPosition=_dereq_(131);function findParent(node){var nodeID=ReactMount.getID(node);var rootID=ReactInstanceHandles.getReactRootIDFromNodeID(nodeID);var container=ReactMount.findReactContainerForID(rootID);var parent=ReactMount.getFirstReactDOM(container);return parent;}function TopLevelCallbackBookKeeping(topLevelType, nativeEvent){this.topLevelType = topLevelType;this.nativeEvent = nativeEvent;this.ancestors = [];}assign(TopLevelCallbackBookKeeping.prototype, {destructor:function destructor(){this.topLevelType = null;this.nativeEvent = null;this.ancestors.length = 0;}});PooledClass.addPoolingTo(TopLevelCallbackBookKeeping, PooledClass.twoArgumentPooler);function handleTopLevelImpl(bookKeeping){var topLevelTarget=ReactMount.getFirstReactDOM(getEventTarget(bookKeeping.nativeEvent)) || window;var ancestor=topLevelTarget;while(ancestor) {bookKeeping.ancestors.push(ancestor);ancestor = findParent(ancestor);}for(var i=0, l=bookKeeping.ancestors.length; i < l; i++) {topLevelTarget = bookKeeping.ancestors[i];var topLevelTargetID=ReactMount.getID(topLevelTarget) || "";ReactEventListener._handleTopLevel(bookKeeping.topLevelType, topLevelTarget, topLevelTargetID, bookKeeping.nativeEvent);}}function scrollValueMonitor(cb){var scrollPosition=getUnboundedScrollPosition(window);cb(scrollPosition);}var ReactEventListener={_enabled:true, _handleTopLevel:null, WINDOW_HANDLE:ExecutionEnvironment.canUseDOM?window:null, setHandleTopLevel:function setHandleTopLevel(handleTopLevel){ReactEventListener._handleTopLevel = handleTopLevel;}, setEnabled:function setEnabled(enabled){ReactEventListener._enabled = !!enabled;}, isEnabled:function isEnabled(){return ReactEventListener._enabled;}, trapBubbledEvent:function trapBubbledEvent(topLevelType, handlerBaseName, handle){var element=handle;if(!element){return null;}return EventListener.listen(element, handlerBaseName, ReactEventListener.dispatchEvent.bind(null, topLevelType));}, trapCapturedEvent:function trapCapturedEvent(topLevelType, handlerBaseName, handle){var element=handle;if(!element){return null;}return EventListener.capture(element, handlerBaseName, ReactEventListener.dispatchEvent.bind(null, topLevelType));}, monitorScrollValue:function monitorScrollValue(refresh){var callback=scrollValueMonitor.bind(null, refresh);EventListener.listen(window, "scroll", callback);}, dispatchEvent:function dispatchEvent(topLevelType, nativeEvent){if(!ReactEventListener._enabled){return;}var bookKeeping=TopLevelCallbackBookKeeping.getPooled(topLevelType, nativeEvent);try{ReactUpdates.batchedUpdates(handleTopLevelImpl, bookKeeping);}finally {TopLevelCallbackBookKeeping.release(bookKeeping);}}};module.exports = ReactEventListener;}, {"125":125, "131":131, "16":16, "21":21, "27":27, "28":28, "66":66, "70":70, "87":87}], 63:[function(_dereq_, module, exports){"use strict";var ReactElement=_dereq_(57);var warning=_dereq_(154);if("production" !== "development"){var fragmentKey="_reactFragment";var didWarnKey="_reactDidWarn";var canWarnForReactFragment=false;try{var dummy=function dummy(){return 1;};Object.defineProperty({}, fragmentKey, {enumerable:false, value:true});Object.defineProperty({}, "key", {enumerable:true, get:dummy});canWarnForReactFragment = true;}catch(x) {}var proxyPropertyAccessWithWarning=function proxyPropertyAccessWithWarning(obj, key){Object.defineProperty(obj, key, {enumerable:true, get:function get(){"production" !== "development"?warning(this[didWarnKey], "A ReactFragment is an opaque type. Accessing any of its " + "properties is deprecated. Pass it to one of the React.Children " + "helpers."):null;this[didWarnKey] = true;return this[fragmentKey][key];}, set:function set(value){"production" !== "development"?warning(this[didWarnKey], "A ReactFragment is an immutable opaque type. Mutating its " + "properties is deprecated."):null;this[didWarnKey] = true;this[fragmentKey][key] = value;}});};var issuedWarnings={};var didWarnForFragment=function didWarnForFragment(fragment){var fragmentCacheKey="";for(var key in fragment) {fragmentCacheKey += key + ":" + typeof fragment[key] + ",";}var alreadyWarnedOnce=!!issuedWarnings[fragmentCacheKey];issuedWarnings[fragmentCacheKey] = true;return alreadyWarnedOnce;};}var ReactFragment={create:function create(object){if("production" !== "development"){if(typeof object !== "object" || !object || Array.isArray(object)){"production" !== "development"?warning(false, "React.addons.createFragment only accepts a single object.", object):null;return object;}if(ReactElement.isValidElement(object)){"production" !== "development"?warning(false, "React.addons.createFragment does not accept a ReactElement " + "without a wrapper object."):null;return object;}if(canWarnForReactFragment){var proxy={};Object.defineProperty(proxy, fragmentKey, {enumerable:false, value:object});Object.defineProperty(proxy, didWarnKey, {writable:true, enumerable:false, value:false});for(var key in object) {proxyPropertyAccessWithWarning(proxy, key);}Object.preventExtensions(proxy);return proxy;}}return object;}, extract:function extract(fragment){if("production" !== "development"){if(canWarnForReactFragment){if(!fragment[fragmentKey]){"production" !== "development"?warning(didWarnForFragment(fragment), "Any use of a keyed object should be wrapped in " + "React.addons.createFragment(object) before being passed as a " + "child."):null;return fragment;}return fragment[fragmentKey];}}return fragment;}, extractIfFragment:function extractIfFragment(fragment){if("production" !== "development"){if(canWarnForReactFragment){if(fragment[fragmentKey]){return fragment[fragmentKey];}for(var key in fragment) {if(fragment.hasOwnProperty(key) && ReactElement.isValidElement(fragment[key])){return ReactFragment.extract(fragment);}}}}return fragment;}};module.exports = ReactFragment;}, {"154":154, "57":57}], 64:[function(_dereq_, module, exports){"use strict";var DOMProperty=_dereq_(10);var EventPluginHub=_dereq_(17);var ReactComponentEnvironment=_dereq_(36);var ReactClass=_dereq_(33);var ReactEmptyComponent=_dereq_(59);var ReactBrowserEventEmitter=_dereq_(30);var ReactNativeComponent=_dereq_(73);var ReactDOMComponent=_dereq_(42);var ReactPerf=_dereq_(75);var ReactRootIndex=_dereq_(83);var ReactUpdates=_dereq_(87);var ReactInjection={Component:ReactComponentEnvironment.injection, Class:ReactClass.injection, DOMComponent:ReactDOMComponent.injection, DOMProperty:DOMProperty.injection, EmptyComponent:ReactEmptyComponent.injection, EventPluginHub:EventPluginHub.injection, EventEmitter:ReactBrowserEventEmitter.injection, NativeComponent:ReactNativeComponent.injection, Perf:ReactPerf.injection, RootIndex:ReactRootIndex.injection, Updates:ReactUpdates.injection};module.exports = ReactInjection;}, {"10":10, "17":17, "30":30, "33":33, "36":36, "42":42, "59":59, "73":73, "75":75, "83":83, "87":87}], 65:[function(_dereq_, module, exports){"use strict";var ReactDOMSelection=_dereq_(50);var containsNode=_dereq_(109);var focusNode=_dereq_(119);var getActiveElement=_dereq_(121);function isInDocument(node){return containsNode(document.documentElement, node);}var ReactInputSelection={hasSelectionCapabilities:function hasSelectionCapabilities(elem){return elem && (elem.nodeName === "INPUT" && elem.type === "text" || elem.nodeName === "TEXTAREA" || elem.contentEditable === "true");}, getSelectionInformation:function getSelectionInformation(){var focusedElem=getActiveElement();return {focusedElem:focusedElem, selectionRange:ReactInputSelection.hasSelectionCapabilities(focusedElem)?ReactInputSelection.getSelection(focusedElem):null};}, restoreSelection:function restoreSelection(priorSelectionInformation){var curFocusedElem=getActiveElement();var priorFocusedElem=priorSelectionInformation.focusedElem;var priorSelectionRange=priorSelectionInformation.selectionRange;if(curFocusedElem !== priorFocusedElem && isInDocument(priorFocusedElem)){if(ReactInputSelection.hasSelectionCapabilities(priorFocusedElem)){ReactInputSelection.setSelection(priorFocusedElem, priorSelectionRange);}focusNode(priorFocusedElem);}}, getSelection:function getSelection(input){var selection;if("selectionStart" in input){selection = {start:input.selectionStart, end:input.selectionEnd};}else if(document.selection && input.nodeName === "INPUT"){var range=document.selection.createRange();if(range.parentElement() === input){selection = {start:-range.moveStart("character", -input.value.length), end:-range.moveEnd("character", -input.value.length)};}}else {selection = ReactDOMSelection.getOffsets(input);}return selection || {start:0, end:0};}, setSelection:function setSelection(input, offsets){var start=offsets.start;var end=offsets.end;if(typeof end === "undefined"){end = start;}if("selectionStart" in input){input.selectionStart = start;input.selectionEnd = Math.min(end, input.value.length);}else if(document.selection && input.nodeName === "INPUT"){var range=input.createTextRange();range.collapse(true);range.moveStart("character", start);range.moveEnd("character", end - start);range.select();}else {ReactDOMSelection.setOffsets(input, offsets);}}};module.exports = ReactInputSelection;}, {"109":109, "119":119, "121":121, "50":50}], 66:[function(_dereq_, module, exports){"use strict";var ReactRootIndex=_dereq_(83);var invariant=_dereq_(135);var SEPARATOR=".";var SEPARATOR_LENGTH=SEPARATOR.length;var MAX_TREE_DEPTH=100;function getReactRootIDString(index){return SEPARATOR + index.toString(36);}function isBoundary(id, index){return id.charAt(index) === SEPARATOR || index === id.length;}function isValidID(id){return id === "" || id.charAt(0) === SEPARATOR && id.charAt(id.length - 1) !== SEPARATOR;}function isAncestorIDOf(ancestorID, descendantID){return descendantID.indexOf(ancestorID) === 0 && isBoundary(descendantID, ancestorID.length);}function getParentID(id){return id?id.substr(0, id.lastIndexOf(SEPARATOR)):"";}function getNextDescendantID(ancestorID, destinationID){"production" !== "development"?invariant(isValidID(ancestorID) && isValidID(destinationID), "getNextDescendantID(%s, %s): Received an invalid React DOM ID.", ancestorID, destinationID):invariant(isValidID(ancestorID) && isValidID(destinationID));"production" !== "development"?invariant(isAncestorIDOf(ancestorID, destinationID), "getNextDescendantID(...): React has made an invalid assumption about " + "the DOM hierarchy. Expected `%s` to be an ancestor of `%s`.", ancestorID, destinationID):invariant(isAncestorIDOf(ancestorID, destinationID));if(ancestorID === destinationID){return ancestorID;}var start=ancestorID.length + SEPARATOR_LENGTH;var i;for(i = start; i < destinationID.length; i++) {if(isBoundary(destinationID, i)){break;}}return destinationID.substr(0, i);}function getFirstCommonAncestorID(oneID, twoID){var minLength=Math.min(oneID.length, twoID.length);if(minLength === 0){return "";}var lastCommonMarkerIndex=0;for(var i=0; i <= minLength; i++) {if(isBoundary(oneID, i) && isBoundary(twoID, i)){lastCommonMarkerIndex = i;}else if(oneID.charAt(i) !== twoID.charAt(i)){break;}}var longestCommonID=oneID.substr(0, lastCommonMarkerIndex);"production" !== "development"?invariant(isValidID(longestCommonID), "getFirstCommonAncestorID(%s, %s): Expected a valid React DOM ID: %s", oneID, twoID, longestCommonID):invariant(isValidID(longestCommonID));return longestCommonID;}function traverseParentPath(start, stop, cb, arg, skipFirst, skipLast){start = start || "";stop = stop || "";"production" !== "development"?invariant(start !== stop, "traverseParentPath(...): Cannot traverse from and to the same ID, `%s`.", start):invariant(start !== stop);var traverseUp=isAncestorIDOf(stop, start);"production" !== "development"?invariant(traverseUp || isAncestorIDOf(start, stop), "traverseParentPath(%s, %s, ...): Cannot traverse from two IDs that do " + "not have a parent path.", start, stop):invariant(traverseUp || isAncestorIDOf(start, stop));var depth=0;var traverse=traverseUp?getParentID:getNextDescendantID;for(var id=start;; id = traverse(id, stop)) {var ret;if((!skipFirst || id !== start) && (!skipLast || id !== stop)){ret = cb(id, traverseUp, arg);}if(ret === false || id === stop){break;}"production" !== "development"?invariant(depth++ < MAX_TREE_DEPTH, "traverseParentPath(%s, %s, ...): Detected an infinite loop while " + "traversing the React DOM ID tree. This may be due to malformed IDs: %s", start, stop):invariant(depth++ < MAX_TREE_DEPTH);}}var ReactInstanceHandles={createReactRootID:function createReactRootID(){return getReactRootIDString(ReactRootIndex.createReactRootIndex());}, createReactID:function createReactID(rootID, name){return rootID + name;}, getReactRootIDFromNodeID:function getReactRootIDFromNodeID(id){if(id && id.charAt(0) === SEPARATOR && id.length > 1){var index=id.indexOf(SEPARATOR, 1);return index > -1?id.substr(0, index):id;}return null;}, traverseEnterLeave:function traverseEnterLeave(leaveID, enterID, cb, upArg, downArg){var ancestorID=getFirstCommonAncestorID(leaveID, enterID);if(ancestorID !== leaveID){traverseParentPath(leaveID, ancestorID, cb, upArg, false, true);}if(ancestorID !== enterID){traverseParentPath(ancestorID, enterID, cb, downArg, true, false);}}, traverseTwoPhase:function traverseTwoPhase(targetID, cb, arg){if(targetID){traverseParentPath("", targetID, cb, arg, true, false);traverseParentPath(targetID, "", cb, arg, false, true);}}, traverseAncestors:function traverseAncestors(targetID, cb, arg){traverseParentPath("", targetID, cb, arg, true, false);}, _getFirstCommonAncestorID:getFirstCommonAncestorID, _getNextDescendantID:getNextDescendantID, isAncestorIDOf:isAncestorIDOf, SEPARATOR:SEPARATOR};module.exports = ReactInstanceHandles;}, {"135":135, "83":83}], 67:[function(_dereq_, module, exports){"use strict";var ReactInstanceMap={remove:function remove(key){key._reactInternalInstance = undefined;}, get:function get(key){return key._reactInternalInstance;}, has:function has(key){return key._reactInternalInstance !== undefined;}, set:function set(key, value){key._reactInternalInstance = value;}};module.exports = ReactInstanceMap;}, {}], 68:[function(_dereq_, module, exports){"use strict";var ReactLifeCycle={currentlyMountingInstance:null, currentlyUnmountingInstance:null};module.exports = ReactLifeCycle;}, {}], 69:[function(_dereq_, module, exports){"use strict";var adler32=_dereq_(106);var ReactMarkupChecksum={CHECKSUM_ATTR_NAME:"data-react-checksum", addChecksumToMarkup:function addChecksumToMarkup(markup){var checksum=adler32(markup);return markup.replace(">", " " + ReactMarkupChecksum.CHECKSUM_ATTR_NAME + "=\"" + checksum + "\">");}, canReuseMarkup:function canReuseMarkup(markup, element){var existingChecksum=element.getAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME);existingChecksum = existingChecksum && parseInt(existingChecksum, 10);var markupChecksum=adler32(markup);return markupChecksum === existingChecksum;}};module.exports = ReactMarkupChecksum;}, {"106":106}], 70:[function(_dereq_, module, exports){"use strict";var DOMProperty=_dereq_(10);var ReactBrowserEventEmitter=_dereq_(30);var ReactCurrentOwner=_dereq_(39);var ReactElement=_dereq_(57);var ReactElementValidator=_dereq_(58);var ReactEmptyComponent=_dereq_(59);var ReactInstanceHandles=_dereq_(66);var ReactInstanceMap=_dereq_(67);var ReactMarkupChecksum=_dereq_(69);var ReactPerf=_dereq_(75);var ReactReconciler=_dereq_(81);var ReactUpdateQueue=_dereq_(86);var ReactUpdates=_dereq_(87);var emptyObject=_dereq_(115);var containsNode=_dereq_(109);var getReactRootElementInContainer=_dereq_(129);var instantiateReactComponent=_dereq_(134);var invariant=_dereq_(135);var setInnerHTML=_dereq_(148);var shouldUpdateReactComponent=_dereq_(151);var warning=_dereq_(154);var SEPARATOR=ReactInstanceHandles.SEPARATOR;var ATTR_NAME=DOMProperty.ID_ATTRIBUTE_NAME;var nodeCache={};var ELEMENT_NODE_TYPE=1;var DOC_NODE_TYPE=9;var instancesByReactRootID={};var containersByReactRootID={};if("production" !== "development"){var rootElementsByReactRootID={};}var findComponentRootReusableArray=[];function firstDifferenceIndex(string1, string2){var minLen=Math.min(string1.length, string2.length);for(var i=0; i < minLen; i++) {if(string1.charAt(i) !== string2.charAt(i)){return i;}}return string1.length === string2.length?-1:minLen;}function getReactRootID(container){var rootElement=getReactRootElementInContainer(container);return rootElement && ReactMount.getID(rootElement);}function getID(node){var id=internalGetID(node);if(id){if(nodeCache.hasOwnProperty(id)){var cached=nodeCache[id];if(cached !== node){"production" !== "development"?invariant(!isValid(cached, id), "ReactMount: Two valid but unequal nodes with the same `%s`: %s", ATTR_NAME, id):invariant(!isValid(cached, id));nodeCache[id] = node;}}else {nodeCache[id] = node;}}return id;}function internalGetID(node){return node && node.getAttribute && node.getAttribute(ATTR_NAME) || "";}function setID(node, id){var oldID=internalGetID(node);if(oldID !== id){delete nodeCache[oldID];}node.setAttribute(ATTR_NAME, id);nodeCache[id] = node;}function getNode(id){if(!nodeCache.hasOwnProperty(id) || !isValid(nodeCache[id], id)){nodeCache[id] = ReactMount.findReactNodeByID(id);}return nodeCache[id];}function getNodeFromInstance(instance){var id=ReactInstanceMap.get(instance)._rootNodeID;if(ReactEmptyComponent.isNullComponentID(id)){return null;}if(!nodeCache.hasOwnProperty(id) || !isValid(nodeCache[id], id)){nodeCache[id] = ReactMount.findReactNodeByID(id);}return nodeCache[id];}function isValid(node, id){if(node){"production" !== "development"?invariant(internalGetID(node) === id, "ReactMount: Unexpected modification of `%s`", ATTR_NAME):invariant(internalGetID(node) === id);var container=ReactMount.findReactContainerForID(id);if(container && containsNode(container, node)){return true;}}return false;}function purgeID(id){delete nodeCache[id];}var deepestNodeSoFar=null;function findDeepestCachedAncestorImpl(ancestorID){var ancestor=nodeCache[ancestorID];if(ancestor && isValid(ancestor, ancestorID)){deepestNodeSoFar = ancestor;}else {return false;}}function findDeepestCachedAncestor(targetID){deepestNodeSoFar = null;ReactInstanceHandles.traverseAncestors(targetID, findDeepestCachedAncestorImpl);var foundNode=deepestNodeSoFar;deepestNodeSoFar = null;return foundNode;}function mountComponentIntoNode(componentInstance, rootID, container, transaction, shouldReuseMarkup){var markup=ReactReconciler.mountComponent(componentInstance, rootID, transaction, emptyObject);componentInstance._isTopLevel = true;ReactMount._mountImageIntoNode(markup, container, shouldReuseMarkup);}function batchedMountComponentIntoNode(componentInstance, rootID, container, shouldReuseMarkup){var transaction=ReactUpdates.ReactReconcileTransaction.getPooled();transaction.perform(mountComponentIntoNode, null, componentInstance, rootID, container, transaction, shouldReuseMarkup);ReactUpdates.ReactReconcileTransaction.release(transaction);}var ReactMount={_instancesByReactRootID:instancesByReactRootID, scrollMonitor:function scrollMonitor(container, renderCallback){renderCallback();}, _updateRootComponent:function _updateRootComponent(prevComponent, nextElement, container, callback){if("production" !== "development"){ReactElementValidator.checkAndWarnForMutatedProps(nextElement);}ReactMount.scrollMonitor(container, function(){ReactUpdateQueue.enqueueElementInternal(prevComponent, nextElement);if(callback){ReactUpdateQueue.enqueueCallbackInternal(prevComponent, callback);}});if("production" !== "development"){rootElementsByReactRootID[getReactRootID(container)] = getReactRootElementInContainer(container);}return prevComponent;}, _registerComponent:function _registerComponent(nextComponent, container){"production" !== "development"?invariant(container && (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE), "_registerComponent(...): Target container is not a DOM element."):invariant(container && (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE));ReactBrowserEventEmitter.ensureScrollValueMonitoring();var reactRootID=ReactMount.registerContainer(container);instancesByReactRootID[reactRootID] = nextComponent;return reactRootID;}, _renderNewRootComponent:function _renderNewRootComponent(nextElement, container, shouldReuseMarkup){"production" !== "development"?warning(ReactCurrentOwner.current == null, "_renderNewRootComponent(): Render methods should be a pure function " + "of props and state; triggering nested component updates from " + "render is not allowed. If necessary, trigger nested updates in " + "componentDidUpdate."):null;var componentInstance=instantiateReactComponent(nextElement, null);var reactRootID=ReactMount._registerComponent(componentInstance, container);ReactUpdates.batchedUpdates(batchedMountComponentIntoNode, componentInstance, reactRootID, container, shouldReuseMarkup);if("production" !== "development"){rootElementsByReactRootID[reactRootID] = getReactRootElementInContainer(container);}return componentInstance;}, render:function render(nextElement, container, callback){"production" !== "development"?invariant(ReactElement.isValidElement(nextElement), "React.render(): Invalid component element.%s", typeof nextElement === "string"?" Instead of passing an element string, make sure to instantiate " + "it by passing it to React.createElement.":typeof nextElement === "function"?" Instead of passing a component class, make sure to instantiate " + "it by passing it to React.createElement.":nextElement != null && nextElement.props !== undefined?" This may be caused by unintentionally loading two independent " + "copies of React.":""):invariant(ReactElement.isValidElement(nextElement));var prevComponent=instancesByReactRootID[getReactRootID(container)];if(prevComponent){var prevElement=prevComponent._currentElement;if(shouldUpdateReactComponent(prevElement, nextElement)){return ReactMount._updateRootComponent(prevComponent, nextElement, container, callback).getPublicInstance();}else {ReactMount.unmountComponentAtNode(container);}}var reactRootElement=getReactRootElementInContainer(container);var containerHasReactMarkup=reactRootElement && ReactMount.isRenderedByReact(reactRootElement);if("production" !== "development"){if(!containerHasReactMarkup || reactRootElement.nextSibling){var rootElementSibling=reactRootElement;while(rootElementSibling) {if(ReactMount.isRenderedByReact(rootElementSibling)){"production" !== "development"?warning(false, "render(): Target node has markup rendered by React, but there " + "are unrelated nodes as well. This is most commonly caused by " + "white-space inserted around server-rendered markup."):null;break;}rootElementSibling = rootElementSibling.nextSibling;}}}var shouldReuseMarkup=containerHasReactMarkup && !prevComponent;var component=ReactMount._renderNewRootComponent(nextElement, container, shouldReuseMarkup).getPublicInstance();if(callback){callback.call(component);}return component;}, constructAndRenderComponent:function constructAndRenderComponent(constructor, props, container){var element=ReactElement.createElement(constructor, props);return ReactMount.render(element, container);}, constructAndRenderComponentByID:function constructAndRenderComponentByID(constructor, props, id){var domNode=document.getElementById(id);"production" !== "development"?invariant(domNode, "Tried to get element with id of \"%s\" but it is not present on the page.", id):invariant(domNode);return ReactMount.constructAndRenderComponent(constructor, props, domNode);}, registerContainer:function registerContainer(container){var reactRootID=getReactRootID(container);if(reactRootID){reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(reactRootID);}if(!reactRootID){reactRootID = ReactInstanceHandles.createReactRootID();}containersByReactRootID[reactRootID] = container;return reactRootID;}, unmountComponentAtNode:function unmountComponentAtNode(container){"production" !== "development"?warning(ReactCurrentOwner.current == null, "unmountComponentAtNode(): Render methods should be a pure function of " + "props and state; triggering nested component updates from render is " + "not allowed. If necessary, trigger nested updates in " + "componentDidUpdate."):null;"production" !== "development"?invariant(container && (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE), "unmountComponentAtNode(...): Target container is not a DOM element."):invariant(container && (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE));var reactRootID=getReactRootID(container);var component=instancesByReactRootID[reactRootID];if(!component){return false;}ReactMount.unmountComponentFromNode(component, container);delete instancesByReactRootID[reactRootID];delete containersByReactRootID[reactRootID];if("production" !== "development"){delete rootElementsByReactRootID[reactRootID];}return true;}, unmountComponentFromNode:function unmountComponentFromNode(instance, container){ReactReconciler.unmountComponent(instance);if(container.nodeType === DOC_NODE_TYPE){container = container.documentElement;}while(container.lastChild) {container.removeChild(container.lastChild);}}, findReactContainerForID:function findReactContainerForID(id){var reactRootID=ReactInstanceHandles.getReactRootIDFromNodeID(id);var container=containersByReactRootID[reactRootID];if("production" !== "development"){var rootElement=rootElementsByReactRootID[reactRootID];if(rootElement && rootElement.parentNode !== container){"production" !== "development"?invariant(internalGetID(rootElement) === reactRootID, "ReactMount: Root element ID differed from reactRootID."):invariant(internalGetID(rootElement) === reactRootID);var containerChild=container.firstChild;if(containerChild && reactRootID === internalGetID(containerChild)){rootElementsByReactRootID[reactRootID] = containerChild;}else {"production" !== "development"?warning(false, "ReactMount: Root element has been removed from its original " + "container. New container:", rootElement.parentNode):null;}}}return container;}, findReactNodeByID:function findReactNodeByID(id){var reactRoot=ReactMount.findReactContainerForID(id);return ReactMount.findComponentRoot(reactRoot, id);}, isRenderedByReact:function isRenderedByReact(node){if(node.nodeType !== 1){return false;}var id=ReactMount.getID(node);return id?id.charAt(0) === SEPARATOR:false;}, getFirstReactDOM:function getFirstReactDOM(node){var current=node;while(current && current.parentNode !== current) {if(ReactMount.isRenderedByReact(current)){return current;}current = current.parentNode;}return null;}, findComponentRoot:function findComponentRoot(ancestorNode, targetID){var firstChildren=findComponentRootReusableArray;var childIndex=0;var deepestAncestor=findDeepestCachedAncestor(targetID) || ancestorNode;firstChildren[0] = deepestAncestor.firstChild;firstChildren.length = 1;while(childIndex < firstChildren.length) {var child=firstChildren[childIndex++];var targetChild;while(child) {var childID=ReactMount.getID(child);if(childID){if(targetID === childID){targetChild = child;}else if(ReactInstanceHandles.isAncestorIDOf(childID, targetID)){firstChildren.length = childIndex = 0;firstChildren.push(child.firstChild);}}else {firstChildren.push(child.firstChild);}child = child.nextSibling;}if(targetChild){firstChildren.length = 0;return targetChild;}}firstChildren.length = 0;"production" !== "development"?invariant(false, "findComponentRoot(..., %s): Unable to find element. This probably " + "means the DOM was unexpectedly mutated (e.g., by the browser), " + "usually due to forgetting a <tbody> when using tables, nesting tags " + "like <form>, <p>, or <a>, or using non-SVG elements in an <svg> " + "parent. " + "Try inspecting the child nodes of the element with React ID `%s`.", targetID, ReactMount.getID(ancestorNode)):invariant(false);}, _mountImageIntoNode:function _mountImageIntoNode(markup, container, shouldReuseMarkup){"production" !== "development"?invariant(container && (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE), "mountComponentIntoNode(...): Target container is not valid."):invariant(container && (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE));if(shouldReuseMarkup){var rootElement=getReactRootElementInContainer(container);if(ReactMarkupChecksum.canReuseMarkup(markup, rootElement)){return;}else {var checksum=rootElement.getAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME);rootElement.removeAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME);var rootMarkup=rootElement.outerHTML;rootElement.setAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME, checksum);var diffIndex=firstDifferenceIndex(markup, rootMarkup);var difference=" (client) " + markup.substring(diffIndex - 20, diffIndex + 20) + "\n (server) " + rootMarkup.substring(diffIndex - 20, diffIndex + 20);"production" !== "development"?invariant(container.nodeType !== DOC_NODE_TYPE, "You're trying to render a component to the document using " + "server rendering but the checksum was invalid. This usually " + "means you rendered a different component type or props on " + "the client from the one on the server, or your render() " + "methods are impure. React cannot handle this case due to " + "cross-browser quirks by rendering at the document root. You " + "should look for environment dependent code in your components " + "and ensure the props are the same client and server side:\n%s", difference):invariant(container.nodeType !== DOC_NODE_TYPE);if("production" !== "development"){"production" !== "development"?warning(false, "React attempted to reuse markup in a container but the " + "checksum was invalid. This generally means that you are " + "using server rendering and the markup generated on the " + "server was not what the client was expecting. React injected " + "new markup to compensate which works but you have lost many " + "of the benefits of server rendering. Instead, figure out " + "why the markup being generated is different on the client " + "or server:\n%s", difference):null;}}}"production" !== "development"?invariant(container.nodeType !== DOC_NODE_TYPE, "You're trying to render a component to the document but " + "you didn't use server rendering. We can't do this " + "without using server rendering due to cross-browser quirks. " + "See React.renderToString() for server rendering."):invariant(container.nodeType !== DOC_NODE_TYPE);setInnerHTML(container, markup);}, getReactRootID:getReactRootID, getID:getID, setID:setID, getNode:getNode, getNodeFromInstance:getNodeFromInstance, purgeID:purgeID};ReactPerf.measureMethods(ReactMount, "ReactMount", {_renderNewRootComponent:"_renderNewRootComponent", _mountImageIntoNode:"_mountImageIntoNode"});module.exports = ReactMount;}, {"10":10, "109":109, "115":115, "129":129, "134":134, "135":135, "148":148, "151":151, "154":154, "30":30, "39":39, "57":57, "58":58, "59":59, "66":66, "67":67, "69":69, "75":75, "81":81, "86":86, "87":87}], 71:[function(_dereq_, module, exports){"use strict";var ReactComponentEnvironment=_dereq_(36);var ReactMultiChildUpdateTypes=_dereq_(72);var ReactReconciler=_dereq_(81);var ReactChildReconciler=_dereq_(31);var updateDepth=0;var updateQueue=[];var markupQueue=[];function enqueueMarkup(parentID, markup, toIndex){updateQueue.push({parentID:parentID, parentNode:null, type:ReactMultiChildUpdateTypes.INSERT_MARKUP, markupIndex:markupQueue.push(markup) - 1, textContent:null, fromIndex:null, toIndex:toIndex});}function enqueueMove(parentID, fromIndex, toIndex){updateQueue.push({parentID:parentID, parentNode:null, type:ReactMultiChildUpdateTypes.MOVE_EXISTING, markupIndex:null, textContent:null, fromIndex:fromIndex, toIndex:toIndex});}function enqueueRemove(parentID, fromIndex){updateQueue.push({parentID:parentID, parentNode:null, type:ReactMultiChildUpdateTypes.REMOVE_NODE, markupIndex:null, textContent:null, fromIndex:fromIndex, toIndex:null});}function enqueueTextContent(parentID, textContent){updateQueue.push({parentID:parentID, parentNode:null, type:ReactMultiChildUpdateTypes.TEXT_CONTENT, markupIndex:null, textContent:textContent, fromIndex:null, toIndex:null});}function processQueue(){if(updateQueue.length){ReactComponentEnvironment.processChildrenUpdates(updateQueue, markupQueue);clearQueue();}}function clearQueue(){updateQueue.length = 0;markupQueue.length = 0;}var ReactMultiChild={Mixin:{mountChildren:function mountChildren(nestedChildren, transaction, context){var children=ReactChildReconciler.instantiateChildren(nestedChildren, transaction, context);this._renderedChildren = children;var mountImages=[];var index=0;for(var name in children) {if(children.hasOwnProperty(name)){var child=children[name];var rootID=this._rootNodeID + name;var mountImage=ReactReconciler.mountComponent(child, rootID, transaction, context);child._mountIndex = index;mountImages.push(mountImage);index++;}}return mountImages;}, updateTextContent:function updateTextContent(nextContent){updateDepth++;var errorThrown=true;try{var prevChildren=this._renderedChildren;ReactChildReconciler.unmountChildren(prevChildren);for(var name in prevChildren) {if(prevChildren.hasOwnProperty(name)){this._unmountChildByName(prevChildren[name], name);}}this.setTextContent(nextContent);errorThrown = false;}finally {updateDepth--;if(!updateDepth){if(errorThrown){clearQueue();}else {processQueue();}}}}, updateChildren:function updateChildren(nextNestedChildren, transaction, context){updateDepth++;var errorThrown=true;try{this._updateChildren(nextNestedChildren, transaction, context);errorThrown = false;}finally {updateDepth--;if(!updateDepth){if(errorThrown){clearQueue();}else {processQueue();}}}}, _updateChildren:function _updateChildren(nextNestedChildren, transaction, context){var prevChildren=this._renderedChildren;var nextChildren=ReactChildReconciler.updateChildren(prevChildren, nextNestedChildren, transaction, context);this._renderedChildren = nextChildren;if(!nextChildren && !prevChildren){return;}var name;var lastIndex=0;var nextIndex=0;for(name in nextChildren) {if(!nextChildren.hasOwnProperty(name)){continue;}var prevChild=prevChildren && prevChildren[name];var nextChild=nextChildren[name];if(prevChild === nextChild){this.moveChild(prevChild, nextIndex, lastIndex);lastIndex = Math.max(prevChild._mountIndex, lastIndex);prevChild._mountIndex = nextIndex;}else {if(prevChild){lastIndex = Math.max(prevChild._mountIndex, lastIndex);this._unmountChildByName(prevChild, name);}this._mountChildByNameAtIndex(nextChild, name, nextIndex, transaction, context);}nextIndex++;}for(name in prevChildren) {if(prevChildren.hasOwnProperty(name) && !(nextChildren && nextChildren.hasOwnProperty(name))){this._unmountChildByName(prevChildren[name], name);}}}, unmountChildren:function unmountChildren(){var renderedChildren=this._renderedChildren;ReactChildReconciler.unmountChildren(renderedChildren);this._renderedChildren = null;}, moveChild:function moveChild(child, toIndex, lastIndex){if(child._mountIndex < lastIndex){enqueueMove(this._rootNodeID, child._mountIndex, toIndex);}}, createChild:function createChild(child, mountImage){enqueueMarkup(this._rootNodeID, mountImage, child._mountIndex);}, removeChild:function removeChild(child){enqueueRemove(this._rootNodeID, child._mountIndex);}, setTextContent:function setTextContent(textContent){enqueueTextContent(this._rootNodeID, textContent);}, _mountChildByNameAtIndex:function _mountChildByNameAtIndex(child, name, index, transaction, context){var rootID=this._rootNodeID + name;var mountImage=ReactReconciler.mountComponent(child, rootID, transaction, context);child._mountIndex = index;this.createChild(child, mountImage);}, _unmountChildByName:function _unmountChildByName(child, name){this.removeChild(child);child._mountIndex = null;}}};module.exports = ReactMultiChild;}, {"31":31, "36":36, "72":72, "81":81}], 72:[function(_dereq_, module, exports){"use strict";var keyMirror=_dereq_(140);var ReactMultiChildUpdateTypes=keyMirror({INSERT_MARKUP:null, MOVE_EXISTING:null, REMOVE_NODE:null, TEXT_CONTENT:null});module.exports = ReactMultiChildUpdateTypes;}, {"140":140}], 73:[function(_dereq_, module, exports){"use strict";var assign=_dereq_(27);var invariant=_dereq_(135);var autoGenerateWrapperClass=null;var genericComponentClass=null;var tagToComponentClass={};var textComponentClass=null;var ReactNativeComponentInjection={injectGenericComponentClass:function injectGenericComponentClass(componentClass){genericComponentClass = componentClass;}, injectTextComponentClass:function injectTextComponentClass(componentClass){textComponentClass = componentClass;}, injectComponentClasses:function injectComponentClasses(componentClasses){assign(tagToComponentClass, componentClasses);}, injectAutoWrapper:function injectAutoWrapper(wrapperFactory){autoGenerateWrapperClass = wrapperFactory;}};function getComponentClassForElement(element){if(typeof element.type === "function"){return element.type;}var tag=element.type;var componentClass=tagToComponentClass[tag];if(componentClass == null){tagToComponentClass[tag] = componentClass = autoGenerateWrapperClass(tag);}return componentClass;}function createInternalComponent(element){"production" !== "development"?invariant(genericComponentClass, "There is no registered component for the tag %s", element.type):invariant(genericComponentClass);return new genericComponentClass(element.type, element.props);}function createInstanceForText(text){return new textComponentClass(text);}function isTextComponent(component){return component instanceof textComponentClass;}var ReactNativeComponent={getComponentClassForElement:getComponentClassForElement, createInternalComponent:createInternalComponent, createInstanceForText:createInstanceForText, isTextComponent:isTextComponent, injection:ReactNativeComponentInjection};module.exports = ReactNativeComponent;}, {"135":135, "27":27}], 74:[function(_dereq_, module, exports){"use strict";var invariant=_dereq_(135);var ReactOwner={isValidOwner:function isValidOwner(object){return !!(object && typeof object.attachRef === "function" && typeof object.detachRef === "function");}, addComponentAsRefTo:function addComponentAsRefTo(component, ref, owner){"production" !== "development"?invariant(ReactOwner.isValidOwner(owner), "addComponentAsRefTo(...): Only a ReactOwner can have refs. This " + "usually means that you're trying to add a ref to a component that " + "doesn't have an owner (that is, was not created inside of another " + "component's `render` method). Try rendering this component inside of " + "a new top-level component which will hold the ref."):invariant(ReactOwner.isValidOwner(owner));owner.attachRef(ref, component);}, removeComponentAsRefFrom:function removeComponentAsRefFrom(component, ref, owner){"production" !== "development"?invariant(ReactOwner.isValidOwner(owner), "removeComponentAsRefFrom(...): Only a ReactOwner can have refs. This " + "usually means that you're trying to remove a ref to a component that " + "doesn't have an owner (that is, was not created inside of another " + "component's `render` method). Try rendering this component inside of " + "a new top-level component which will hold the ref."):invariant(ReactOwner.isValidOwner(owner));if(owner.getPublicInstance().refs[ref] === component.getPublicInstance()){owner.detachRef(ref);}}};module.exports = ReactOwner;}, {"135":135}], 75:[function(_dereq_, module, exports){"use strict";var ReactPerf={enableMeasure:false, storedMeasure:_noMeasure, measureMethods:function measureMethods(object, objectName, methodNames){if("production" !== "development"){for(var key in methodNames) {if(!methodNames.hasOwnProperty(key)){continue;}object[key] = ReactPerf.measure(objectName, methodNames[key], object[key]);}}}, measure:function measure(objName, fnName, func){if("production" !== "development"){var measuredFunc=null;var wrapper=function wrapper(){if(ReactPerf.enableMeasure){if(!measuredFunc){measuredFunc = ReactPerf.storedMeasure(objName, fnName, func);}return measuredFunc.apply(this, arguments);}return func.apply(this, arguments);};wrapper.displayName = objName + "_" + fnName;return wrapper;}return func;}, injection:{injectMeasure:function injectMeasure(measure){ReactPerf.storedMeasure = measure;}}};function _noMeasure(objName, fnName, func){return func;}module.exports = ReactPerf;}, {}], 76:[function(_dereq_, module, exports){"use strict";var ReactPropTypeLocationNames={};if("production" !== "development"){ReactPropTypeLocationNames = {prop:"prop", context:"context", childContext:"child context"};}module.exports = ReactPropTypeLocationNames;}, {}], 77:[function(_dereq_, module, exports){"use strict";var keyMirror=_dereq_(140);var ReactPropTypeLocations=keyMirror({prop:null, context:null, childContext:null});module.exports = ReactPropTypeLocations;}, {"140":140}], 78:[function(_dereq_, module, exports){"use strict";var ReactElement=_dereq_(57);var ReactFragment=_dereq_(63);var ReactPropTypeLocationNames=_dereq_(76);var emptyFunction=_dereq_(114);var ANONYMOUS="<<anonymous>>";var elementTypeChecker=createElementTypeChecker();var nodeTypeChecker=createNodeChecker();var ReactPropTypes={array:createPrimitiveTypeChecker("array"), bool:createPrimitiveTypeChecker("boolean"), func:createPrimitiveTypeChecker("function"), number:createPrimitiveTypeChecker("number"), object:createPrimitiveTypeChecker("object"), string:createPrimitiveTypeChecker("string"), any:createAnyTypeChecker(), arrayOf:createArrayOfTypeChecker, element:elementTypeChecker, instanceOf:createInstanceTypeChecker, node:nodeTypeChecker, objectOf:createObjectOfTypeChecker, oneOf:createEnumTypeChecker, oneOfType:createUnionTypeChecker, shape:createShapeTypeChecker};function createChainableTypeChecker(validate){function checkType(isRequired, props, propName, componentName, location){componentName = componentName || ANONYMOUS;if(props[propName] == null){var locationName=ReactPropTypeLocationNames[location];if(isRequired){return new Error("Required " + locationName + " `" + propName + "` was not specified in " + ("`" + componentName + "`."));}return null;}else {return validate(props, propName, componentName, location);}}var chainedCheckType=checkType.bind(null, false);chainedCheckType.isRequired = checkType.bind(null, true);return chainedCheckType;}function createPrimitiveTypeChecker(expectedType){function validate(props, propName, componentName, location){var propValue=props[propName];var propType=getPropType(propValue);if(propType !== expectedType){var locationName=ReactPropTypeLocationNames[location];var preciseType=getPreciseType(propValue);return new Error("Invalid " + locationName + " `" + propName + "` of type `" + preciseType + "` " + ("supplied to `" + componentName + "`, expected `" + expectedType + "`."));}return null;}return createChainableTypeChecker(validate);}function createAnyTypeChecker(){return createChainableTypeChecker(emptyFunction.thatReturns(null));}function createArrayOfTypeChecker(typeChecker){function validate(props, propName, componentName, location){var propValue=props[propName];if(!Array.isArray(propValue)){var locationName=ReactPropTypeLocationNames[location];var propType=getPropType(propValue);return new Error("Invalid " + locationName + " `" + propName + "` of type " + ("`" + propType + "` supplied to `" + componentName + "`, expected an array."));}for(var i=0; i < propValue.length; i++) {var error=typeChecker(propValue, i, componentName, location);if(error instanceof Error){return error;}}return null;}return createChainableTypeChecker(validate);}function createElementTypeChecker(){function validate(props, propName, componentName, location){if(!ReactElement.isValidElement(props[propName])){var locationName=ReactPropTypeLocationNames[location];return new Error("Invalid " + locationName + " `" + propName + "` supplied to " + ("`" + componentName + "`, expected a ReactElement."));}return null;}return createChainableTypeChecker(validate);}function createInstanceTypeChecker(expectedClass){function validate(props, propName, componentName, location){if(!(props[propName] instanceof expectedClass)){var locationName=ReactPropTypeLocationNames[location];var expectedClassName=expectedClass.name || ANONYMOUS;return new Error("Invalid " + locationName + " `" + propName + "` supplied to " + ("`" + componentName + "`, expected instance of `" + expectedClassName + "`."));}return null;}return createChainableTypeChecker(validate);}function createEnumTypeChecker(expectedValues){function validate(props, propName, componentName, location){var propValue=props[propName];for(var i=0; i < expectedValues.length; i++) {if(propValue === expectedValues[i]){return null;}}var locationName=ReactPropTypeLocationNames[location];var valuesString=JSON.stringify(expectedValues);return new Error("Invalid " + locationName + " `" + propName + "` of value `" + propValue + "` " + ("supplied to `" + componentName + "`, expected one of " + valuesString + "."));}return createChainableTypeChecker(validate);}function createObjectOfTypeChecker(typeChecker){function validate(props, propName, componentName, location){var propValue=props[propName];var propType=getPropType(propValue);if(propType !== "object"){var locationName=ReactPropTypeLocationNames[location];return new Error("Invalid " + locationName + " `" + propName + "` of type " + ("`" + propType + "` supplied to `" + componentName + "`, expected an object."));}for(var key in propValue) {if(propValue.hasOwnProperty(key)){var error=typeChecker(propValue, key, componentName, location);if(error instanceof Error){return error;}}}return null;}return createChainableTypeChecker(validate);}function createUnionTypeChecker(arrayOfTypeCheckers){function validate(props, propName, componentName, location){for(var i=0; i < arrayOfTypeCheckers.length; i++) {var checker=arrayOfTypeCheckers[i];if(checker(props, propName, componentName, location) == null){return null;}}var locationName=ReactPropTypeLocationNames[location];return new Error("Invalid " + locationName + " `" + propName + "` supplied to " + ("`" + componentName + "`."));}return createChainableTypeChecker(validate);}function createNodeChecker(){function validate(props, propName, componentName, location){if(!isNode(props[propName])){var locationName=ReactPropTypeLocationNames[location];return new Error("Invalid " + locationName + " `" + propName + "` supplied to " + ("`" + componentName + "`, expected a ReactNode."));}return null;}return createChainableTypeChecker(validate);}function createShapeTypeChecker(shapeTypes){function validate(props, propName, componentName, location){var propValue=props[propName];var propType=getPropType(propValue);if(propType !== "object"){var locationName=ReactPropTypeLocationNames[location];return new Error("Invalid " + locationName + " `" + propName + "` of type `" + propType + "` " + ("supplied to `" + componentName + "`, expected `object`."));}for(var key in shapeTypes) {var checker=shapeTypes[key];if(!checker){continue;}var error=checker(propValue, key, componentName, location);if(error){return error;}}return null;}return createChainableTypeChecker(validate);}function isNode(propValue){switch(typeof propValue){case "number":case "string":case "undefined":return true;case "boolean":return !propValue;case "object":if(Array.isArray(propValue)){return propValue.every(isNode);}if(propValue === null || ReactElement.isValidElement(propValue)){return true;}propValue = ReactFragment.extractIfFragment(propValue);for(var k in propValue) {if(!isNode(propValue[k])){return false;}}return true;default:return false;}}function getPropType(propValue){var propType=typeof propValue;if(Array.isArray(propValue)){return "array";}if(propValue instanceof RegExp){return "object";}return propType;}function getPreciseType(propValue){var propType=getPropType(propValue);if(propType === "object"){if(propValue instanceof Date){return "date";}else if(propValue instanceof RegExp){return "regexp";}}return propType;}module.exports = ReactPropTypes;}, {"114":114, "57":57, "63":63, "76":76}], 79:[function(_dereq_, module, exports){"use strict";var PooledClass=_dereq_(28);var ReactBrowserEventEmitter=_dereq_(30);var assign=_dereq_(27);function ReactPutListenerQueue(){this.listenersToPut = [];}assign(ReactPutListenerQueue.prototype, {enqueuePutListener:function enqueuePutListener(rootNodeID, propKey, propValue){this.listenersToPut.push({rootNodeID:rootNodeID, propKey:propKey, propValue:propValue});}, putListeners:function putListeners(){for(var i=0; i < this.listenersToPut.length; i++) {var listenerToPut=this.listenersToPut[i];ReactBrowserEventEmitter.putListener(listenerToPut.rootNodeID, listenerToPut.propKey, listenerToPut.propValue);}}, reset:function reset(){this.listenersToPut.length = 0;}, destructor:function destructor(){this.reset();}});PooledClass.addPoolingTo(ReactPutListenerQueue);module.exports = ReactPutListenerQueue;}, {"27":27, "28":28, "30":30}], 80:[function(_dereq_, module, exports){"use strict";var CallbackQueue=_dereq_(6);var PooledClass=_dereq_(28);var ReactBrowserEventEmitter=_dereq_(30);var ReactInputSelection=_dereq_(65);var ReactPutListenerQueue=_dereq_(79);var Transaction=_dereq_(103);var assign=_dereq_(27);var SELECTION_RESTORATION={initialize:ReactInputSelection.getSelectionInformation, close:ReactInputSelection.restoreSelection};var EVENT_SUPPRESSION={initialize:function initialize(){var currentlyEnabled=ReactBrowserEventEmitter.isEnabled();ReactBrowserEventEmitter.setEnabled(false);return currentlyEnabled;}, close:function close(previouslyEnabled){ReactBrowserEventEmitter.setEnabled(previouslyEnabled);}};var ON_DOM_READY_QUEUEING={initialize:function initialize(){this.reactMountReady.reset();}, close:function close(){this.reactMountReady.notifyAll();}};var PUT_LISTENER_QUEUEING={initialize:function initialize(){this.putListenerQueue.reset();}, close:function close(){this.putListenerQueue.putListeners();}};var TRANSACTION_WRAPPERS=[PUT_LISTENER_QUEUEING, SELECTION_RESTORATION, EVENT_SUPPRESSION, ON_DOM_READY_QUEUEING];function ReactReconcileTransaction(){this.reinitializeTransaction();this.renderToStaticMarkup = false;this.reactMountReady = CallbackQueue.getPooled(null);this.putListenerQueue = ReactPutListenerQueue.getPooled();}var Mixin={getTransactionWrappers:function getTransactionWrappers(){return TRANSACTION_WRAPPERS;}, getReactMountReady:function getReactMountReady(){return this.reactMountReady;}, getPutListenerQueue:function getPutListenerQueue(){return this.putListenerQueue;}, destructor:function destructor(){CallbackQueue.release(this.reactMountReady);this.reactMountReady = null;ReactPutListenerQueue.release(this.putListenerQueue);this.putListenerQueue = null;}};assign(ReactReconcileTransaction.prototype, Transaction.Mixin, Mixin);PooledClass.addPoolingTo(ReactReconcileTransaction);module.exports = ReactReconcileTransaction;}, {"103":103, "27":27, "28":28, "30":30, "6":6, "65":65, "79":79}], 81:[function(_dereq_, module, exports){"use strict";var ReactRef=_dereq_(82);var ReactElementValidator=_dereq_(58);function attachRefs(){ReactRef.attachRefs(this, this._currentElement);}var ReactReconciler={mountComponent:function mountComponent(internalInstance, rootID, transaction, context){var markup=internalInstance.mountComponent(rootID, transaction, context);if("production" !== "development"){ReactElementValidator.checkAndWarnForMutatedProps(internalInstance._currentElement);}transaction.getReactMountReady().enqueue(attachRefs, internalInstance);return markup;}, unmountComponent:function unmountComponent(internalInstance){ReactRef.detachRefs(internalInstance, internalInstance._currentElement);internalInstance.unmountComponent();}, receiveComponent:function receiveComponent(internalInstance, nextElement, transaction, context){var prevElement=internalInstance._currentElement;if(nextElement === prevElement && nextElement._owner != null){return;}if("production" !== "development"){ReactElementValidator.checkAndWarnForMutatedProps(nextElement);}var refsChanged=ReactRef.shouldUpdateRefs(prevElement, nextElement);if(refsChanged){ReactRef.detachRefs(internalInstance, prevElement);}internalInstance.receiveComponent(nextElement, transaction, context);if(refsChanged){transaction.getReactMountReady().enqueue(attachRefs, internalInstance);}}, performUpdateIfNecessary:function performUpdateIfNecessary(internalInstance, transaction){internalInstance.performUpdateIfNecessary(transaction);}};module.exports = ReactReconciler;}, {"58":58, "82":82}], 82:[function(_dereq_, module, exports){"use strict";var ReactOwner=_dereq_(74);var ReactRef={};function attachRef(ref, component, owner){if(typeof ref === "function"){ref(component.getPublicInstance());}else {ReactOwner.addComponentAsRefTo(component, ref, owner);}}function detachRef(ref, component, owner){if(typeof ref === "function"){ref(null);}else {ReactOwner.removeComponentAsRefFrom(component, ref, owner);}}ReactRef.attachRefs = function(instance, element){var ref=element.ref;if(ref != null){attachRef(ref, instance, element._owner);}};ReactRef.shouldUpdateRefs = function(prevElement, nextElement){return nextElement._owner !== prevElement._owner || nextElement.ref !== prevElement.ref;};ReactRef.detachRefs = function(instance, element){var ref=element.ref;if(ref != null){detachRef(ref, instance, element._owner);}};module.exports = ReactRef;}, {"74":74}], 83:[function(_dereq_, module, exports){"use strict";var ReactRootIndexInjection={injectCreateReactRootIndex:function injectCreateReactRootIndex(_createReactRootIndex){ReactRootIndex.createReactRootIndex = _createReactRootIndex;}};var ReactRootIndex={createReactRootIndex:null, injection:ReactRootIndexInjection};module.exports = ReactRootIndex;}, {}], 84:[function(_dereq_, module, exports){"use strict";var ReactElement=_dereq_(57);var ReactInstanceHandles=_dereq_(66);var ReactMarkupChecksum=_dereq_(69);var ReactServerRenderingTransaction=_dereq_(85);var emptyObject=_dereq_(115);var instantiateReactComponent=_dereq_(134);var invariant=_dereq_(135);function renderToString(element){"production" !== "development"?invariant(ReactElement.isValidElement(element), "renderToString(): You must pass a valid ReactElement."):invariant(ReactElement.isValidElement(element));var transaction;try{var id=ReactInstanceHandles.createReactRootID();transaction = ReactServerRenderingTransaction.getPooled(false);return transaction.perform(function(){var componentInstance=instantiateReactComponent(element, null);var markup=componentInstance.mountComponent(id, transaction, emptyObject);return ReactMarkupChecksum.addChecksumToMarkup(markup);}, null);}finally {ReactServerRenderingTransaction.release(transaction);}}function renderToStaticMarkup(element){"production" !== "development"?invariant(ReactElement.isValidElement(element), "renderToStaticMarkup(): You must pass a valid ReactElement."):invariant(ReactElement.isValidElement(element));var transaction;try{var id=ReactInstanceHandles.createReactRootID();transaction = ReactServerRenderingTransaction.getPooled(true);return transaction.perform(function(){var componentInstance=instantiateReactComponent(element, null);return componentInstance.mountComponent(id, transaction, emptyObject);}, null);}finally {ReactServerRenderingTransaction.release(transaction);}}module.exports = {renderToString:renderToString, renderToStaticMarkup:renderToStaticMarkup};}, {"115":115, "134":134, "135":135, "57":57, "66":66, "69":69, "85":85}], 85:[function(_dereq_, module, exports){"use strict";var PooledClass=_dereq_(28);var CallbackQueue=_dereq_(6);var ReactPutListenerQueue=_dereq_(79);var Transaction=_dereq_(103);var assign=_dereq_(27);var emptyFunction=_dereq_(114);var ON_DOM_READY_QUEUEING={initialize:function initialize(){this.reactMountReady.reset();}, close:emptyFunction};var PUT_LISTENER_QUEUEING={initialize:function initialize(){this.putListenerQueue.reset();}, close:emptyFunction};var TRANSACTION_WRAPPERS=[PUT_LISTENER_QUEUEING, ON_DOM_READY_QUEUEING];function ReactServerRenderingTransaction(renderToStaticMarkup){this.reinitializeTransaction();this.renderToStaticMarkup = renderToStaticMarkup;this.reactMountReady = CallbackQueue.getPooled(null);this.putListenerQueue = ReactPutListenerQueue.getPooled();}var Mixin={getTransactionWrappers:function getTransactionWrappers(){return TRANSACTION_WRAPPERS;}, getReactMountReady:function getReactMountReady(){return this.reactMountReady;}, getPutListenerQueue:function getPutListenerQueue(){return this.putListenerQueue;}, destructor:function destructor(){CallbackQueue.release(this.reactMountReady);this.reactMountReady = null;ReactPutListenerQueue.release(this.putListenerQueue);this.putListenerQueue = null;}};assign(ReactServerRenderingTransaction.prototype, Transaction.Mixin, Mixin);PooledClass.addPoolingTo(ReactServerRenderingTransaction);module.exports = ReactServerRenderingTransaction;}, {"103":103, "114":114, "27":27, "28":28, "6":6, "79":79}], 86:[function(_dereq_, module, exports){"use strict";var ReactLifeCycle=_dereq_(68);var ReactCurrentOwner=_dereq_(39);var ReactElement=_dereq_(57);var ReactInstanceMap=_dereq_(67);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var invariant=_dereq_(135);var warning=_dereq_(154);function enqueueUpdate(internalInstance){if(internalInstance !== ReactLifeCycle.currentlyMountingInstance){ReactUpdates.enqueueUpdate(internalInstance);}}function getInternalInstanceReadyForUpdate(publicInstance, callerName){"production" !== "development"?invariant(ReactCurrentOwner.current == null, "%s(...): Cannot update during an existing state transition " + "(such as within `render`). Render methods should be a pure function " + "of props and state.", callerName):invariant(ReactCurrentOwner.current == null);var internalInstance=ReactInstanceMap.get(publicInstance);if(!internalInstance){if("production" !== "development"){"production" !== "development"?warning(!callerName, "%s(...): Can only update a mounted or mounting component. " + "This usually means you called %s() on an unmounted " + "component. This is a no-op.", callerName, callerName):null;}return null;}if(internalInstance === ReactLifeCycle.currentlyUnmountingInstance){return null;}return internalInstance;}var ReactUpdateQueue={enqueueCallback:function enqueueCallback(publicInstance, callback){"production" !== "development"?invariant(typeof callback === "function", "enqueueCallback(...): You called `setProps`, `replaceProps`, " + "`setState`, `replaceState`, or `forceUpdate` with a callback that " + "isn't callable."):invariant(typeof callback === "function");var internalInstance=getInternalInstanceReadyForUpdate(publicInstance);if(!internalInstance || internalInstance === ReactLifeCycle.currentlyMountingInstance){return null;}if(internalInstance._pendingCallbacks){internalInstance._pendingCallbacks.push(callback);}else {internalInstance._pendingCallbacks = [callback];}enqueueUpdate(internalInstance);}, enqueueCallbackInternal:function enqueueCallbackInternal(internalInstance, callback){"production" !== "development"?invariant(typeof callback === "function", "enqueueCallback(...): You called `setProps`, `replaceProps`, " + "`setState`, `replaceState`, or `forceUpdate` with a callback that " + "isn't callable."):invariant(typeof callback === "function");if(internalInstance._pendingCallbacks){internalInstance._pendingCallbacks.push(callback);}else {internalInstance._pendingCallbacks = [callback];}enqueueUpdate(internalInstance);}, enqueueForceUpdate:function enqueueForceUpdate(publicInstance){var internalInstance=getInternalInstanceReadyForUpdate(publicInstance, "forceUpdate");if(!internalInstance){return;}internalInstance._pendingForceUpdate = true;enqueueUpdate(internalInstance);}, enqueueReplaceState:function enqueueReplaceState(publicInstance, completeState){var internalInstance=getInternalInstanceReadyForUpdate(publicInstance, "replaceState");if(!internalInstance){return;}internalInstance._pendingStateQueue = [completeState];internalInstance._pendingReplaceState = true;enqueueUpdate(internalInstance);}, enqueueSetState:function enqueueSetState(publicInstance, partialState){var internalInstance=getInternalInstanceReadyForUpdate(publicInstance, "setState");if(!internalInstance){return;}var queue=internalInstance._pendingStateQueue || (internalInstance._pendingStateQueue = []);queue.push(partialState);enqueueUpdate(internalInstance);}, enqueueSetProps:function enqueueSetProps(publicInstance, partialProps){var internalInstance=getInternalInstanceReadyForUpdate(publicInstance, "setProps");if(!internalInstance){return;}"production" !== "development"?invariant(internalInstance._isTopLevel, "setProps(...): You called `setProps` on a " + "component with a parent. This is an anti-pattern since props will " + "get reactively updated when rendered. Instead, change the owner's " + "`render` method to pass the correct value as props to the component " + "where it is created."):invariant(internalInstance._isTopLevel);var element=internalInstance._pendingElement || internalInstance._currentElement;var props=assign({}, element.props, partialProps);internalInstance._pendingElement = ReactElement.cloneAndReplaceProps(element, props);enqueueUpdate(internalInstance);}, enqueueReplaceProps:function enqueueReplaceProps(publicInstance, props){var internalInstance=getInternalInstanceReadyForUpdate(publicInstance, "replaceProps");if(!internalInstance){return;}"production" !== "development"?invariant(internalInstance._isTopLevel, "replaceProps(...): You called `replaceProps` on a " + "component with a parent. This is an anti-pattern since props will " + "get reactively updated when rendered. Instead, change the owner's " + "`render` method to pass the correct value as props to the component " + "where it is created."):invariant(internalInstance._isTopLevel);var element=internalInstance._pendingElement || internalInstance._currentElement;internalInstance._pendingElement = ReactElement.cloneAndReplaceProps(element, props);enqueueUpdate(internalInstance);}, enqueueElementInternal:function enqueueElementInternal(internalInstance, newElement){internalInstance._pendingElement = newElement;enqueueUpdate(internalInstance);}};module.exports = ReactUpdateQueue;}, {"135":135, "154":154, "27":27, "39":39, "57":57, "67":67, "68":68, "87":87}], 87:[function(_dereq_, module, exports){"use strict";var CallbackQueue=_dereq_(6);var PooledClass=_dereq_(28);var ReactCurrentOwner=_dereq_(39);var ReactPerf=_dereq_(75);var ReactReconciler=_dereq_(81);var Transaction=_dereq_(103);var assign=_dereq_(27);var invariant=_dereq_(135);var warning=_dereq_(154);var dirtyComponents=[];var asapCallbackQueue=CallbackQueue.getPooled();var asapEnqueued=false;var batchingStrategy=null;function ensureInjected(){"production" !== "development"?invariant(ReactUpdates.ReactReconcileTransaction && batchingStrategy, "ReactUpdates: must inject a reconcile transaction class and batching " + "strategy"):invariant(ReactUpdates.ReactReconcileTransaction && batchingStrategy);}var NESTED_UPDATES={initialize:function initialize(){this.dirtyComponentsLength = dirtyComponents.length;}, close:function close(){if(this.dirtyComponentsLength !== dirtyComponents.length){dirtyComponents.splice(0, this.dirtyComponentsLength);flushBatchedUpdates();}else {dirtyComponents.length = 0;}}};var UPDATE_QUEUEING={initialize:function initialize(){this.callbackQueue.reset();}, close:function close(){this.callbackQueue.notifyAll();}};var TRANSACTION_WRAPPERS=[NESTED_UPDATES, UPDATE_QUEUEING];function ReactUpdatesFlushTransaction(){this.reinitializeTransaction();this.dirtyComponentsLength = null;this.callbackQueue = CallbackQueue.getPooled();this.reconcileTransaction = ReactUpdates.ReactReconcileTransaction.getPooled();}assign(ReactUpdatesFlushTransaction.prototype, Transaction.Mixin, {getTransactionWrappers:function getTransactionWrappers(){return TRANSACTION_WRAPPERS;}, destructor:function destructor(){this.dirtyComponentsLength = null;CallbackQueue.release(this.callbackQueue);this.callbackQueue = null;ReactUpdates.ReactReconcileTransaction.release(this.reconcileTransaction);this.reconcileTransaction = null;}, perform:function perform(method, scope, a){return Transaction.Mixin.perform.call(this, this.reconcileTransaction.perform, this.reconcileTransaction, method, scope, a);}});PooledClass.addPoolingTo(ReactUpdatesFlushTransaction);function batchedUpdates(callback, a, b, c, d){ensureInjected();batchingStrategy.batchedUpdates(callback, a, b, c, d);}function mountOrderComparator(c1, c2){return c1._mountOrder - c2._mountOrder;}function runBatchedUpdates(transaction){var len=transaction.dirtyComponentsLength;"production" !== "development"?invariant(len === dirtyComponents.length, "Expected flush transaction's stored dirty-components length (%s) to " + "match dirty-components array length (%s).", len, dirtyComponents.length):invariant(len === dirtyComponents.length);dirtyComponents.sort(mountOrderComparator);for(var i=0; i < len; i++) {var component=dirtyComponents[i];var callbacks=component._pendingCallbacks;component._pendingCallbacks = null;ReactReconciler.performUpdateIfNecessary(component, transaction.reconcileTransaction);if(callbacks){for(var j=0; j < callbacks.length; j++) {transaction.callbackQueue.enqueue(callbacks[j], component.getPublicInstance());}}}}var flushBatchedUpdates=function flushBatchedUpdates(){while(dirtyComponents.length || asapEnqueued) {if(dirtyComponents.length){var transaction=ReactUpdatesFlushTransaction.getPooled();transaction.perform(runBatchedUpdates, null, transaction);ReactUpdatesFlushTransaction.release(transaction);}if(asapEnqueued){asapEnqueued = false;var queue=asapCallbackQueue;asapCallbackQueue = CallbackQueue.getPooled();queue.notifyAll();CallbackQueue.release(queue);}}};flushBatchedUpdates = ReactPerf.measure("ReactUpdates", "flushBatchedUpdates", flushBatchedUpdates);function enqueueUpdate(component){ensureInjected();"production" !== "development"?warning(ReactCurrentOwner.current == null, "enqueueUpdate(): Render methods should be a pure function of props " + "and state; triggering nested component updates from render is not " + "allowed. If necessary, trigger nested updates in " + "componentDidUpdate."):null;if(!batchingStrategy.isBatchingUpdates){batchingStrategy.batchedUpdates(enqueueUpdate, component);return;}dirtyComponents.push(component);}function asap(callback, context){"production" !== "development"?invariant(batchingStrategy.isBatchingUpdates, "ReactUpdates.asap: Can't enqueue an asap callback in a context where" + "updates are not being batched."):invariant(batchingStrategy.isBatchingUpdates);asapCallbackQueue.enqueue(callback, context);asapEnqueued = true;}var ReactUpdatesInjection={injectReconcileTransaction:function injectReconcileTransaction(ReconcileTransaction){"production" !== "development"?invariant(ReconcileTransaction, "ReactUpdates: must provide a reconcile transaction class"):invariant(ReconcileTransaction);ReactUpdates.ReactReconcileTransaction = ReconcileTransaction;}, injectBatchingStrategy:function injectBatchingStrategy(_batchingStrategy){"production" !== "development"?invariant(_batchingStrategy, "ReactUpdates: must provide a batching strategy"):invariant(_batchingStrategy);"production" !== "development"?invariant(typeof _batchingStrategy.batchedUpdates === "function", "ReactUpdates: must provide a batchedUpdates() function"):invariant(typeof _batchingStrategy.batchedUpdates === "function");"production" !== "development"?invariant(typeof _batchingStrategy.isBatchingUpdates === "boolean", "ReactUpdates: must provide an isBatchingUpdates boolean attribute"):invariant(typeof _batchingStrategy.isBatchingUpdates === "boolean");batchingStrategy = _batchingStrategy;}};var ReactUpdates={ReactReconcileTransaction:null, batchedUpdates:batchedUpdates, enqueueUpdate:enqueueUpdate, flushBatchedUpdates:flushBatchedUpdates, injection:ReactUpdatesInjection, asap:asap};module.exports = ReactUpdates;}, {"103":103, "135":135, "154":154, "27":27, "28":28, "39":39, "6":6, "75":75, "81":81}], 88:[function(_dereq_, module, exports){"use strict";var DOMProperty=_dereq_(10);var MUST_USE_ATTRIBUTE=DOMProperty.injection.MUST_USE_ATTRIBUTE;var SVGDOMPropertyConfig={Properties:{clipPath:MUST_USE_ATTRIBUTE, cx:MUST_USE_ATTRIBUTE, cy:MUST_USE_ATTRIBUTE, d:MUST_USE_ATTRIBUTE, dx:MUST_USE_ATTRIBUTE, dy:MUST_USE_ATTRIBUTE, fill:MUST_USE_ATTRIBUTE, fillOpacity:MUST_USE_ATTRIBUTE, fontFamily:MUST_USE_ATTRIBUTE, fontSize:MUST_USE_ATTRIBUTE, fx:MUST_USE_ATTRIBUTE, fy:MUST_USE_ATTRIBUTE, gradientTransform:MUST_USE_ATTRIBUTE, gradientUnits:MUST_USE_ATTRIBUTE, markerEnd:MUST_USE_ATTRIBUTE, markerMid:MUST_USE_ATTRIBUTE, markerStart:MUST_USE_ATTRIBUTE, offset:MUST_USE_ATTRIBUTE, opacity:MUST_USE_ATTRIBUTE, patternContentUnits:MUST_USE_ATTRIBUTE, patternUnits:MUST_USE_ATTRIBUTE, points:MUST_USE_ATTRIBUTE, preserveAspectRatio:MUST_USE_ATTRIBUTE, r:MUST_USE_ATTRIBUTE, rx:MUST_USE_ATTRIBUTE, ry:MUST_USE_ATTRIBUTE, spreadMethod:MUST_USE_ATTRIBUTE, stopColor:MUST_USE_ATTRIBUTE, stopOpacity:MUST_USE_ATTRIBUTE, stroke:MUST_USE_ATTRIBUTE, strokeDasharray:MUST_USE_ATTRIBUTE, strokeLinecap:MUST_USE_ATTRIBUTE, strokeOpacity:MUST_USE_ATTRIBUTE, strokeWidth:MUST_USE_ATTRIBUTE, textAnchor:MUST_USE_ATTRIBUTE, transform:MUST_USE_ATTRIBUTE, version:MUST_USE_ATTRIBUTE, viewBox:MUST_USE_ATTRIBUTE, x1:MUST_USE_ATTRIBUTE, x2:MUST_USE_ATTRIBUTE, x:MUST_USE_ATTRIBUTE, y1:MUST_USE_ATTRIBUTE, y2:MUST_USE_ATTRIBUTE, y:MUST_USE_ATTRIBUTE}, DOMAttributeNames:{clipPath:"clip-path", fillOpacity:"fill-opacity", fontFamily:"font-family", fontSize:"font-size", gradientTransform:"gradientTransform", gradientUnits:"gradientUnits", markerEnd:"marker-end", markerMid:"marker-mid", markerStart:"marker-start", patternContentUnits:"patternContentUnits", patternUnits:"patternUnits", preserveAspectRatio:"preserveAspectRatio", spreadMethod:"spreadMethod", stopColor:"stop-color", stopOpacity:"stop-opacity", strokeDasharray:"stroke-dasharray", strokeLinecap:"stroke-linecap", strokeOpacity:"stroke-opacity", strokeWidth:"stroke-width", textAnchor:"text-anchor", viewBox:"viewBox"}};module.exports = SVGDOMPropertyConfig;}, {"10":10}], 89:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var EventPropagators=_dereq_(20);var ReactInputSelection=_dereq_(65);var SyntheticEvent=_dereq_(95);var getActiveElement=_dereq_(121);var isTextInputElement=_dereq_(138);var keyOf=_dereq_(141);var shallowEqual=_dereq_(150);var topLevelTypes=EventConstants.topLevelTypes;var eventTypes={select:{phasedRegistrationNames:{bubbled:keyOf({onSelect:null}), captured:keyOf({onSelectCapture:null})}, dependencies:[topLevelTypes.topBlur, topLevelTypes.topContextMenu, topLevelTypes.topFocus, topLevelTypes.topKeyDown, topLevelTypes.topMouseDown, topLevelTypes.topMouseUp, topLevelTypes.topSelectionChange]}};var activeElement=null;var activeElementID=null;var lastSelection=null;var mouseDown=false;function getSelection(node){if("selectionStart" in node && ReactInputSelection.hasSelectionCapabilities(node)){return {start:node.selectionStart, end:node.selectionEnd};}else if(window.getSelection){var selection=window.getSelection();return {anchorNode:selection.anchorNode, anchorOffset:selection.anchorOffset, focusNode:selection.focusNode, focusOffset:selection.focusOffset};}else if(document.selection){var range=document.selection.createRange();return {parentElement:range.parentElement(), text:range.text, top:range.boundingTop, left:range.boundingLeft};}}function constructSelectEvent(nativeEvent){if(mouseDown || activeElement == null || activeElement !== getActiveElement()){return null;}var currentSelection=getSelection(activeElement);if(!lastSelection || !shallowEqual(lastSelection, currentSelection)){lastSelection = currentSelection;var syntheticEvent=SyntheticEvent.getPooled(eventTypes.select, activeElementID, nativeEvent);syntheticEvent.type = "select";syntheticEvent.target = activeElement;EventPropagators.accumulateTwoPhaseDispatches(syntheticEvent);return syntheticEvent;}}var SelectEventPlugin={eventTypes:eventTypes, extractEvents:function extractEvents(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent){switch(topLevelType){case topLevelTypes.topFocus:if(isTextInputElement(topLevelTarget) || topLevelTarget.contentEditable === "true"){activeElement = topLevelTarget;activeElementID = topLevelTargetID;lastSelection = null;}break;case topLevelTypes.topBlur:activeElement = null;activeElementID = null;lastSelection = null;break;case topLevelTypes.topMouseDown:mouseDown = true;break;case topLevelTypes.topContextMenu:case topLevelTypes.topMouseUp:mouseDown = false;return constructSelectEvent(nativeEvent);case topLevelTypes.topSelectionChange:case topLevelTypes.topKeyDown:case topLevelTypes.topKeyUp:return constructSelectEvent(nativeEvent);}}};module.exports = SelectEventPlugin;}, {"121":121, "138":138, "141":141, "15":15, "150":150, "20":20, "65":65, "95":95}], 90:[function(_dereq_, module, exports){"use strict";var GLOBAL_MOUNT_POINT_MAX=Math.pow(2, 53);var ServerReactRootIndex={createReactRootIndex:function createReactRootIndex(){return Math.ceil(Math.random() * GLOBAL_MOUNT_POINT_MAX);}};module.exports = ServerReactRootIndex;}, {}], 91:[function(_dereq_, module, exports){"use strict";var EventConstants=_dereq_(15);var EventPluginUtils=_dereq_(19);var EventPropagators=_dereq_(20);var SyntheticClipboardEvent=_dereq_(92);var SyntheticEvent=_dereq_(95);var SyntheticFocusEvent=_dereq_(96);var SyntheticKeyboardEvent=_dereq_(98);var SyntheticMouseEvent=_dereq_(99);var SyntheticDragEvent=_dereq_(94);var SyntheticTouchEvent=_dereq_(100);var SyntheticUIEvent=_dereq_(101);var SyntheticWheelEvent=_dereq_(102);var getEventCharCode=_dereq_(122);var invariant=_dereq_(135);var keyOf=_dereq_(141);var warning=_dereq_(154);var topLevelTypes=EventConstants.topLevelTypes;var eventTypes={blur:{phasedRegistrationNames:{bubbled:keyOf({onBlur:true}), captured:keyOf({onBlurCapture:true})}}, click:{phasedRegistrationNames:{bubbled:keyOf({onClick:true}), captured:keyOf({onClickCapture:true})}}, contextMenu:{phasedRegistrationNames:{bubbled:keyOf({onContextMenu:true}), captured:keyOf({onContextMenuCapture:true})}}, copy:{phasedRegistrationNames:{bubbled:keyOf({onCopy:true}), captured:keyOf({onCopyCapture:true})}}, cut:{phasedRegistrationNames:{bubbled:keyOf({onCut:true}), captured:keyOf({onCutCapture:true})}}, doubleClick:{phasedRegistrationNames:{bubbled:keyOf({onDoubleClick:true}), captured:keyOf({onDoubleClickCapture:true})}}, drag:{phasedRegistrationNames:{bubbled:keyOf({onDrag:true}), captured:keyOf({onDragCapture:true})}}, dragEnd:{phasedRegistrationNames:{bubbled:keyOf({onDragEnd:true}), captured:keyOf({onDragEndCapture:true})}}, dragEnter:{phasedRegistrationNames:{bubbled:keyOf({onDragEnter:true}), captured:keyOf({onDragEnterCapture:true})}}, dragExit:{phasedRegistrationNames:{bubbled:keyOf({onDragExit:true}), captured:keyOf({onDragExitCapture:true})}}, dragLeave:{phasedRegistrationNames:{bubbled:keyOf({onDragLeave:true}), captured:keyOf({onDragLeaveCapture:true})}}, dragOver:{phasedRegistrationNames:{bubbled:keyOf({onDragOver:true}), captured:keyOf({onDragOverCapture:true})}}, dragStart:{phasedRegistrationNames:{bubbled:keyOf({onDragStart:true}), captured:keyOf({onDragStartCapture:true})}}, drop:{phasedRegistrationNames:{bubbled:keyOf({onDrop:true}), captured:keyOf({onDropCapture:true})}}, focus:{phasedRegistrationNames:{bubbled:keyOf({onFocus:true}), captured:keyOf({onFocusCapture:true})}}, input:{phasedRegistrationNames:{bubbled:keyOf({onInput:true}), captured:keyOf({onInputCapture:true})}}, keyDown:{phasedRegistrationNames:{bubbled:keyOf({onKeyDown:true}), captured:keyOf({onKeyDownCapture:true})}}, keyPress:{phasedRegistrationNames:{bubbled:keyOf({onKeyPress:true}), captured:keyOf({onKeyPressCapture:true})}}, keyUp:{phasedRegistrationNames:{bubbled:keyOf({onKeyUp:true}), captured:keyOf({onKeyUpCapture:true})}}, load:{phasedRegistrationNames:{bubbled:keyOf({onLoad:true}), captured:keyOf({onLoadCapture:true})}}, error:{phasedRegistrationNames:{bubbled:keyOf({onError:true}), captured:keyOf({onErrorCapture:true})}}, mouseDown:{phasedRegistrationNames:{bubbled:keyOf({onMouseDown:true}), captured:keyOf({onMouseDownCapture:true})}}, mouseMove:{phasedRegistrationNames:{bubbled:keyOf({onMouseMove:true}), captured:keyOf({onMouseMoveCapture:true})}}, mouseOut:{phasedRegistrationNames:{bubbled:keyOf({onMouseOut:true}), captured:keyOf({onMouseOutCapture:true})}}, mouseOver:{phasedRegistrationNames:{bubbled:keyOf({onMouseOver:true}), captured:keyOf({onMouseOverCapture:true})}}, mouseUp:{phasedRegistrationNames:{bubbled:keyOf({onMouseUp:true}), captured:keyOf({onMouseUpCapture:true})}}, paste:{phasedRegistrationNames:{bubbled:keyOf({onPaste:true}), captured:keyOf({onPasteCapture:true})}}, reset:{phasedRegistrationNames:{bubbled:keyOf({onReset:true}), captured:keyOf({onResetCapture:true})}}, scroll:{phasedRegistrationNames:{bubbled:keyOf({onScroll:true}), captured:keyOf({onScrollCapture:true})}}, submit:{phasedRegistrationNames:{bubbled:keyOf({onSubmit:true}), captured:keyOf({onSubmitCapture:true})}}, touchCancel:{phasedRegistrationNames:{bubbled:keyOf({onTouchCancel:true}), captured:keyOf({onTouchCancelCapture:true})}}, touchEnd:{phasedRegistrationNames:{bubbled:keyOf({onTouchEnd:true}), captured:keyOf({onTouchEndCapture:true})}}, touchMove:{phasedRegistrationNames:{bubbled:keyOf({onTouchMove:true}), captured:keyOf({onTouchMoveCapture:true})}}, touchStart:{phasedRegistrationNames:{bubbled:keyOf({onTouchStart:true}), captured:keyOf({onTouchStartCapture:true})}}, wheel:{phasedRegistrationNames:{bubbled:keyOf({onWheel:true}), captured:keyOf({onWheelCapture:true})}}};var topLevelEventsToDispatchConfig={topBlur:eventTypes.blur, topClick:eventTypes.click, topContextMenu:eventTypes.contextMenu, topCopy:eventTypes.copy, topCut:eventTypes.cut, topDoubleClick:eventTypes.doubleClick, topDrag:eventTypes.drag, topDragEnd:eventTypes.dragEnd, topDragEnter:eventTypes.dragEnter, topDragExit:eventTypes.dragExit, topDragLeave:eventTypes.dragLeave, topDragOver:eventTypes.dragOver, topDragStart:eventTypes.dragStart, topDrop:eventTypes.drop, topError:eventTypes.error, topFocus:eventTypes.focus, topInput:eventTypes.input, topKeyDown:eventTypes.keyDown, topKeyPress:eventTypes.keyPress, topKeyUp:eventTypes.keyUp, topLoad:eventTypes.load, topMouseDown:eventTypes.mouseDown, topMouseMove:eventTypes.mouseMove, topMouseOut:eventTypes.mouseOut, topMouseOver:eventTypes.mouseOver, topMouseUp:eventTypes.mouseUp, topPaste:eventTypes.paste, topReset:eventTypes.reset, topScroll:eventTypes.scroll, topSubmit:eventTypes.submit, topTouchCancel:eventTypes.touchCancel, topTouchEnd:eventTypes.touchEnd, topTouchMove:eventTypes.touchMove, topTouchStart:eventTypes.touchStart, topWheel:eventTypes.wheel};for(var type in topLevelEventsToDispatchConfig) {topLevelEventsToDispatchConfig[type].dependencies = [type];}var SimpleEventPlugin={eventTypes:eventTypes, executeDispatch:function executeDispatch(event, listener, domID){var returnValue=EventPluginUtils.executeDispatch(event, listener, domID);"production" !== "development"?warning(typeof returnValue !== "boolean", "Returning `false` from an event handler is deprecated and will be " + "ignored in a future release. Instead, manually call " + "e.stopPropagation() or e.preventDefault(), as appropriate."):null;if(returnValue === false){event.stopPropagation();event.preventDefault();}}, extractEvents:function extractEvents(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent){var dispatchConfig=topLevelEventsToDispatchConfig[topLevelType];if(!dispatchConfig){return null;}var EventConstructor;switch(topLevelType){case topLevelTypes.topInput:case topLevelTypes.topLoad:case topLevelTypes.topError:case topLevelTypes.topReset:case topLevelTypes.topSubmit:EventConstructor = SyntheticEvent;break;case topLevelTypes.topKeyPress:if(getEventCharCode(nativeEvent) === 0){return null;}case topLevelTypes.topKeyDown:case topLevelTypes.topKeyUp:EventConstructor = SyntheticKeyboardEvent;break;case topLevelTypes.topBlur:case topLevelTypes.topFocus:EventConstructor = SyntheticFocusEvent;break;case topLevelTypes.topClick:if(nativeEvent.button === 2){return null;}case topLevelTypes.topContextMenu:case topLevelTypes.topDoubleClick:case topLevelTypes.topMouseDown:case topLevelTypes.topMouseMove:case topLevelTypes.topMouseOut:case topLevelTypes.topMouseOver:case topLevelTypes.topMouseUp:EventConstructor = SyntheticMouseEvent;break;case topLevelTypes.topDrag:case topLevelTypes.topDragEnd:case topLevelTypes.topDragEnter:case topLevelTypes.topDragExit:case topLevelTypes.topDragLeave:case topLevelTypes.topDragOver:case topLevelTypes.topDragStart:case topLevelTypes.topDrop:EventConstructor = SyntheticDragEvent;break;case topLevelTypes.topTouchCancel:case topLevelTypes.topTouchEnd:case topLevelTypes.topTouchMove:case topLevelTypes.topTouchStart:EventConstructor = SyntheticTouchEvent;break;case topLevelTypes.topScroll:EventConstructor = SyntheticUIEvent;break;case topLevelTypes.topWheel:EventConstructor = SyntheticWheelEvent;break;case topLevelTypes.topCopy:case topLevelTypes.topCut:case topLevelTypes.topPaste:EventConstructor = SyntheticClipboardEvent;break;}"production" !== "development"?invariant(EventConstructor, "SimpleEventPlugin: Unhandled event type, `%s`.", topLevelType):invariant(EventConstructor);var event=EventConstructor.getPooled(dispatchConfig, topLevelTargetID, nativeEvent);EventPropagators.accumulateTwoPhaseDispatches(event);return event;}};module.exports = SimpleEventPlugin;}, {"100":100, "101":101, "102":102, "122":122, "135":135, "141":141, "15":15, "154":154, "19":19, "20":20, "92":92, "94":94, "95":95, "96":96, "98":98, "99":99}], 92:[function(_dereq_, module, exports){"use strict";var SyntheticEvent=_dereq_(95);var ClipboardEventInterface={clipboardData:function clipboardData(event){return "clipboardData" in event?event.clipboardData:window.clipboardData;}};function SyntheticClipboardEvent(dispatchConfig, dispatchMarker, nativeEvent){SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);}SyntheticEvent.augmentClass(SyntheticClipboardEvent, ClipboardEventInterface);module.exports = SyntheticClipboardEvent;}, {"95":95}], 93:[function(_dereq_, module, exports){"use strict";var SyntheticEvent=_dereq_(95);var CompositionEventInterface={data:null};function SyntheticCompositionEvent(dispatchConfig, dispatchMarker, nativeEvent){SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);}SyntheticEvent.augmentClass(SyntheticCompositionEvent, CompositionEventInterface);module.exports = SyntheticCompositionEvent;}, {"95":95}], 94:[function(_dereq_, module, exports){"use strict";var SyntheticMouseEvent=_dereq_(99);var DragEventInterface={dataTransfer:null};function SyntheticDragEvent(dispatchConfig, dispatchMarker, nativeEvent){SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);}SyntheticMouseEvent.augmentClass(SyntheticDragEvent, DragEventInterface);module.exports = SyntheticDragEvent;}, {"99":99}], 95:[function(_dereq_, module, exports){"use strict";var PooledClass=_dereq_(28);var assign=_dereq_(27);var emptyFunction=_dereq_(114);var getEventTarget=_dereq_(125);var EventInterface={type:null, target:getEventTarget, currentTarget:emptyFunction.thatReturnsNull, eventPhase:null, bubbles:null, cancelable:null, timeStamp:function timeStamp(event){return event.timeStamp || Date.now();}, defaultPrevented:null, isTrusted:null};function SyntheticEvent(dispatchConfig, dispatchMarker, nativeEvent){this.dispatchConfig = dispatchConfig;this.dispatchMarker = dispatchMarker;this.nativeEvent = nativeEvent;var Interface=this.constructor.Interface;for(var propName in Interface) {if(!Interface.hasOwnProperty(propName)){continue;}var normalize=Interface[propName];if(normalize){this[propName] = normalize(nativeEvent);}else {this[propName] = nativeEvent[propName];}}var defaultPrevented=nativeEvent.defaultPrevented != null?nativeEvent.defaultPrevented:nativeEvent.returnValue === false;if(defaultPrevented){this.isDefaultPrevented = emptyFunction.thatReturnsTrue;}else {this.isDefaultPrevented = emptyFunction.thatReturnsFalse;}this.isPropagationStopped = emptyFunction.thatReturnsFalse;}assign(SyntheticEvent.prototype, {preventDefault:function preventDefault(){this.defaultPrevented = true;var event=this.nativeEvent;if(event.preventDefault){event.preventDefault();}else {event.returnValue = false;}this.isDefaultPrevented = emptyFunction.thatReturnsTrue;}, stopPropagation:function stopPropagation(){var event=this.nativeEvent;if(event.stopPropagation){event.stopPropagation();}else {event.cancelBubble = true;}this.isPropagationStopped = emptyFunction.thatReturnsTrue;}, persist:function persist(){this.isPersistent = emptyFunction.thatReturnsTrue;}, isPersistent:emptyFunction.thatReturnsFalse, destructor:function destructor(){var Interface=this.constructor.Interface;for(var propName in Interface) {this[propName] = null;}this.dispatchConfig = null;this.dispatchMarker = null;this.nativeEvent = null;}});SyntheticEvent.Interface = EventInterface;SyntheticEvent.augmentClass = function(Class, Interface){var Super=this;var prototype=Object.create(Super.prototype);assign(prototype, Class.prototype);Class.prototype = prototype;Class.prototype.constructor = Class;Class.Interface = assign({}, Super.Interface, Interface);Class.augmentClass = Super.augmentClass;PooledClass.addPoolingTo(Class, PooledClass.threeArgumentPooler);};PooledClass.addPoolingTo(SyntheticEvent, PooledClass.threeArgumentPooler);module.exports = SyntheticEvent;}, {"114":114, "125":125, "27":27, "28":28}], 96:[function(_dereq_, module, exports){"use strict";var SyntheticUIEvent=_dereq_(101);var FocusEventInterface={relatedTarget:null};function SyntheticFocusEvent(dispatchConfig, dispatchMarker, nativeEvent){SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);}SyntheticUIEvent.augmentClass(SyntheticFocusEvent, FocusEventInterface);module.exports = SyntheticFocusEvent;}, {"101":101}], 97:[function(_dereq_, module, exports){"use strict";var SyntheticEvent=_dereq_(95);var InputEventInterface={data:null};function SyntheticInputEvent(dispatchConfig, dispatchMarker, nativeEvent){SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);}SyntheticEvent.augmentClass(SyntheticInputEvent, InputEventInterface);module.exports = SyntheticInputEvent;}, {"95":95}], 98:[function(_dereq_, module, exports){"use strict";var SyntheticUIEvent=_dereq_(101);var getEventCharCode=_dereq_(122);var getEventKey=_dereq_(123);var getEventModifierState=_dereq_(124);var KeyboardEventInterface={key:getEventKey, location:null, ctrlKey:null, shiftKey:null, altKey:null, metaKey:null, repeat:null, locale:null, getModifierState:getEventModifierState, charCode:function charCode(event){if(event.type === "keypress"){return getEventCharCode(event);}return 0;}, keyCode:function keyCode(event){if(event.type === "keydown" || event.type === "keyup"){return event.keyCode;}return 0;}, which:function which(event){if(event.type === "keypress"){return getEventCharCode(event);}if(event.type === "keydown" || event.type === "keyup"){return event.keyCode;}return 0;}};function SyntheticKeyboardEvent(dispatchConfig, dispatchMarker, nativeEvent){SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);}SyntheticUIEvent.augmentClass(SyntheticKeyboardEvent, KeyboardEventInterface);module.exports = SyntheticKeyboardEvent;}, {"101":101, "122":122, "123":123, "124":124}], 99:[function(_dereq_, module, exports){"use strict";var SyntheticUIEvent=_dereq_(101);var ViewportMetrics=_dereq_(104);var getEventModifierState=_dereq_(124);var MouseEventInterface={screenX:null, screenY:null, clientX:null, clientY:null, ctrlKey:null, shiftKey:null, altKey:null, metaKey:null, getModifierState:getEventModifierState, button:function button(event){var button=event.button;if("which" in event){return button;}return button === 2?2:button === 4?1:0;}, buttons:null, relatedTarget:function relatedTarget(event){return event.relatedTarget || (event.fromElement === event.srcElement?event.toElement:event.fromElement);}, pageX:function pageX(event){return "pageX" in event?event.pageX:event.clientX + ViewportMetrics.currentScrollLeft;}, pageY:function pageY(event){return "pageY" in event?event.pageY:event.clientY + ViewportMetrics.currentScrollTop;}};function SyntheticMouseEvent(dispatchConfig, dispatchMarker, nativeEvent){SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);}SyntheticUIEvent.augmentClass(SyntheticMouseEvent, MouseEventInterface);module.exports = SyntheticMouseEvent;}, {"101":101, "104":104, "124":124}], 100:[function(_dereq_, module, exports){"use strict";var SyntheticUIEvent=_dereq_(101);var getEventModifierState=_dereq_(124);var TouchEventInterface={touches:null, targetTouches:null, changedTouches:null, altKey:null, metaKey:null, ctrlKey:null, shiftKey:null, getModifierState:getEventModifierState};function SyntheticTouchEvent(dispatchConfig, dispatchMarker, nativeEvent){SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);}SyntheticUIEvent.augmentClass(SyntheticTouchEvent, TouchEventInterface);module.exports = SyntheticTouchEvent;}, {"101":101, "124":124}], 101:[function(_dereq_, module, exports){"use strict";var SyntheticEvent=_dereq_(95);var getEventTarget=_dereq_(125);var UIEventInterface={view:function view(event){if(event.view){return event.view;}var target=getEventTarget(event);if(target != null && target.window === target){return target;}var doc=target.ownerDocument;if(doc){return doc.defaultView || doc.parentWindow;}else {return window;}}, detail:function detail(event){return event.detail || 0;}};function SyntheticUIEvent(dispatchConfig, dispatchMarker, nativeEvent){SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);}SyntheticEvent.augmentClass(SyntheticUIEvent, UIEventInterface);module.exports = SyntheticUIEvent;}, {"125":125, "95":95}], 102:[function(_dereq_, module, exports){"use strict";var SyntheticMouseEvent=_dereq_(99);var WheelEventInterface={deltaX:function deltaX(event){return "deltaX" in event?event.deltaX:"wheelDeltaX" in event?-event.wheelDeltaX:0;}, deltaY:function deltaY(event){return "deltaY" in event?event.deltaY:"wheelDeltaY" in event?-event.wheelDeltaY:"wheelDelta" in event?-event.wheelDelta:0;}, deltaZ:null, deltaMode:null};function SyntheticWheelEvent(dispatchConfig, dispatchMarker, nativeEvent){SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);}SyntheticMouseEvent.augmentClass(SyntheticWheelEvent, WheelEventInterface);module.exports = SyntheticWheelEvent;}, {"99":99}], 103:[function(_dereq_, module, exports){"use strict";var invariant=_dereq_(135);var Mixin={reinitializeTransaction:function reinitializeTransaction(){this.transactionWrappers = this.getTransactionWrappers();if(!this.wrapperInitData){this.wrapperInitData = [];}else {this.wrapperInitData.length = 0;}this._isInTransaction = false;}, _isInTransaction:false, getTransactionWrappers:null, isInTransaction:function isInTransaction(){return !!this._isInTransaction;}, perform:function perform(method, scope, a, b, c, d, e, f){"production" !== "development"?invariant(!this.isInTransaction(), "Transaction.perform(...): Cannot initialize a transaction when there " + "is already an outstanding transaction."):invariant(!this.isInTransaction());var errorThrown;var ret;try{this._isInTransaction = true;errorThrown = true;this.initializeAll(0);ret = method.call(scope, a, b, c, d, e, f);errorThrown = false;}finally {try{if(errorThrown){try{this.closeAll(0);}catch(err) {}}else {this.closeAll(0);}}finally {this._isInTransaction = false;}}return ret;}, initializeAll:function initializeAll(startIndex){var transactionWrappers=this.transactionWrappers;for(var i=startIndex; i < transactionWrappers.length; i++) {var wrapper=transactionWrappers[i];try{this.wrapperInitData[i] = Transaction.OBSERVED_ERROR;this.wrapperInitData[i] = wrapper.initialize?wrapper.initialize.call(this):null;}finally {if(this.wrapperInitData[i] === Transaction.OBSERVED_ERROR){try{this.initializeAll(i + 1);}catch(err) {}}}}}, closeAll:function closeAll(startIndex){"production" !== "development"?invariant(this.isInTransaction(), "Transaction.closeAll(): Cannot close transaction when none are open."):invariant(this.isInTransaction());var transactionWrappers=this.transactionWrappers;for(var i=startIndex; i < transactionWrappers.length; i++) {var wrapper=transactionWrappers[i];var initData=this.wrapperInitData[i];var errorThrown;try{errorThrown = true;if(initData !== Transaction.OBSERVED_ERROR && wrapper.close){wrapper.close.call(this, initData);}errorThrown = false;}finally {if(errorThrown){try{this.closeAll(i + 1);}catch(e) {}}}}this.wrapperInitData.length = 0;}};var Transaction={Mixin:Mixin, OBSERVED_ERROR:{}};module.exports = Transaction;}, {"135":135}], 104:[function(_dereq_, module, exports){"use strict";var ViewportMetrics={currentScrollLeft:0, currentScrollTop:0, refreshScrollValues:function refreshScrollValues(scrollPosition){ViewportMetrics.currentScrollLeft = scrollPosition.x;ViewportMetrics.currentScrollTop = scrollPosition.y;}};module.exports = ViewportMetrics;}, {}], 105:[function(_dereq_, module, exports){"use strict";var invariant=_dereq_(135);function accumulateInto(current, next){"production" !== "development"?invariant(next != null, "accumulateInto(...): Accumulated items must not be null or undefined."):invariant(next != null);if(current == null){return next;}var currentIsArray=Array.isArray(current);var nextIsArray=Array.isArray(next);if(currentIsArray && nextIsArray){current.push.apply(current, next);return current;}if(currentIsArray){current.push(next);return current;}if(nextIsArray){return [current].concat(next);}return [current, next];}module.exports = accumulateInto;}, {"135":135}], 106:[function(_dereq_, module, exports){"use strict";var MOD=65521;function adler32(data){var a=1;var b=0;for(var i=0; i < data.length; i++) {a = (a + data.charCodeAt(i)) % MOD;b = (b + a) % MOD;}return a | b << 16;}module.exports = adler32;}, {}], 107:[function(_dereq_, module, exports){var _hyphenPattern=/-(.)/g;function camelize(string){return string.replace(_hyphenPattern, function(_, character){return character.toUpperCase();});}module.exports = camelize;}, {}], 108:[function(_dereq_, module, exports){"use strict";var camelize=_dereq_(107);var msPattern=/^-ms-/;function camelizeStyleName(string){return camelize(string.replace(msPattern, "ms-"));}module.exports = camelizeStyleName;}, {"107":107}], 109:[function(_dereq_, module, exports){var isTextNode=_dereq_(139);function containsNode(_x, _x2){var _again=true;_function: while(_again) {var outerNode=_x, innerNode=_x2;_again = false;if(!outerNode || !innerNode){return false;}else if(outerNode === innerNode){return true;}else if(isTextNode(outerNode)){return false;}else if(isTextNode(innerNode)){_x = outerNode;_x2 = innerNode.parentNode;_again = true;continue _function;}else if(outerNode.contains){return outerNode.contains(innerNode);}else if(outerNode.compareDocumentPosition){return !!(outerNode.compareDocumentPosition(innerNode) & 16);}else {return false;}}}module.exports = containsNode;}, {"139":139}], 110:[function(_dereq_, module, exports){var toArray=_dereq_(152);function hasArrayNature(obj){return (!!obj && (typeof obj == "object" || typeof obj == "function") && "length" in obj && !("setInterval" in obj) && typeof obj.nodeType != "number" && (Array.isArray(obj) || "callee" in obj || "item" in obj));}function createArrayFromMixed(obj){if(!hasArrayNature(obj)){return [obj];}else if(Array.isArray(obj)){return obj.slice();}else {return toArray(obj);}}module.exports = createArrayFromMixed;}, {"152":152}], 111:[function(_dereq_, module, exports){"use strict";var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var invariant=_dereq_(135);function createFullPageComponent(tag){var elementFactory=ReactElement.createFactory(tag);var FullPageComponent=ReactClass.createClass({tagName:tag.toUpperCase(), displayName:"ReactFullPageComponent" + tag, componentWillUnmount:function componentWillUnmount(){"production" !== "development"?invariant(false, "%s tried to unmount. Because of cross-browser quirks it is " + "impossible to unmount some top-level components (eg <html>, <head>, " + "and <body>) reliably and efficiently. To fix this, have a single " + "top-level component that never unmounts render these elements.", this.constructor.displayName):invariant(false);}, render:function render(){return elementFactory(this.props);}});return FullPageComponent;}module.exports = createFullPageComponent;}, {"135":135, "33":33, "57":57}], 112:[function(_dereq_, module, exports){var ExecutionEnvironment=_dereq_(21);var createArrayFromMixed=_dereq_(110);var getMarkupWrap=_dereq_(127);var invariant=_dereq_(135);var dummyNode=ExecutionEnvironment.canUseDOM?document.createElement("div"):null;var nodeNamePattern=/^\s*<(\w+)/;function getNodeName(markup){var nodeNameMatch=markup.match(nodeNamePattern);return nodeNameMatch && nodeNameMatch[1].toLowerCase();}function createNodesFromMarkup(markup, handleScript){var node=dummyNode;"production" !== "development"?invariant(!!dummyNode, "createNodesFromMarkup dummy not initialized"):invariant(!!dummyNode);var nodeName=getNodeName(markup);var wrap=nodeName && getMarkupWrap(nodeName);if(wrap){node.innerHTML = wrap[1] + markup + wrap[2];var wrapDepth=wrap[0];while(wrapDepth--) {node = node.lastChild;}}else {node.innerHTML = markup;}var scripts=node.getElementsByTagName("script");if(scripts.length){"production" !== "development"?invariant(handleScript, "createNodesFromMarkup(...): Unexpected <script> element rendered."):invariant(handleScript);createArrayFromMixed(scripts).forEach(handleScript);}var nodes=createArrayFromMixed(node.childNodes);while(node.lastChild) {node.removeChild(node.lastChild);}return nodes;}module.exports = createNodesFromMarkup;}, {"110":110, "127":127, "135":135, "21":21}], 113:[function(_dereq_, module, exports){"use strict";var CSSProperty=_dereq_(4);var isUnitlessNumber=CSSProperty.isUnitlessNumber;function dangerousStyleValue(name, value){var isEmpty=value == null || typeof value === "boolean" || value === "";if(isEmpty){return "";}var isNonNumeric=isNaN(value);if(isNonNumeric || value === 0 || isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name]){return "" + value;}if(typeof value === "string"){value = value.trim();}return value + "px";}module.exports = dangerousStyleValue;}, {"4":4}], 114:[function(_dereq_, module, exports){function makeEmptyFunction(arg){return function(){return arg;};}function emptyFunction(){}emptyFunction.thatReturns = makeEmptyFunction;emptyFunction.thatReturnsFalse = makeEmptyFunction(false);emptyFunction.thatReturnsTrue = makeEmptyFunction(true);emptyFunction.thatReturnsNull = makeEmptyFunction(null);emptyFunction.thatReturnsThis = function(){return this;};emptyFunction.thatReturnsArgument = function(arg){return arg;};module.exports = emptyFunction;}, {}], 115:[function(_dereq_, module, exports){"use strict";var emptyObject={};if("production" !== "development"){Object.freeze(emptyObject);}module.exports = emptyObject;}, {}], 116:[function(_dereq_, module, exports){"use strict";var ESCAPE_LOOKUP={"&":"&amp;", ">":"&gt;", "<":"&lt;", "\"":"&quot;", "'":"&#x27;"};var ESCAPE_REGEX=/[&><"']/g;function escaper(match){return ESCAPE_LOOKUP[match];}function escapeTextContentForBrowser(text){return ("" + text).replace(ESCAPE_REGEX, escaper);}module.exports = escapeTextContentForBrowser;}, {}], 117:[function(_dereq_, module, exports){"use strict";var ReactCurrentOwner=_dereq_(39);var ReactInstanceMap=_dereq_(67);var ReactMount=_dereq_(70);var invariant=_dereq_(135);var isNode=_dereq_(137);var warning=_dereq_(154);function findDOMNode(componentOrElement){if("production" !== "development"){var owner=ReactCurrentOwner.current;if(owner !== null){"production" !== "development"?warning(owner._warnedAboutRefsInRender, "%s is accessing getDOMNode or findDOMNode inside its render(). " + "render() should be a pure function of props and state. It should " + "never access something that requires stale data from the previous " + "render, such as refs. Move this logic to componentDidMount and " + "componentDidUpdate instead.", owner.getName() || "A component"):null;owner._warnedAboutRefsInRender = true;}}if(componentOrElement == null){return null;}if(isNode(componentOrElement)){return componentOrElement;}if(ReactInstanceMap.has(componentOrElement)){return ReactMount.getNodeFromInstance(componentOrElement);}"production" !== "development"?invariant(componentOrElement.render == null || typeof componentOrElement.render !== "function", "Component (with keys: %s) contains `render` method " + "but is not mounted in the DOM", Object.keys(componentOrElement)):invariant(componentOrElement.render == null || typeof componentOrElement.render !== "function");"production" !== "development"?invariant(false, "Element appears to be neither ReactComponent nor DOMNode (keys: %s)", Object.keys(componentOrElement)):invariant(false);}module.exports = findDOMNode;}, {"135":135, "137":137, "154":154, "39":39, "67":67, "70":70}], 118:[function(_dereq_, module, exports){"use strict";var traverseAllChildren=_dereq_(153);var warning=_dereq_(154);function flattenSingleChildIntoContext(traverseContext, child, name){var result=traverseContext;var keyUnique=!result.hasOwnProperty(name);if("production" !== "development"){"production" !== "development"?warning(keyUnique, "flattenChildren(...): Encountered two children with the same key, " + "`%s`. Child keys must be unique; when two children share a key, only " + "the first child will be used.", name):null;}if(keyUnique && child != null){result[name] = child;}}function flattenChildren(children){if(children == null){return children;}var result={};traverseAllChildren(children, flattenSingleChildIntoContext, result);return result;}module.exports = flattenChildren;}, {"153":153, "154":154}], 119:[function(_dereq_, module, exports){"use strict";function focusNode(node){try{node.focus();}catch(e) {}}module.exports = focusNode;}, {}], 120:[function(_dereq_, module, exports){"use strict";var forEachAccumulated=function forEachAccumulated(arr, cb, scope){if(Array.isArray(arr)){arr.forEach(cb, scope);}else if(arr){cb.call(scope, arr);}};module.exports = forEachAccumulated;}, {}], 121:[function(_dereq_, module, exports){function getActiveElement(){try{return document.activeElement || document.body;}catch(e) {return document.body;}}module.exports = getActiveElement;}, {}], 122:[function(_dereq_, module, exports){"use strict";function getEventCharCode(nativeEvent){var charCode;var keyCode=nativeEvent.keyCode;if("charCode" in nativeEvent){charCode = nativeEvent.charCode;if(charCode === 0 && keyCode === 13){charCode = 13;}}else {charCode = keyCode;}if(charCode >= 32 || charCode === 13){return charCode;}return 0;}module.exports = getEventCharCode;}, {}], 123:[function(_dereq_, module, exports){"use strict";var getEventCharCode=_dereq_(122);var normalizeKey={"Esc":"Escape", "Spacebar":" ", "Left":"ArrowLeft", "Up":"ArrowUp", "Right":"ArrowRight", "Down":"ArrowDown", "Del":"Delete", "Win":"OS", "Menu":"ContextMenu", "Apps":"ContextMenu", "Scroll":"ScrollLock", "MozPrintableKey":"Unidentified"};var translateToKey={8:"Backspace", 9:"Tab", 12:"Clear", 13:"Enter", 16:"Shift", 17:"Control", 18:"Alt", 19:"Pause", 20:"CapsLock", 27:"Escape", 32:" ", 33:"PageUp", 34:"PageDown", 35:"End", 36:"Home", 37:"ArrowLeft", 38:"ArrowUp", 39:"ArrowRight", 40:"ArrowDown", 45:"Insert", 46:"Delete", 112:"F1", 113:"F2", 114:"F3", 115:"F4", 116:"F5", 117:"F6", 118:"F7", 119:"F8", 120:"F9", 121:"F10", 122:"F11", 123:"F12", 144:"NumLock", 145:"ScrollLock", 224:"Meta"};function getEventKey(nativeEvent){if(nativeEvent.key){var key=normalizeKey[nativeEvent.key] || nativeEvent.key;if(key !== "Unidentified"){return key;}}if(nativeEvent.type === "keypress"){var charCode=getEventCharCode(nativeEvent);return charCode === 13?"Enter":String.fromCharCode(charCode);}if(nativeEvent.type === "keydown" || nativeEvent.type === "keyup"){return translateToKey[nativeEvent.keyCode] || "Unidentified";}return "";}module.exports = getEventKey;}, {"122":122}], 124:[function(_dereq_, module, exports){"use strict";var modifierKeyToProp={"Alt":"altKey", "Control":"ctrlKey", "Meta":"metaKey", "Shift":"shiftKey"};function modifierStateGetter(keyArg){var syntheticEvent=this;var nativeEvent=syntheticEvent.nativeEvent;if(nativeEvent.getModifierState){return nativeEvent.getModifierState(keyArg);}var keyProp=modifierKeyToProp[keyArg];return keyProp?!!nativeEvent[keyProp]:false;}function getEventModifierState(nativeEvent){return modifierStateGetter;}module.exports = getEventModifierState;}, {}], 125:[function(_dereq_, module, exports){"use strict";function getEventTarget(nativeEvent){var target=nativeEvent.target || nativeEvent.srcElement || window;return target.nodeType === 3?target.parentNode:target;}module.exports = getEventTarget;}, {}], 126:[function(_dereq_, module, exports){"use strict";var ITERATOR_SYMBOL=typeof Symbol === "function" && Symbol.iterator;var FAUX_ITERATOR_SYMBOL="@@iterator";function getIteratorFn(maybeIterable){var iteratorFn=maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);if(typeof iteratorFn === "function"){return iteratorFn;}}module.exports = getIteratorFn;}, {}], 127:[function(_dereq_, module, exports){var ExecutionEnvironment=_dereq_(21);var invariant=_dereq_(135);var dummyNode=ExecutionEnvironment.canUseDOM?document.createElement("div"):null;var shouldWrap={"circle":true, "clipPath":true, "defs":true, "ellipse":true, "g":true, "line":true, "linearGradient":true, "path":true, "polygon":true, "polyline":true, "radialGradient":true, "rect":true, "stop":true, "text":true};var selectWrap=[1, "<select multiple=\"true\">", "</select>"];var tableWrap=[1, "<table>", "</table>"];var trWrap=[3, "<table><tbody><tr>", "</tr></tbody></table>"];var svgWrap=[1, "<svg>", "</svg>"];var markupWrap={"*":[1, "?<div>", "</div>"], "area":[1, "<map>", "</map>"], "col":[2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], "legend":[1, "<fieldset>", "</fieldset>"], "param":[1, "<object>", "</object>"], "tr":[2, "<table><tbody>", "</tbody></table>"], "optgroup":selectWrap, "option":selectWrap, "caption":tableWrap, "colgroup":tableWrap, "tbody":tableWrap, "tfoot":tableWrap, "thead":tableWrap, "td":trWrap, "th":trWrap, "circle":svgWrap, "clipPath":svgWrap, "defs":svgWrap, "ellipse":svgWrap, "g":svgWrap, "line":svgWrap, "linearGradient":svgWrap, "path":svgWrap, "polygon":svgWrap, "polyline":svgWrap, "radialGradient":svgWrap, "rect":svgWrap, "stop":svgWrap, "text":svgWrap};function getMarkupWrap(nodeName){"production" !== "development"?invariant(!!dummyNode, "Markup wrapping node not initialized"):invariant(!!dummyNode);if(!markupWrap.hasOwnProperty(nodeName)){nodeName = "*";}if(!shouldWrap.hasOwnProperty(nodeName)){if(nodeName === "*"){dummyNode.innerHTML = "<link />";}else {dummyNode.innerHTML = "<" + nodeName + "></" + nodeName + ">";}shouldWrap[nodeName] = !dummyNode.firstChild;}return shouldWrap[nodeName]?markupWrap[nodeName]:null;}module.exports = getMarkupWrap;}, {"135":135, "21":21}], 128:[function(_dereq_, module, exports){"use strict";function getLeafNode(node){while(node && node.firstChild) {node = node.firstChild;}return node;}function getSiblingNode(node){while(node) {if(node.nextSibling){return node.nextSibling;}node = node.parentNode;}}function getNodeForCharacterOffset(root, offset){var node=getLeafNode(root);var nodeStart=0;var nodeEnd=0;while(node) {if(node.nodeType === 3){nodeEnd = nodeStart + node.textContent.length;if(nodeStart <= offset && nodeEnd >= offset){return {node:node, offset:offset - nodeStart};}nodeStart = nodeEnd;}node = getLeafNode(getSiblingNode(node));}}module.exports = getNodeForCharacterOffset;}, {}], 129:[function(_dereq_, module, exports){"use strict";var DOC_NODE_TYPE=9;function getReactRootElementInContainer(container){if(!container){return null;}if(container.nodeType === DOC_NODE_TYPE){return container.documentElement;}else {return container.firstChild;}}module.exports = getReactRootElementInContainer;}, {}], 130:[function(_dereq_, module, exports){"use strict";var ExecutionEnvironment=_dereq_(21);var contentKey=null;function getTextContentAccessor(){if(!contentKey && ExecutionEnvironment.canUseDOM){contentKey = "textContent" in document.documentElement?"textContent":"innerText";}return contentKey;}module.exports = getTextContentAccessor;}, {"21":21}], 131:[function(_dereq_, module, exports){"use strict";function getUnboundedScrollPosition(scrollable){if(scrollable === window){return {x:window.pageXOffset || document.documentElement.scrollLeft, y:window.pageYOffset || document.documentElement.scrollTop};}return {x:scrollable.scrollLeft, y:scrollable.scrollTop};}module.exports = getUnboundedScrollPosition;}, {}], 132:[function(_dereq_, module, exports){var _uppercasePattern=/([A-Z])/g;function hyphenate(string){return string.replace(_uppercasePattern, "-$1").toLowerCase();}module.exports = hyphenate;}, {}], 133:[function(_dereq_, module, exports){"use strict";var hyphenate=_dereq_(132);var msPattern=/^ms-/;function hyphenateStyleName(string){return hyphenate(string).replace(msPattern, "-ms-");}module.exports = hyphenateStyleName;}, {"132":132}], 134:[function(_dereq_, module, exports){"use strict";var ReactCompositeComponent=_dereq_(37);var ReactEmptyComponent=_dereq_(59);var ReactNativeComponent=_dereq_(73);var assign=_dereq_(27);var invariant=_dereq_(135);var warning=_dereq_(154);var ReactCompositeComponentWrapper=function ReactCompositeComponentWrapper(){};assign(ReactCompositeComponentWrapper.prototype, ReactCompositeComponent.Mixin, {_instantiateReactComponent:instantiateReactComponent});function isInternalComponentType(type){return typeof type === "function" && typeof type.prototype !== "undefined" && typeof type.prototype.mountComponent === "function" && typeof type.prototype.receiveComponent === "function";}function instantiateReactComponent(node, parentCompositeType){var instance;if(node === null || node === false){node = ReactEmptyComponent.emptyElement;}if(typeof node === "object"){var element=node;if("production" !== "development"){"production" !== "development"?warning(element && (typeof element.type === "function" || typeof element.type === "string"), "Only functions or strings can be mounted as React components."):null;}if(parentCompositeType === element.type && typeof element.type === "string"){instance = ReactNativeComponent.createInternalComponent(element);}else if(isInternalComponentType(element.type)){instance = new element.type(element);}else {instance = new ReactCompositeComponentWrapper();}}else if(typeof node === "string" || typeof node === "number"){instance = ReactNativeComponent.createInstanceForText(node);}else {"production" !== "development"?invariant(false, "Encountered invalid React node of type %s", typeof node):invariant(false);}if("production" !== "development"){"production" !== "development"?warning(typeof instance.construct === "function" && typeof instance.mountComponent === "function" && typeof instance.receiveComponent === "function" && typeof instance.unmountComponent === "function", "Only React Components can be mounted."):null;}instance.construct(node);instance._mountIndex = 0;instance._mountImage = null;if("production" !== "development"){instance._isOwnerNecessary = false;instance._warnedAboutRefsInRender = false;}if("production" !== "development"){if(Object.preventExtensions){Object.preventExtensions(instance);}}return instance;}module.exports = instantiateReactComponent;}, {"135":135, "154":154, "27":27, "37":37, "59":59, "73":73}], 135:[function(_dereq_, module, exports){"use strict";var invariant=function invariant(condition, format, a, b, c, d, e, f){if("production" !== "development"){if(format === undefined){throw new Error("invariant requires an error message argument");}}if(!condition){var error;if(format === undefined){error = new Error("Minified exception occurred; use the non-minified dev environment " + "for the full error message and additional helpful warnings.");}else {var args=[a, b, c, d, e, f];var argIndex=0;error = new Error("Invariant Violation: " + format.replace(/%s/g, function(){return args[argIndex++];}));}error.framesToPop = 1;throw error;}};module.exports = invariant;}, {}], 136:[function(_dereq_, module, exports){"use strict";var ExecutionEnvironment=_dereq_(21);var useHasFeature;if(ExecutionEnvironment.canUseDOM){useHasFeature = document.implementation && document.implementation.hasFeature && document.implementation.hasFeature("", "") !== true;}function isEventSupported(eventNameSuffix, capture){if(!ExecutionEnvironment.canUseDOM || capture && !("addEventListener" in document)){return false;}var eventName="on" + eventNameSuffix;var isSupported=(eventName in document);if(!isSupported){var element=document.createElement("div");element.setAttribute(eventName, "return;");isSupported = typeof element[eventName] === "function";}if(!isSupported && useHasFeature && eventNameSuffix === "wheel"){isSupported = document.implementation.hasFeature("Events.wheel", "3.0");}return isSupported;}module.exports = isEventSupported;}, {"21":21}], 137:[function(_dereq_, module, exports){function isNode(object){return !!(object && (typeof Node === "function"?object instanceof Node:typeof object === "object" && typeof object.nodeType === "number" && typeof object.nodeName === "string"));}module.exports = isNode;}, {}], 138:[function(_dereq_, module, exports){"use strict";var supportedInputTypes={"color":true, "date":true, "datetime":true, "datetime-local":true, "email":true, "month":true, "number":true, "password":true, "range":true, "search":true, "tel":true, "text":true, "time":true, "url":true, "week":true};function isTextInputElement(elem){return elem && (elem.nodeName === "INPUT" && supportedInputTypes[elem.type] || elem.nodeName === "TEXTAREA");}module.exports = isTextInputElement;}, {}], 139:[function(_dereq_, module, exports){var isNode=_dereq_(137);function isTextNode(object){return isNode(object) && object.nodeType == 3;}module.exports = isTextNode;}, {"137":137}], 140:[function(_dereq_, module, exports){"use strict";var invariant=_dereq_(135);var keyMirror=function keyMirror(obj){var ret={};var key;"production" !== "development"?invariant(obj instanceof Object && !Array.isArray(obj), "keyMirror(...): Argument must be an object."):invariant(obj instanceof Object && !Array.isArray(obj));for(key in obj) {if(!obj.hasOwnProperty(key)){continue;}ret[key] = key;}return ret;};module.exports = keyMirror;}, {"135":135}], 141:[function(_dereq_, module, exports){var keyOf=function keyOf(oneKeyObj){var key;for(key in oneKeyObj) {if(!oneKeyObj.hasOwnProperty(key)){continue;}return key;}return null;};module.exports = keyOf;}, {}], 142:[function(_dereq_, module, exports){"use strict";var hasOwnProperty=Object.prototype.hasOwnProperty;function mapObject(object, callback, context){if(!object){return null;}var result={};for(var name in object) {if(hasOwnProperty.call(object, name)){result[name] = callback.call(context, object[name], name, object);}}return result;}module.exports = mapObject;}, {}], 143:[function(_dereq_, module, exports){"use strict";function memoizeStringOnly(callback){var cache={};return function(string){if(!cache.hasOwnProperty(string)){cache[string] = callback.call(this, string);}return cache[string];};}module.exports = memoizeStringOnly;}, {}], 144:[function(_dereq_, module, exports){"use strict";var ReactElement=_dereq_(57);var invariant=_dereq_(135);function onlyChild(children){"production" !== "development"?invariant(ReactElement.isValidElement(children), "onlyChild must be passed a children with exactly one child."):invariant(ReactElement.isValidElement(children));return children;}module.exports = onlyChild;}, {"135":135, "57":57}], 145:[function(_dereq_, module, exports){"use strict";var ExecutionEnvironment=_dereq_(21);var performance;if(ExecutionEnvironment.canUseDOM){performance = window.performance || window.msPerformance || window.webkitPerformance;}module.exports = performance || {};}, {"21":21}], 146:[function(_dereq_, module, exports){var performance=_dereq_(145);if(!performance || !performance.now){performance = Date;}var performanceNow=performance.now.bind(performance);module.exports = performanceNow;}, {"145":145}], 147:[function(_dereq_, module, exports){"use strict";var escapeTextContentForBrowser=_dereq_(116);function quoteAttributeValueForBrowser(value){return "\"" + escapeTextContentForBrowser(value) + "\"";}module.exports = quoteAttributeValueForBrowser;}, {"116":116}], 148:[function(_dereq_, module, exports){"use strict";var ExecutionEnvironment=_dereq_(21);var WHITESPACE_TEST=/^[ \r\n\t\f]/;var NONVISIBLE_TEST=/<(!--|link|noscript|meta|script|style)[ \r\n\t\f\/>]/;var setInnerHTML=function setInnerHTML(node, html){node.innerHTML = html;};if(typeof MSApp !== "undefined" && MSApp.execUnsafeLocalFunction){setInnerHTML = function(node, html){MSApp.execUnsafeLocalFunction(function(){node.innerHTML = html;});};}if(ExecutionEnvironment.canUseDOM){var testElement=document.createElement("div");testElement.innerHTML = " ";if(testElement.innerHTML === ""){setInnerHTML = function(node, html){if(node.parentNode){node.parentNode.replaceChild(node, node);}if(WHITESPACE_TEST.test(html) || html[0] === "<" && NONVISIBLE_TEST.test(html)){node.innerHTML = "﻿" + html;var textNode=node.firstChild;if(textNode.data.length === 1){node.removeChild(textNode);}else {textNode.deleteData(0, 1);}}else {node.innerHTML = html;}};}}module.exports = setInnerHTML;}, {"21":21}], 149:[function(_dereq_, module, exports){"use strict";var ExecutionEnvironment=_dereq_(21);var escapeTextContentForBrowser=_dereq_(116);var setInnerHTML=_dereq_(148);var setTextContent=function setTextContent(node, text){node.textContent = text;};if(ExecutionEnvironment.canUseDOM){if(!("textContent" in document.documentElement)){setTextContent = function(node, text){setInnerHTML(node, escapeTextContentForBrowser(text));};}}module.exports = setTextContent;}, {"116":116, "148":148, "21":21}], 150:[function(_dereq_, module, exports){"use strict";function shallowEqual(objA, objB){if(objA === objB){return true;}var key;for(key in objA) {if(objA.hasOwnProperty(key) && (!objB.hasOwnProperty(key) || objA[key] !== objB[key])){return false;}}for(key in objB) {if(objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)){return false;}}return true;}module.exports = shallowEqual;}, {}], 151:[function(_dereq_, module, exports){"use strict";var warning=_dereq_(154);function shouldUpdateReactComponent(prevElement, nextElement){if(prevElement != null && nextElement != null){var prevType=typeof prevElement;var nextType=typeof nextElement;if(prevType === "string" || prevType === "number"){return nextType === "string" || nextType === "number";}else {if(nextType === "object" && prevElement.type === nextElement.type && prevElement.key === nextElement.key){var ownersMatch=prevElement._owner === nextElement._owner;var prevName=null;var nextName=null;var nextDisplayName=null;if("production" !== "development"){if(!ownersMatch){if(prevElement._owner != null && prevElement._owner.getPublicInstance() != null && prevElement._owner.getPublicInstance().constructor != null){prevName = prevElement._owner.getPublicInstance().constructor.displayName;}if(nextElement._owner != null && nextElement._owner.getPublicInstance() != null && nextElement._owner.getPublicInstance().constructor != null){nextName = nextElement._owner.getPublicInstance().constructor.displayName;}if(nextElement.type != null && nextElement.type.displayName != null){nextDisplayName = nextElement.type.displayName;}if(nextElement.type != null && typeof nextElement.type === "string"){nextDisplayName = nextElement.type;}if(typeof nextElement.type !== "string" || nextElement.type === "input" || nextElement.type === "textarea"){if(prevElement._owner != null && prevElement._owner._isOwnerNecessary === false || nextElement._owner != null && nextElement._owner._isOwnerNecessary === false){if(prevElement._owner != null){prevElement._owner._isOwnerNecessary = true;}if(nextElement._owner != null){nextElement._owner._isOwnerNecessary = true;}"production" !== "development"?warning(false, "<%s /> is being rendered by both %s and %s using the same " + "key (%s) in the same place. Currently, this means that " + "they don't preserve state. This behavior should be very " + "rare so we're considering deprecating it. Please contact " + "the React team and explain your use case so that we can " + "take that into consideration.", nextDisplayName || "Unknown Component", prevName || "[Unknown]", nextName || "[Unknown]", prevElement.key):null;}}}}return ownersMatch;}}}return false;}module.exports = shouldUpdateReactComponent;}, {"154":154}], 152:[function(_dereq_, module, exports){var invariant=_dereq_(135);function toArray(obj){var length=obj.length;"production" !== "development"?invariant(!Array.isArray(obj) && (typeof obj === "object" || typeof obj === "function"), "toArray: Array-like object expected"):invariant(!Array.isArray(obj) && (typeof obj === "object" || typeof obj === "function"));"production" !== "development"?invariant(typeof length === "number", "toArray: Object needs a length property"):invariant(typeof length === "number");"production" !== "development"?invariant(length === 0 || length - 1 in obj, "toArray: Object should have keys for indices"):invariant(length === 0 || length - 1 in obj);if(obj.hasOwnProperty){try{return Array.prototype.slice.call(obj);}catch(e) {}}var ret=Array(length);for(var ii=0; ii < length; ii++) {ret[ii] = obj[ii];}return ret;}module.exports = toArray;}, {"135":135}], 153:[function(_dereq_, module, exports){"use strict";var ReactElement=_dereq_(57);var ReactFragment=_dereq_(63);var ReactInstanceHandles=_dereq_(66);var getIteratorFn=_dereq_(126);var invariant=_dereq_(135);var warning=_dereq_(154);var SEPARATOR=ReactInstanceHandles.SEPARATOR;var SUBSEPARATOR=":";var userProvidedKeyEscaperLookup={"=":"=0", ".":"=1", ":":"=2"};var userProvidedKeyEscapeRegex=/[=.:]/g;var didWarnAboutMaps=false;function userProvidedKeyEscaper(match){return userProvidedKeyEscaperLookup[match];}function getComponentKey(component, index){if(component && component.key != null){return wrapUserProvidedKey(component.key);}return index.toString(36);}function escapeUserProvidedKey(text){return ("" + text).replace(userProvidedKeyEscapeRegex, userProvidedKeyEscaper);}function wrapUserProvidedKey(key){return "$" + escapeUserProvidedKey(key);}function traverseAllChildrenImpl(children, nameSoFar, indexSoFar, callback, traverseContext){var type=typeof children;if(type === "undefined" || type === "boolean"){children = null;}if(children === null || type === "string" || type === "number" || ReactElement.isValidElement(children)){callback(traverseContext, children, nameSoFar === ""?SEPARATOR + getComponentKey(children, 0):nameSoFar, indexSoFar);return 1;}var child, nextName, nextIndex;var subtreeCount=0;if(Array.isArray(children)){for(var i=0; i < children.length; i++) {child = children[i];nextName = (nameSoFar !== ""?nameSoFar + SUBSEPARATOR:SEPARATOR) + getComponentKey(child, i);nextIndex = indexSoFar + subtreeCount;subtreeCount += traverseAllChildrenImpl(child, nextName, nextIndex, callback, traverseContext);}}else {var iteratorFn=getIteratorFn(children);if(iteratorFn){var iterator=iteratorFn.call(children);var step;if(iteratorFn !== children.entries){var ii=0;while(!(step = iterator.next()).done) {child = step.value;nextName = (nameSoFar !== ""?nameSoFar + SUBSEPARATOR:SEPARATOR) + getComponentKey(child, ii++);nextIndex = indexSoFar + subtreeCount;subtreeCount += traverseAllChildrenImpl(child, nextName, nextIndex, callback, traverseContext);}}else {if("production" !== "development"){"production" !== "development"?warning(didWarnAboutMaps, "Using Maps as children is not yet fully supported. It is an " + "experimental feature that might be removed. Convert it to a " + "sequence / iterable of keyed ReactElements instead."):null;didWarnAboutMaps = true;}while(!(step = iterator.next()).done) {var entry=step.value;if(entry){child = entry[1];nextName = (nameSoFar !== ""?nameSoFar + SUBSEPARATOR:SEPARATOR) + wrapUserProvidedKey(entry[0]) + SUBSEPARATOR + getComponentKey(child, 0);nextIndex = indexSoFar + subtreeCount;subtreeCount += traverseAllChildrenImpl(child, nextName, nextIndex, callback, traverseContext);}}}}else if(type === "object"){"production" !== "development"?invariant(children.nodeType !== 1, "traverseAllChildren(...): Encountered an invalid child; DOM " + "elements are not valid children of React components."):invariant(children.nodeType !== 1);var fragment=ReactFragment.extract(children);for(var key in fragment) {if(fragment.hasOwnProperty(key)){child = fragment[key];nextName = (nameSoFar !== ""?nameSoFar + SUBSEPARATOR:SEPARATOR) + wrapUserProvidedKey(key) + SUBSEPARATOR + getComponentKey(child, 0);nextIndex = indexSoFar + subtreeCount;subtreeCount += traverseAllChildrenImpl(child, nextName, nextIndex, callback, traverseContext);}}}}return subtreeCount;}function traverseAllChildren(children, callback, traverseContext){if(children == null){return 0;}return traverseAllChildrenImpl(children, "", 0, callback, traverseContext);}module.exports = traverseAllChildren;}, {"126":126, "135":135, "154":154, "57":57, "63":63, "66":66}], 154:[function(_dereq_, module, exports){"use strict";var emptyFunction=_dereq_(114);var warning=emptyFunction;if("production" !== "development"){warning = function(condition, format){for(var args=[], $__0=2, $__1=arguments.length; $__0 < $__1; $__0++) args.push(arguments[$__0]);if(format === undefined){throw new Error("`warning(condition, format, ...args)` requires a warning " + "message argument");}if(format.length < 10 || /^[s\W]*$/.test(format)){throw new Error("The warning format should be able to uniquely identify this " + "warning. Please, use a more descriptive format than: " + format);}if(format.indexOf("Failed Composite propType: ") === 0){return;}if(!condition){var argIndex=0;var message="Warning: " + format.replace(/%s/g, function(){return args[argIndex++];});console.warn(message);try{throw new Error(message);}catch(x) {}}};}module.exports = warning;}, {"114":114}]}, {}, [1])(1);});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],18:[function(require,module,exports){
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

},{"./chance":6}],19:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Secretary = (function () {
  function Secretary() {
    _classCallCheck(this, Secretary);
  }

  _createClass(Secretary, [{
    key: 'rankLower',
    value: function rankLower(rank) {
      var lowerRank = null;

      switch (rank.alias) {
        case 'lieutenant':
          return lowerRank;
        case 'captain':
          lowerRank = 'lieutenant';
          break;
        case 'major':
          lowerRank = 'captain';
          break;
        case 'lcoronel':
          lowerRank = 'major';
          break;
        case 'coronel':
          lowerRank = 'lcoronel';
          break;
        case 'bgeneral':
          lowerRank = 'coronel';
          break;
        case 'dgeneral':
          lowerRank = 'bgeneral';
          break;
        case 'lgeneral':
          lowerRank = 'dgeneral';
          break;
      }

      return lowerRank;
    }
  }]);

  return Secretary;
})();

exports['default'] = Secretary;
module.exports = exports['default'];

},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
/* jshint ignore:start */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _react = require("./react");

var _react2 = _interopRequireDefault(_react);

var Ui = (function () {
  function Ui(spec) {
    _classCallCheck(this, Ui);

    this.engine = spec;
  }

  _createClass(Ui, [{
    key: "render",
    value: function render(army) {
      _react2["default"].render(_react2["default"].createElement(Army, { officers: army.HQ.officers, army: army, engine: this.engine }), document.body);
    }
  }]);

  return Ui;
})();

var Army = (function (_React$Component) {
  function Army(props) {
    _classCallCheck(this, Army);

    _get(Object.getPrototypeOf(Army.prototype), "constructor", this).call(this, props);

    this.state = {
      officers: props.officers,
      army: props.army, engine: props.engine
    };
  }

  _inherits(Army, _React$Component);

  _createClass(Army, [{
    key: "pause",
    value: function pause() {
      this.state.engine.pause();
    }
  }, {
    key: "render",
    value: function render() {
      var army = this.props.army;
      var corps = [];

      army.units.corps.forEach(function (corp) {
        corps.push(_react2["default"].createElement(
          "div",
          { key: corp.id },
          _react2["default"].createElement(Unit, { unit: corp })
        ));
      });

      return _react2["default"].createElement(
        "div",
        null,
        _react2["default"].createElement(
          "div",
          { onClick: this.pause.bind(this) },
          "Pause"
        ),
        _react2["default"].createElement(
          "div",
          null,
          corps
        )
      );
    }
  }]);

  return Army;
})(_react2["default"].Component);

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
          history.push(_react2["default"].createElement(
            "p",
            null,
            log
          ));
        });
      }

      return _react2["default"].createElement(
        "div",
        { onMouseOver: this.mouseOver.bind(this),
          onMouseOut: this.mouseOut.bind(this) },
        _react2["default"].createElement(
          "p",
          null,
          this.props.officer.name(),
          " ",
          this.props.officer.alignment
        ),
        _react2["default"].createElement(
          "div",
          { className: "history" },
          history
        )
      );
    }
  }]);

  return Commander;
})(_react2["default"].Component);

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
          subunits.push(_react2["default"].createElement(
            "div",
            { key: subunit.id },
            _react2["default"].createElement(Unit, { unit: subunit })
          ));
        });
      }

      return _react2["default"].createElement(
        "div",
        { className: unit.type },
        _react2["default"].createElement(Commander, { officer: unit.commander }),
        subunits
      );
    }
  }]);

  return Unit;
})(_react2["default"].Component);

exports["default"] = Ui;
module.exports = exports["default"];

},{"./react":17}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
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

    this.regions = [];
    this.generate(HQ);
  }

  _createClass(World, [{
    key: 'addRegion',
    value: function addRegion() {
      var regionId = this.regions.length;
      this.regions.push(new _region2['default'](regionId));
    }
  }, {
    key: 'generate',
    value: function generate(HQ) {
      var amount = _config2['default'].random(10) + 5;
      for (var i = 0; i < amount; i++) {
        this.addRegion();
      }
      this.mapUnitsAndRegions(HQ);
    }
  }, {
    key: 'mapUnitsAndRegions',
    value: function mapUnitsAndRegions(HQ) {
      var unitsPerRegion = Math.ceil(HQ.units.length / this.regions.length) + 1;
      var unitIndex = 0;

      this.regions.map(function (region) {
        var count = 0;

        while (count < unitsPerRegion) {
          var unit = HQ.units[unitIndex];

          if (unit) {
            region.units.push(unit);
            unit.regionId = region.id;
            unitIndex++;
            count++;
          } else {
            return;
          }
        }
      });
    }
  }]);

  return World;
})();

exports['default'] = World;
module.exports = exports['default'];

},{"./config":8,"./region":18}]},{},[11]);
