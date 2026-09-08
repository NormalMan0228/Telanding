export const STRIDE_RATE = 4.1;

/** The planted half of a step counters body travel; the return half clears the floor. */
export function footPose(phase, amplitude) {
  const cycle = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (cycle < Math.PI)
    return { forward: amplitude * (1 - (2 * cycle) / Math.PI), lift: 0 };
  const t = (cycle - Math.PI) / Math.PI;
  return {
    forward: amplitude * (-1 + 2 * t * t * (3 - 2 * t)),
    lift: Math.sin(t * Math.PI) * 4.2,
  };
}

/** Eight camera-relative orientations, shared by input, rendering and tests. */
export function facingFor(heading, cameraAngle = 0) {
  const octant =
    ((Math.round((heading + cameraAngle) / (Math.PI / 4)) % 8) + 8) % 8;
  return [
    "right",
    "front-right",
    "front",
    "front-left",
    "left",
    "back-left",
    "back",
    "back-right",
  ][octant];
}
export function advanceLocomotion(player, oldX, oldZ, dt = 1 / 60) {
  const dx = player.x - oldX,
    dz = player.z - oldZ,
    distance = Math.hypot(dx, dz);
  const walking = distance >= 0.00001;
  player.motion =
    (player.motion ?? 0) +
    ((walking ? 1 : 0) - (player.motion ?? 0)) *
      (1 - Math.exp(-Math.max(0, dt) * 16));
  if (distance < 0.00001) return false;
  player.heading = Math.atan2(dz, dx);
  player.gait = ((player.gait || 0) + distance * STRIDE_RATE) % (Math.PI * 2);
  return true;
}

