import {
  AdditiveBlending,
  BackSide,
  Color,
  ShaderMaterial,
  Vector3,
} from 'three'
import { NOISE_GLSL } from './noise'
import { MAX_ELEV, TERRAIN_AMPLITUDE } from '../scale'

/**
 * The height field, defined once and included in both the vertex and the
 * fragment stage. The silhouette and the shading have to agree on where the
 * mountains are, and the only way to guarantee that is to write it down once.
 */
const TERRAIN_GLSL = /* glsl */ `
float terrainElev(vec3 dir, float seed, float roughness) {
  vec3 seeded = dir * 1.8 + vec3(seed * 7.3);
  // Six octaves and five ridges. The next ones carry features finer than a
  // pixel at any distance the camera reaches, so they add grain rather than
  // relief and cost as much as the octaves that can be seen.
  float base = fbm(seeded, 6, 2.0, 0.5) * 0.6;

  // Ground with no relief has no chains to raise, and the ridges are five of
  // the eleven octaves: a smooth world skips nearly half the field, in the
  // vertex stage and the shading alike, on a test both of them agree on.
  if (roughness < 0.004) return base;

  float chains = ridged(seeded * 1.45, 5) * roughness * 0.75;
  return base + chains;
}

float seaLevel(float water) {
  return mix(-0.35, 0.5, water);
}

/**
 * The radius an elevation maps to. Split out from the sampling so that anyone
 * already holding a height uses it instead of paying for the noise twice, which
 * is most of the vertex stage and a third of the shading.
 */
float radiusOf(float elev, float roughness, float water) {
  // Oceans are flat, which is what makes a coastline readable, and the peak is
  // clamped so no summit can exceed the radius the sky is placed at.
  float displaced = min(max(elev, seaLevel(water)), ${MAX_ELEV});
  return 1.0 + displaced * ${TERRAIN_AMPLITUDE} * (0.45 + roughness);
}
`

/**
 * The surface. Terrain, oceans, forests, herds of light, lava, city lights and
 * the night side all come out of one noise field, so a whole inhabited planet
 * is still a seed and about a dozen numbers.
 */
