/**
 * Ashima's 3D simplex noise plus a small fractal sum on top. This is the whole
 * terrain: no mesh, no texture, no asset, just a seed and a handful of octaves.
 */
export const NOISE_GLSL = /* glsl */ `
/** A cutoff no octave can reach, for the stages that want every one of them. */
#define NO_LIMIT 1.0e9

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

/**
 * Fractal sum, band limited to what the screen can actually show.
 *
 * The cutoff is the frequency at which one cycle of the noise has shrunk to the
 * width of a pixel. Past that point an octave carries no shape any more, only
 * the crawl of a pattern sampled below its own rate, and it costs exactly as
 * much as the octaves that can be seen. Callers who want every octave whatever
 * the distance pass NO_LIMIT.
 *
 * The last octave kept is faded rather than cut, so walking towards her adds
 * detail continuously instead of popping it in.
 */
float fbmBand(vec3 p, int octaves, float lacunarity, float gain, float cutoff) {
  float sum = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    // The first octave is never dropped: it carries the shape of the field,
    // and a field faded down to its own average is a flat wash where there
    // used to be a pattern.
    float fade = i == 0 ? 1.0 : 1.0 - smoothstep(cutoff * 0.5, cutoff, frequency);
    if (fade <= 0.0) break;
    sum += snoise(p * frequency) * amplitude * fade;
    frequency *= lacunarity;
    amplitude *= gain;
  }
  return sum;
}

/** Ridged variant, used for mountain chains when roughness is high. */
float ridgedBand(vec3 p, int octaves, float cutoff) {
  float sum = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    // The first octave is never dropped: it carries the shape of the field,
    // and a field faded down to its own average is a flat wash where there
    // used to be a pattern.
    float fade = i == 0 ? 1.0 : 1.0 - smoothstep(cutoff * 0.5, cutoff, frequency);
    if (fade <= 0.0) break;
    sum += (1.0 - abs(snoise(p * frequency))) * amplitude * fade;
    frequency *= 2.1;
    amplitude *= 0.5;
  }
  return sum - 0.5;
}

float fbm(vec3 p, int octaves, float lacunarity, float gain) {
  return fbmBand(p, octaves, lacunarity, gain, NO_LIMIT);
}

float ridged(vec3 p, int octaves) {
  return ridgedBand(p, octaves, NO_LIMIT);
}
`
