// Saved positions remain in the v1 coordinate system. Only the view is projected.
// A unit of ground depth represents three horizontal world units.
export const GROUND = Object.freeze({ left: 62, right: 418, back: 205, front: 237 });
export const DEPTH_UNIT = 3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function project(point, view = {}) {
  const depth = (point.y - GROUND.back) / (GROUND.front - GROUND.back);
  const scale = .82 + depth * .16;
  return {
    x: 240 + (point.x - 240) * scale + (view.x || 0) * (depth - .5),
    y: 178 + depth * 66 + (view.y || 0) * (depth - .5),
    scale, depth
  };
}

export function unproject(point, view = {}) {
  const depth = (point.y - 178 + (view.y || 0) * .5) / (66 + (view.y || 0));
  return {
    x: 240 + (point.x - 240 - (view.x || 0) * (depth - .5)) / (.82 + depth * .16),
    y: GROUND.back + depth * (GROUND.front - GROUND.back)
  };
}

export function groundPoint(point, view = {}) {
  const p = unproject(point, view);
  const epsilon=1e-8;
  return Number.isFinite(p.x) && Number.isFinite(p.y) &&
    p.x >= GROUND.left-epsilon && p.x <= GROUND.right+epsilon && p.y >= GROUND.back-epsilon && p.y <= GROUND.front+epsilon
    ? { x:clamp(p.x,GROUND.left,GROUND.right), y:clamp(p.y,GROUND.back,GROUND.front) } : null;
}

export function groundDistance(a, b) {
  return Math.hypot(a.x - b.x, (a.y - b.y) * DEPTH_UNIT);
}

export function depthOrder(entities) {
  return [...entities].sort((a, b) => a.y - b.y || a.id - b.id);
}

export function entityBounds(entity, view = {}) {
  const p = project(entity, view);
  const size = entity.size == null ? (entity.age < 35 ? .8 : 1) : Math.max(.28,entity.size);
  const dimensions = { tree: [47, 104], fern: [26, 39], moss: [19, 15], rabbit: [14, 28], snail: [15, 18] };
  const [width, height] = dimensions[entity.type];
  const scale = size * p.scale;
  return { left: p.x - width * scale, right: p.x + width * scale, top: p.y - height * scale, bottom: p.y + 4 * p.scale };
}

// Pick in reverse painting order so overlapping residents can be selected as seen.
export function pickEntity(entities, point, view = {}) {
  return depthOrder(entities).reverse().find(entity => {
    const b = entityBounds(entity, view);
    if(point.x < b.left-2 || point.x > b.right+2 || point.y < b.top-2 || point.y > b.bottom+2)return false;
    if(entity.type!=='tree')return true;
    const p=project(entity,view),scale=Math.max(.28,entity.size)*p.scale;
    const x=(point.x-p.x)/scale,y=(point.y-p.y)/scale;
    // A tree's empty space beside its trunk should not swallow a resident click.
    if(Math.abs(x)<=6&&y>=-58&&y<=5)return true;
    return [[-18,-53,23],[19,-62,25],[0,-77,27],[-5,-47,19]].some(([cx,cy,r])=>
      (x-cx)**2/(r*r)+(y-cy)**2/(r*r*.75)<=1.12);
  }) ?? null;
}

export function moveGroundCursor(point, dx, dy, view = {}) {
  const world = unproject(point, view);
  return project({ x: clamp(world.x + dx, GROUND.left, GROUND.right), y: clamp(world.y + dy, GROUND.back, GROUND.front) }, view);
}
