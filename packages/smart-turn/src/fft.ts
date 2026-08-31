/**
 * Complex FFT of any size.
 *
 * Whisper frames are 400 points, which is not a power of two, so a plain radix
 * 2 transform cannot be used directly. Bluestein turns such a transform into a
 * convolution that a power of two transform can carry.
 */
export class FFT {
  private readonly isPowerOfTwo: boolean

  // Radix 2 tables
  private levels = 0
  private cos = new Float64Array(0)
  private sin = new Float64Array(0)
  private reversed = new Uint32Array(0)

  // Bluestein tables
  private inner?: FFT
  private convolutionSize = 0
  private chirpRe = new Float64Array(0)
  private chirpIm = new Float64Array(0)
  private kernelRe = new Float64Array(0)
  private kernelIm = new Float64Array(0)
  private workRe = new Float64Array(0)
  private workIm = new Float64Array(0)

  constructor(public readonly size: number) {
    this.isPowerOfTwo = (size & (size - 1)) === 0
    if (this.isPowerOfTwo) {
      this.prepareRadix2()
    } else {
      this.prepareBluestein()
    }
  }

  private prepareRadix2() {
    const n = this.size
    this.levels = Math.log2(n)
    this.cos = new Float64Array(n / 2)
    this.sin = new Float64Array(n / 2)
    for (let i = 0; i < n / 2; i++) {
      this.cos[i] = Math.cos((2 * Math.PI * i) / n)
      this.sin[i] = Math.sin((2 * Math.PI * i) / n)
    }
    this.reversed = new Uint32Array(n)
    for (let i = 0; i < n; i++) {
      let value = i
      let bits = 0
      for (let level = 0; level < this.levels; level++) {
        bits = (bits << 1) | (value & 1)
        value >>= 1
      }
      this.reversed[i] = bits
    }
  }

  private prepareBluestein() {
    const n = this.size
    let m = 1
    while (m < 2 * n - 1) m *= 2
    this.convolutionSize = m
    this.inner = new FFT(m)

    this.chirpRe = new Float64Array(n)
    this.chirpIm = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      // The exponent is reduced modulo 2n so it stays precise for large i
      const angle = (-Math.PI * ((i * i) % (2 * n))) / n
      this.chirpRe[i] = Math.cos(angle)
      this.chirpIm[i] = Math.sin(angle)
    }

    const kernelRe = new Float64Array(m)
    const kernelIm = new Float64Array(m)
    kernelRe[0] = this.chirpRe[0]
    kernelIm[0] = -this.chirpIm[0]
    for (let i = 1; i < n; i++) {
      kernelRe[i] = kernelRe[m - i] = this.chirpRe[i]
      kernelIm[i] = kernelIm[m - i] = -this.chirpIm[i]
    }
    this.inner.transform(kernelRe, kernelIm)
    this.kernelRe = kernelRe
    this.kernelIm = kernelIm
    this.workRe = new Float64Array(m)
    this.workIm = new Float64Array(m)
  }

  /**
   * Transforms in place
   * @param re - Real parts, `size` of them
   * @param im - Imaginary parts, `size` of them
   * @param inverse - Run the inverse transform, without the 1/size scaling
   */
  transform(re: Float64Array, im: Float64Array, inverse = false) {
    if (this.isPowerOfTwo) {
      this.transformRadix2(re, im, inverse)
    } else {
      this.transformBluestein(re, im)
    }
  }

  private transformRadix2(re: Float64Array, im: Float64Array, inverse: boolean) {
    const n = this.size
    const { reversed, cos, sin } = this

    for (let i = 0; i < n; i++) {
      const j = reversed[i]
      if (j > i) {
        let swap = re[i]
        re[i] = re[j]
        re[j] = swap
        swap = im[i]
        im[i] = im[j]
        im[j] = swap
      }
    }

    const direction = inverse ? 1 : -1
    for (let width = 2; width <= n; width *= 2) {
      const half = width / 2
      const step = n / width
      for (let start = 0; start < n; start += width) {
        for (let i = start, k = 0; i < start + half; i++, k += step) {
          const c = cos[k]
          const s = direction * sin[k]
          const partner = i + half
          const productRe = re[partner] * c - im[partner] * s
          const productIm = re[partner] * s + im[partner] * c
          re[partner] = re[i] - productRe
          im[partner] = im[i] - productIm
          re[i] += productRe
          im[i] += productIm
        }
      }
    }
  }

  private transformBluestein(re: Float64Array, im: Float64Array) {
    const n = this.size
    const m = this.convolutionSize
    const { workRe, workIm, kernelRe, kernelIm, chirpRe, chirpIm } = this

    workRe.fill(0)
    workIm.fill(0)
    for (let i = 0; i < n; i++) {
      workRe[i] = re[i] * chirpRe[i] - im[i] * chirpIm[i]
      workIm[i] = re[i] * chirpIm[i] + im[i] * chirpRe[i]
    }

    this.inner!.transform(workRe, workIm)
    for (let i = 0; i < m; i++) {
      const productRe = workRe[i] * kernelRe[i] - workIm[i] * kernelIm[i]
      const productIm = workRe[i] * kernelIm[i] + workIm[i] * kernelRe[i]
      workRe[i] = productRe
      workIm[i] = productIm
    }
    this.inner!.transform(workRe, workIm, true)

    for (let i = 0; i < n; i++) {
      const valueRe = workRe[i] / m
      const valueIm = workIm[i] / m
      re[i] = valueRe * chirpRe[i] - valueIm * chirpIm[i]
      im[i] = valueRe * chirpIm[i] + valueIm * chirpRe[i]
    }
  }
}