export function createPlanetMaterial() {
  return new ShaderMaterial({
    defines: { HAS_FOREST: false },
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: 1 },
      uWater: { value: 0 },
      uHeat: { value: 0.8 },
      uRoughness: { value: 0.5 },
      uVegetation: { value: 0 },
      uLife: { value: 0 },
      uCities: { value: 0 },
      /** How fast the green is currently gaining ground, 0 to 1. */
      uGrowth: { value: 0 },
      uFlash: { value: 0 },
      // Star and eye expressed in her own frame, which is the frame the noise
      // lives in. Everything is then one space and nothing has to be converted
      // per fragment.
      uSunLocal: { value: new Vector3(1, 0.3, 0.5).normalize() },
      uEyeLocal: { value: new Vector3(0, 0, 4) },
      uDeep: { value: new Color('#3a0d05') },
      uShallow: { value: new Color('#7a1e08') },
      uLow: { value: new Color('#993217') },
      uHigh: { value: new Color('#c25a1e') },
      uPeak: { value: new Color('#f0a04b') },
    },
    vertexShader: /* glsl */ `
      ${NOISE_GLSL}
      ${TERRAIN_GLSL}

      uniform float uSeed;
      uniform float uWater;
      uniform float uRoughness;

      varying vec3 vUnit;

      void main() {
        vUnit = normalize(position);
        // One sample, used for the displacement and nothing else. The shading
        // measures its own height from the same field, at full resolution
        // instead of interpolated across a triangle.
        float elev = terrainElev(vUnit, uSeed, uRoughness);
        vec3 shaped = vUnit * radiusOf(elev, uRoughness, uWater);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(shaped, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${NOISE_GLSL}
      ${TERRAIN_GLSL}

      uniform float uTime;
      uniform float uSeed;
      uniform float uWater;
      uniform float uHeat;
      uniform float uRoughness;
      uniform float uVegetation;
      uniform float uLife;
      uniform float uCities;
      uniform float uGrowth;
      uniform float uFlash;
      uniform vec3 uSunLocal;
      uniform vec3 uEyeLocal;
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uLow;
      uniform vec3 uHigh;
      uniform vec3 uPeak;

      varying vec3 vUnit;

      void main() {
        float sea = seaLevel(uWater);
        vec3 dir = normalize(vUnit);
        vec3 color;

        // How much of her one pixel covers, turned into the highest octave that
        // pixel can still hold. Every field below is sampled along this same
        // direction at some multiple of it, so dividing by that multiple says
        // where its own detail stops being detail and starts being crawl.
        float band = 0.5 / max(length(fwidth(dir)), 1e-6);

        // Sampled here rather than carried from the vertex stage. The normal
        // needs the field at this exact direction anyway, so taking the height
        // with it costs nothing and buys a coastline that stays sharp however
        // coarse the mesh under it gets.
        float elev = terrainElev(dir, uSeed, uRoughness);
        bool ocean = elev < sea;

        // The point of her ground this pixel looks at, and the slope it lies
        // on. The relief is a height field sampled once per pixel, so the rate
        // it changes from one pixel to the next is something the hardware
        // already holds; asking the field again on either side to learn the
        // same thing cost twenty two evaluations of the noise per pixel, more
        // than everything else in the frame put together. It also measured the
        // relief at a fixed step instead of the step the screen can show, which
        // was too blunt up close and finer than a pixel far away, where it
        // turned the mountains into a shimmer.
        //
        // Read before anything branches: a rate of change is worked out by
        // comparing the pixels of a quad, and a value some of them skipped is a
        // value there is nothing to compare.
        // Read in a scope of its own, and reduced on the spot to the single
        // number the shading asks of it. A direction kept alive to the end of
        // the shader is three more registers held across every fractal sum
        // below, and how many registers a fragment shader needs decides how
        // many of them the card can run at once.
        float slopeLight = 0.0;
        {
          vec3 point = dir * radiusOf(elev, uRoughness, uWater);
          vec3 slope = normalize(cross(dFdx(point), dFdy(point)));
          if (dot(slope, dir) < 0.0) slope = -slope;
          slopeLight = max(dot(slope, uSunLocal), 0.0);
        }

        // Kept out of the branches below, because the night side needs it for
        // the lights and the plankton alike.
        float dayness = smoothstep(-0.2, 0.3, dot(dir, uSunLocal));
        float night = 1.0 - dayness;
        float canopyLift = 0.0;

        if (ocean) {
          color = mix(uDeep, uShallow, smoothstep(sea - 0.45, sea, elev));

          // Life colours the shallows before it ever reaches the land: the
          // water over the shelves turns green where anything is living in it.
          float shelf = smoothstep(sea - 0.22, sea, elev);
          color = mix(color, vec3(0.06, 0.55, 0.44), uLife * shelf * 0.7);
        } else {
          color = mix(uLow, uHigh, smoothstep(sea, sea + 0.45, elev));
          color = mix(color, uPeak, smoothstep(sea + 0.32, sea + 0.6, elev));

          // Bare rock has no forest to draw, and a world that has never grown
          // one does not even carry the code for it. See setForest below: on a
          // sterile planet these lines are not skipped, they are absent, and
          // that is worth two and a half milliseconds a frame.
          #ifdef HAS_FOREST
          // Green covers the land it can reach, stopping just short of the
          // shore and again below the summits.
          float belt = smoothstep(sea + 0.002, sea + 0.04, elev) *
                       (1.0 - smoothstep(sea + 0.46, sea + 0.66, elev));

          if (uVegetation > 0.002 && belt > 0.0) {
            // Born here, where it is used, rather than at the top: it was
            // living across the eleven octaves of the terrain for nothing.
            vec3 seeded = dir * 4.0 + vec3(uSeed * 7.3);
            float patches = fbmBand(seeded, 5, 2.0, 0.5, band / 4.0) * 0.5 + 0.5;

            // Coverage is a threshold on the noise rather than an opacity, so
            // half a world of forest is half the land properly dark green and
            // never the whole of it washed pale.
            float line = 1.0 - uVegetation * 1.5;
            float cover = smoothstep(line, line + 0.09, patches);

            // Bare ground between two forests is most of the land at any
            // coverage below the whole of it, and there is no canopy there to
            // give a grain to.
            if (cover > 0.0) {
              float clumps =
                fbmBand(seeded * 2.7 + vec3(11.3), 3, 2.2, 0.55, band / 10.8) * 0.5 + 0.5;

              vec3 canopy = mix(vec3(0.04, 0.20, 0.06), vec3(0.24, 0.58, 0.13), clumps);
              canopy = mix(canopy, vec3(0.52, 0.71, 0.16), smoothstep(0.74, 1.0, clumps) * 0.7);
              color = mix(color, canopy, clamp(cover * belt, 0.0, 0.97));

              // A canopy is not a coat of paint: it catches the light on its
              // own relief, which is what stops a forest reading as a flat
              // stain.
              canopyLift = cover * belt * (clumps - 0.5) * 0.5;
            }

            // And while it is still gaining ground, the edge of it glows. This
            // is the whole reason a wish granted too generously is worth
            // watching: the green visibly runs across her.
            if (uGrowth > 0.002) {
              float edge = (patches - line) * 22.0;
              float front = exp(-edge * edge) * uGrowth;
              color += front * belt * vec3(0.35, 1.0, 0.45) * 0.85;
            }
          }
          #endif
        }

        // Overheating opens cracks that glow, and they crawl slowly.
        float lava = smoothstep(0.68, 1.0, uHeat);
        float glow = 0.0;
        if (lava > 0.0) {
          float cracks = smoothstep(
            0.32, 0.62,
            fbmBand(dir * 3.0 + vec3(uTime * 0.015), 4, 2.0, 0.5, band / 3.0)
          );
          glow = lava * cracks;
          color = mix(color, vec3(1.0, 0.4, 0.08), glow * 0.85);
        }

        // Cold is a state of the world, not an event: ice grows down from the
        // poles as she loses her warmth, and covers her entirely at zero.
        // Warm and frozen are the two ends of one number, so a frame pays for
        // at most one of these two fields and usually for neither.
        float freeze = smoothstep(0.34, 0.02, uHeat);
        float ice = 0.0;
        if (freeze > 0.0) {
          float iceLine = 1.05 - freeze * 1.2;
          float ragged =
            abs(dir.y) + fbmBand(dir * 5.0 + vec3(uSeed), 3, 2.0, 0.5, band / 5.0) * 0.07;
          ice = smoothstep(iceLine - 0.1, iceLine + 0.1, ragged);
          color = mix(color, vec3(0.88, 0.94, 1.0), ice);
        }

        // Water stays smooth so it can catch the star, rock takes the relief.
        // Past this point only the sea still needs a direction, and the sea's
        // is her own.
        vec3 normal = dir;
        float diffuse = ocean ? max(dot(dir, uSunLocal), 0.0) : slopeLight;

        color *= 0.1 + 1.15 * mix(diffuse, dayness, 0.4) + canopyLift * dayness;

        // The glint that turns a dark patch into a sea.
        if (ocean) {
          // Rebuilt rather than carried down from the slope above: it costs an
          // add and a multiply here, and three registers everywhere else.
          vec3 point = dir * radiusOf(elev, uRoughness, uWater);
          vec3 eye = normalize(uEyeLocal - point);

          // Fresnel, not albedo: water reflects about two percent of the light
          // that meets it head on, and only becomes a mirror at grazing angles.
          // Reflecting a flat hundred percent everywhere put a white blister in
          // the middle of every ocean.
          float facing = max(dot(normal, eye), 0.0);
          float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);

          float spec = pow(max(dot(normal, normalize(uSunLocal + eye)), 0.0), 90.0);
          color += spec * fresnel * 3.0 * vec3(1.0, 0.96, 0.88) * dayness * (1.0 - ice);
        }

        // What they built. Warm clusters on the low ground near the water, and
        // only on her night side, because a light is only a light in the dark.
        if (uCities > 0.004 && !ocean && night > 0.05) {
          // Two scales, and the finer one matters most: without it a city is a
          // continuous crust of yellow, which reads as sand rather than as
          // somebody's evening.
          float lowland = 1.0 - smoothstep(sea + 0.02, sea + 0.24, elev);
          float grid =
            fbmBand(dir * 34.0 + vec3(uSeed * 3.7), 3, 2.4, 0.55, band / 34.0) * 0.5 + 0.5;
          float towns = smoothstep(0.70 - uCities * 0.22, 0.75 - uCities * 0.22, grid);

          // Most of the dark side is empty country, and the fine scale exists
          // only to break a town into windows.
          if (towns > 0.0) {
            float speck = smoothstep(
              0.40, 0.85,
              fbmBand(dir * 92.0 + vec3(uSeed * 5.1), 2, 2.3, 0.5, band / 92.0) * 0.5 + 0.5
            );
            float twinkle = 0.65 + 0.35 * sin(uTime * 1.7 + grid * 70.0);
            color += towns * speck * lowland * pow(night, 1.6)
                   * (0.35 + uCities) * twinkle * vec3(1.0, 0.74, 0.38) * 2.2;
          }
        }

        // And what they burn, which only shows in daylight.
        if (uCities > 0.05) {
          color = mix(color, vec3(0.74, 0.67, 0.44), uCities * uCities * 0.14 * dayness);
        }

        color += glow * night * vec3(1.0, 0.3, 0.05) * 0.9;

        // What lives on her glows faintly in the dark, and it breathes.
        float pulse = 0.6 + 0.4 * sin(uTime * 0.8 + elev * 18.0);
        color += uLife * 0.2 * night * pulse * vec3(0.28, 0.95, 0.6);

        color += uFlash * vec3(1.0, 0.85, 0.7) * dayness;

        gl_FragColor = vec4(color, 1.0);
            #include <colorspace_fragment>
      }
    `,
  })
}