/** A palm-sized diagnostic companion. Every view uses the same 3D joint geometry. */
export function drawCharacter(
  ctx,
  p,
  player,
  cameraAngle,
  moving,
  quiet,
  time = 0,
) {
  const angle =
    (Math.round(((player.heading ?? 0) + cameraAngle) / (Math.PI / 4)) *
      Math.PI) /
    4;
  const sin = Math.sin(angle),
    cos = Math.cos(angle);
  const motion = quiet ? 0 : (player.motion ?? (moving ? 1 : 0));
  const reach = quiet ? 0 : Math.sin(Math.PI * (player.reach ?? 0));
  const bob = Math.abs(Math.sin(player.gait || 0)) * 0.7 * motion;
  const size = p.scale * 1.12;
  const amplitude = (Math.PI * (p.unit ?? 40)) / (2 * STRIDE_RATE * size);
  const step = (sign) => {
    const pose = footPose(
      (player.gait || 0) + (sign < 0 ? Math.PI : 0),
      amplitude,
    );
    return { forward: pose.forward * motion, lift: pose.lift * motion };
  };
  ctx.save();
  ctx.translate(Math.round(p.x), Math.round(p.y));
  ctx.scale(size, size);
  ctx.imageSmoothingEnabled = false;
  const project = (x, y, z) => ({
    x: Math.round(x * sin + z * cos),
    y: Math.round(-y + (-x * cos + z * sin) * (p.depthScale ?? 0.55)),
    depth: -x * cos + z * sin,
  });
  const polygon = (points, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)));
    ctx.closePath();
    ctx.fill();
  };
  const face = (vertices, color) =>
    polygon(
      vertices.map((v) => project(...v)),
      color,
    );
  const cube = (x, y, z, w, h, d, colors) => {
    const a = x - w / 2,
      b = x + w / 2,
      c = z - d / 2,
      e = z + d / 2,
      t = y + h;
    const surfaces = [
      {
        v: [
          [a, y, c],
          [b, y, c],
          [b, t, c],
          [a, t, c],
        ],
        c: colors[2],
      },
      {
        v: [
          [b, y, c],
          [b, y, e],
          [b, t, e],
          [b, t, c],
        ],
        c: colors[1],
      },
      {
        v: [
          [b, y, e],
          [a, y, e],
          [a, t, e],
          [b, t, e],
        ],
        c: colors[0],
      },
      {
        v: [
          [a, y, e],
          [a, y, c],
          [a, t, c],
          [a, t, e],
        ],
        c: colors[1],
      },
      {
        v: [
          [a, t, c],
          [b, t, c],
          [b, t, e],
          [a, t, e],
        ],
        c: colors[3] || colors[0],
      },
    ];
    surfaces.sort(
      (a, b) =>
        a.v.reduce((n, v) => n + project(...v).depth, 0) -
        b.v.reduce((n, v) => n + project(...v).depth, 0),
    );
    for (const surface of surfaces) face(surface.v, surface.c);
  };
  const rod = (a, b, width, color) => {
    const A = project(...a),
      B = project(...b),
      length = Math.hypot(B.x - A.x, B.y - A.y) || 1;
    const ox = (((B.y - A.y) / length) * width) / 2,
      oy = ((-(B.x - A.x) / length) * width) / 2;
    polygon(
      [
        { x: A.x + ox, y: A.y + oy },
        { x: B.x + ox, y: B.y + oy },
        { x: B.x - ox, y: B.y - oy },
        { x: A.x - ox, y: A.y - oy },
      ],
      color,
    );
  };
  const ellipse = (x, y, z, rx, ry, color) => {
    const q = project(x, y, z);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(q.x, q.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  // A two-joint mechanical leg follows each foot without stretching its rods.
  ctx.fillStyle = "#02060780";
  ctx.beginPath();
  ctx.ellipse(0, 1, 12, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const limbs = [];
  for (const sign of [-1, 1]) {
    const { forward, lift } = step(sign);
    const hip = 17 + bob,
      dy = 3 + lift - hip,
      distance = Math.hypot(dy, forward),
      segment = Math.max(7.5 + motion * 3, distance / 2 + 0.01),
      bend = Math.sqrt(segment * segment - (distance * distance) / 4),
      kneeY = hip + dy / 2 + (forward / distance) * bend,
      kneeZ = forward / 2 - (dy / distance) * bend;
    limbs.push({
      depth: project(sign * 4, 0, forward * 0.5).depth,
      draw: () => {
        rod([sign * 4, hip, 0], [sign * 4, kneeY, kneeZ], 3.5, "#5d7570");
        ellipse(sign * 4, kneeY, kneeZ, 2, 2, "#a4b6a1");
        rod(
          [sign * 4, kneeY, kneeZ],
          [sign * 4, 3 + lift, forward],
          3.3,
          "#819187",
        );
        cube(sign * 4, lift, forward + 1, 5, 3, 7, [
          "#a5afa0",
          "#677f77",
          "#526b65",
          "#c1c5ae",
        ]);
      },
    });
  }
  limbs.sort((a, b) => a.depth - b.depth).forEach((l) => l.draw());
  const arms = [];
  for (const sign of [-1, 1]) {
    const greeting = sign === (cos >= 0 ? -1 : 1) ? reach : 0;
    const swing = -step(sign).forward * 0.28 + greeting * 9,
      depth = project(sign * 8, 0, 0).depth;
    arms.push({
      depth,
      draw: () => {
        rod(
          [sign * 7, 26 + bob, 0],
          [sign * 9, 21 + bob + greeting * 3, swing * 0.4],
          3,
          "#708b80",
        );
        rod(
          [sign * 9, 21 + bob + greeting * 3, swing * 0.4],
          [sign * 9, 16 + bob + greeting * 10, swing],
          3,
          "#a2b39e",
        );
        ellipse(sign * 9, 15 + bob + greeting * 10, swing, 2.6, 2.4, "#d1d0b5");
      },
    });
  }
  // The far arm belongs behind the torso in profile and diagonal views.
  arms.filter((a) => a.depth < -0.01).forEach((a) => a.draw());
  cube(0, 15 + bob, 0, 12, 13, 11, [
    "#bcc5ae",
    "#7f9990",
    "#718c84",
    "#d7d6bd",
  ]);
  cube(0, 27 + bob, 0, 4, 4, 4, ["#9eaea0", "#6b8579", "#6b8579"]);
  // Rounded corners are formed by a beveled silhouette, not a shear of a front sprite.
  cube(0, 32 + bob, 0, 19, 13, 17, [
    "#d2d3b9",
    "#9dad9b",
    "#82978b",
    "#e4dfc5",
  ]);
  cube(0, 30 + bob, 0, 15, 2, 15, ["#b5c3ae", "#819d91", "#6c877e"]);
  cube(0, 45 + bob, 0, 15, 2, 15, ["#cfdbc0", "#9bb5a0", "#819b8c"]);
  if (sin >= -0.01) {
    face(
      [
        [-7, 33 + bob, 8.6],
        [7, 33 + bob, 8.6],
        [7, 43 + bob, 8.6],
        [-7, 43 + bob, 8.6],
      ],
      "#142f35",
    );
    const blink = !quiet && Math.sin(time * 0.63 + 1) > 0.996;
    for (const eye of [-3.5, 3.5]) {
      const q = project(eye, 38 + bob, 8.7);
      ctx.fillStyle = "#a6f0d4";
      ctx.fillRect(q.x - 1, q.y - (blink ? 0 : 2), 2, blink ? 1 : 4);
    }
    const q = project(0, 34.5 + bob, 8.7);
    ctx.fillStyle = "#81bfb1";
    ctx.fillRect(q.x - 1, q.y, 2, 1);
    face(
      [
        [-3, 18 + bob, 5.6],
        [3, 18 + bob, 5.6],
        [3, 23 + bob, 5.6],
        [-3, 23 + bob, 5.6],
      ],
      "#4e736a",
    );
    const light = project(0, 21 + bob, 5.7);
    ctx.fillStyle = "#e8b86c";
    ctx.fillRect(light.x, light.y, 2, 2);
  } else {
    for (let y = 34; y < 43; y += 3)
      face(
        [
          [-5, y + bob, -8.6],
          [5, y + bob, -8.6],
          [5, y + 1 + bob, -8.6],
          [-5, y + 1 + bob, -8.6],
        ],
        "#5c7a70",
      );
    cube(0, 18 + bob, -4.3, 5, 8, 2, ["#8fa797", "#5c7b70", "#b3c2a6"]);
  }
  // A side dial gives profiles an identifiable face without inventing extra eyes.
  const dialSide = cos >= 0 ? -1 : 1;
  ellipse(dialSide * 9.8, 37 + bob, 0, 2, 3, "#c49d63");
  ellipse(dialSide * 9.8, 37 + bob, 0, 1, 1, "#5b695c");
  arms
    .filter((a) => a.depth >= -0.01)
    .sort((a, b) => a.depth - b.depth)
    .forEach((a) => a.draw());
  ctx.restore();
}
