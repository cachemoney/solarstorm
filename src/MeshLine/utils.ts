export function memcpy(
  src: any,
  srcOffset: number,
  dst: any,
  dstOffset: number,
  length: number
): any {
  let i: number

  const srcBuf = src.subarray || src.slice ? src : src.buffer
  let dstBuf = dst.subarray || dst.slice ? dst : dst.buffer

  const srcPart = srcOffset
    ? srcBuf.subarray
      ? srcBuf.subarray(srcOffset, length && srcOffset + length)
      : srcBuf.slice(srcOffset, length && srcOffset + length)
    : srcBuf

  if (dstBuf.set) {
    dstBuf.set(srcPart, dstOffset)
  } else {
    for (i = 0; i < srcPart.length; i++) {
      dstBuf[i + dstOffset] = srcPart[i]
    }
  }

  return dstBuf
}