/**
 * Compile the forest in, or leave it out.
 *
 * A branch nobody takes is still a branch the compiler has to allocate
 * registers for, and the fewer registers a fragment shader can be given the
 * fewer of them the card runs at once, so her whole surface ends up waiting on
 * memory. This one branch holds two fractal sums and a handful of colours
 * across them, and simply not compiling it on a world with nothing growing on
 * it takes two and a half milliseconds off every frame, which is more than
 * every other layer of the scene put together.
 *
 * Recompiling costs a hitch, so this is only worth doing for something that
 * turns on once and stays on. Vegetation is exactly that: it arrives when life
 * takes, and it leaves slowly if it ever leaves at all.
 */
export function setForest(material: ShaderMaterial, present: boolean) {
  if (Boolean(material.defines?.HAS_FOREST) === present) return
  material.defines = { ...material.defines, HAS_FOREST: present }
  material.needsUpdate = true
}

/**
 * The air. A shell rendered from the inside, brightest at the rim, which is the
 * cheapest convincing atmosphere there is.
 */
export function createAtmosphereMaterial() {
  return new ShaderMaterial({
    transparent: true,
    side: BackSide,
    blending: AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uDensity: { value: 0.1 },
      uColor: { value: new Color('#ff7a3d') },
      uSunDir: { value: new Vector3(1, 0.3, 0.5).normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldNormal;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;
      void main() {
        vec3 unit = normalize(position);
        vWorldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * unit);
        vViewNormal = normalize(normalMatrix * unit);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uDensity;
      uniform vec3 uColor;
      uniform vec3 uSunDir;

      varying vec3 vWorldNormal;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        // Both vectors in view space, so the glow hugs the limb instead of
        // washing over her surface.
        float f = 1.0 - abs(dot(vViewNormal, vViewDir));

        // Two falloffs rather than one. The tight term is the bright line on
        // the limb; the wide one fills the sky between her ground and that
        // line, which would otherwise be a band of plain black and made the
        // shell read as a bubble she was sitting inside.
        float rim = pow(f, 4.5);
        float body = pow(f, 1.7) * 0.32;
        float lit = smoothstep(-0.45, 0.5, dot(vWorldNormal, uSunDir));

        // Air is thin. Half of what looks right in isolation is what looks
        // right against her surface, where the halo has to be read as a glow
        // around a body rather than as a shell the body is sitting inside.
        float alpha = (rim + body) * 0.5 * uDensity * (0.25 + 0.95 * lit);

        gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
            #include <colorspace_fragment>
      }
    `,
  })
}

/** Weather, one shell above the ground, turning at its own speed. */
export function createCloudMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: 1 },
      uCover: { value: 0 },
      uBreath: { value: 0 },
      // Integrated on the CPU, never recomputed as time times speed: see the
      // note in the fragment shader.
      uWindPhase: { value: 0 },
      uSunDir: { value: new Vector3(1, 0.3, 0.5).normalize() },
      uTint: { value: new Color('#ffffff') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vUnit;
      varying vec3 vWorldNormal;
      void main() {
        vUnit = normalize(position);
        vWorldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * vUnit);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${NOISE_GLSL}

      uniform float uTime;
      uniform float uSeed;
      uniform float uCover;
      uniform float uBreath;
      uniform float uWindPhase;
      uniform vec3 uSunDir;
      uniform vec3 uTint;

      varying vec3 vUnit;
      varying vec3 vWorldNormal;

      /** Turned about the poles, which is the only direction weather runs. */
      vec3 spin(vec3 dir, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return vec3(dir.x * c - dir.z * s, dir.y, dir.x * s + dir.z * c);
      }

      void main() {
        // A sky with neither weather nor wind still covers her whole disc in
        // triangles, and nine octaves of noise were being paid for on every one
        // of them to arrive at nothing. Every test here is on a uniform, so the
        // sky costs what it shows and a bare world costs nothing at all.
        if (uCover < 0.004 && uBreath < 0.004) discard;

        float band = 0.5 / max(length(fwidth(vUnit)), 1e-6);

        // Cover drives the threshold rather than the opacity, so half cover
        // means half the sphere has weather, not a grey veil over all of it.
        // At no cover the threshold answers nothing whatever the field says,
        // which is five of the nine octaves nobody has to sample.
        float density = 0.0;
        if (uCover > 0.004) {
          vec3 p = vUnit * 2.6 + vec3(uSeed * 3.1);
          // Five octaves, and fewer the further away she is. The ones that used
          // to follow ran at a few hundred cycles around the globe, which is
          // finer than the screen can hold, so they only shimmered.
          float bands =
            fbmBand(p + vec3(uTime * 0.008, 0.0, 0.0), 5, 2.1, 0.55, band / 2.6);
          float shape = clamp(bands * 0.5 + 0.5, 0.0, 1.0);
          density = smoothstep(1.0 - uCover, 1.0 - uCover * 0.55, shape);
        }

        float lit = smoothstep(-0.3, 0.45, dot(vWorldNormal, uSunDir));

        // Wind. Air is invisible, so it has to be drawn: the same field
        // squashed hard in latitude becomes filaments running along the
        // parallels, and they run faster the thicker the atmosphere gets.
        //
        // The phase arrives already integrated. Writing it as time times speed
        // would make every change of speed rewrite the whole history at once,
        // and the filaments would lurch forward before settling instead of
        // simply speeding up.
        float wind = 0.0;
        if (uBreath > 0.004) {
          vec3 blown = spin(vUnit, uWindPhase);
          vec3 stretched = vec3(blown.x, blown.y * 5.5, blown.z) * 3.4 + vec3(uSeed);
          // Squashed hardest in latitude, so that is the direction whose detail
          // runs out of pixels first and the one the limit is read from.
          float filaments = fbmBand(stretched, 4, 2.2, 0.5, band / 18.7);
          wind = smoothstep(0.18, 0.48, filaments) * uBreath;
        }

        float alpha = density * (0.35 + 0.65 * uCover) * 0.9 + wind * 0.22;
        // A clear sky still covers her whole disc in triangles, so the pixels
        // that carry nothing say so before the blend.
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(uTint * (0.3 + 0.7 * lit), alpha * (0.25 + 0.75 * lit));
            #include <colorspace_fragment>
      }
    `,
  })
}
