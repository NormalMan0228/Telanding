export const STRIDE_RATE = 3.2;
export const STEP_LENGTH = 5.4;
export const STEP_HEIGHT = 3.2;

/** Rounded endpoints keep the little machine's feet from snapping at contact. */
export function footPose(phase, amplitude = STEP_LENGTH) {
  const cycle = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return {
    forward: -Math.cos(cycle) * amplitude,
    lift: Math.max(0, Math.sin(cycle)) * STEP_HEIGHT,
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

/** An asymmetric articulated instrument with no human facial expression. */
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
  const bob = Math.abs(Math.sin(player.gait || 0)) * 0.15 * motion;
  const size = p.scale * 1.26;
  const step = (sign) => {
    const pose = footPose(
      (player.gait || 0) + (sign < 0 ? Math.PI : 0),
      STEP_LENGTH,
    );
    return { forward: pose.forward * motion, lift: pose.lift * motion };
  };
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(size, size);
  ctx.imageSmoothingEnabled = false;
  const project = (x, y, z) => ({
    x: x * sin + z * cos,
    y: -y + (-x * cos + z * sin) * (p.depthScale ?? 0.55),
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
  // Faceted ovoid shells share the limb projection, so all directions keep volume.
  const shell = (x, y, z, rx, ry, rz) => {
    const surfaces = [], segments = 14, rings = 10;
    const point = (r, s) => {
      const latitude = -Math.PI / 2 + r * Math.PI / rings;
      const longitude = s * Math.PI * 2 / segments;
      return [x + Math.cos(latitude) * Math.cos(longitude) * rx,
        y + Math.sin(latitude) * ry,
        z + Math.cos(latitude) * Math.sin(longitude) * rz];
    };
    for(let r=0;r<rings;r++)for(let s=0;s<segments;s++){
      const vertices=[point(r,s),point(r,s+1),point(r+1,s+1),point(r+1,s)];
      const light=0.55+0.18*Math.sin((r+0.5)*Math.PI/rings)+0.14*Math.cos((s+0.5)*Math.PI*2/segments-0.8);
      surfaces.push({vertices,depth:vertices.reduce((sum,v)=>sum+project(...v).depth,0),
        color:`rgb(${Math.round(180*light)},${Math.round(193*light)},${Math.round(172*light)})`});
    }
    surfaces.sort((a,b)=>a.depth-b.depth).forEach(s=>face(s.vertices,s.color));
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
      kneeY = 10 + bob * 0.5 + lift * 0.42,
      kneeZ = 2 + forward * 0.42;
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
        cube(sign * 4, lift, forward + 0.7, 5, 3, 6, [
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
    const swing = -step(sign).forward * 0.42 + greeting * 9,
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
        const handY = 15 + bob + greeting * 10;
        if (sign < 0) {
          rod([sign * 9, handY + 2, swing], [sign * 10, handY - 4, swing], 1.4, "#989d8f");
        } else {
          ellipse(sign * 9, handY, swing, 1.5, 1.5, "#9b8660");
          rod(
            [sign * 9, handY, swing],
            [sign * 11, handY + 1.8, swing + 0.5],
            1.3,
            "#c2ae7a",
          );
          rod(
            [sign * 9, handY, swing],
            [sign * 11, handY - 1.2, swing + 0.5],
            1.3,
            "#c2ae7a",
          );
        }
      },
    });
  }
  // The far arm belongs behind the torso in profile and diagonal views.
  arms.filter((a) => a.depth < -0.01).forEach((a) => a.draw());
  shell(0, 22 + bob, 0, 7.2, 8.5, 6.2);
  cube(0, 27 + bob, 0, 4, 4, 4, ["#9eaea0", "#6b8579", "#6b8579"]);
  shell(0, 42 + bob, 0, 7, 11.5, 7.5);
  // Offset frame and hanging probe remain anatomical in all eight projections.
  rod([4, 44 + bob, 0], [9, 47 + bob, 0], 1.2, "#8d8d7d");
  rod([9, 47 + bob, 0], [9, 34 + bob, 0], 1.2, "#8d8d7d");
  rod([9, 34 + bob, 0], [5, 30 + bob, 0], 1.2, "#8d8d7d");
  rod([-5, 32 + bob, -6], [-8, 26 + bob, -7], 1.1, "#273e39");
  if (sin >= -0.01) {
    face(
      [[-3, 35 + bob, 6.6], [3, 35 + bob, 6.6],
       [3, 48 + bob, 6.6], [-3, 48 + bob, 6.6]], "#172526",
    );
    // The moving index is instrumentation, not a pair of eyes.
    const scanY = 40 + bob + (quiet ? 0 : Math.sin(time * 0.4) * 2);
    rod([-2.5, scanY, 6.7], [2.5, scanY, 6.7], 1, "#adb5a3");
    rod([0, 36 + bob, 6.7], [0, 47 + bob, 6.7], 1, "#626f68");
    cube(3, 20 + bob, 5.8, 2, 6, 1, ["#7d8171", "#4d6057", "#6f7869"]);
  } else {
    for (let y = 34; y < 43; y += 3)
      face(
        [
          [-5, y + bob, -6.6],
          [1, y + bob, -6.6],
          [1, y + 1 + bob, -6.6],
          [-5, y + 1 + bob, -6.6],
        ],
        "#5c7a70",
      );
    cube(0, 18 + bob, -4.3, 5, 8, 2, ["#8fa797", "#5c7b70", "#b3c2a6"]);
    rod([-3, 39 + bob, -8.8], [-6, 41 + bob, -9], 1.5, "#a58e60");
    rod([-6, 41 + bob, -9], [-6, 37 + bob, -9], 1.5, "#a58e60");
  }
  const dialSide = cos >= 0 ? -1 : 1;
  rod([dialSide * 5.7, 35 + bob, 0], [dialSide * 5.7, 47 + bob, 0], 1.5, "#929585");
  arms
    .filter((a) => a.depth >= -0.01)
    .sort((a, b) => a.depth - b.depth)
    .forEach((a) => a.draw());
  ctx.restore();
}
