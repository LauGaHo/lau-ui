/**
 * 计算根据圆心旋转后的点的坐标（本质是线性代数的二维变换）
 * @param point {{x: number, y: number}} 点坐标
 * @param center {{ x: number, y: number }} 旋转中心
 * @param rotate {number} 旋转角度
 */
export function calculateRotatedPointCoordinate(point, center, rotate) {
  return {
    x: (point.x - center.x) * Math.cos(angleToRadian(rotate)) - (point.y - center.y) * Math.sin(angleToRadian(rotate)) + center.x,
    y: (point.x - center.x) * Math.sin(angleToRadian(rotate)) + (point.y - center.y) * Math.cos(angleToRadian(rotate)) + center.y
  };
}

/**
 * 角度和弧度互换
 * @param deg {number} 角度
 */
export function angleToRadian(deg) {
  return deg * Math.PI / 180;
}

/**
 * 获取两个点的中心点
 * @param p1 {{x: number, y: number}} p1 点
 * @param p2 {{x: number, y: number}} p2 点
 */
export function getCenterPoint(p1, p2) {
  return {
    x: p1.x + ((p2.x - p1.x) / 2),
    y: p1.y + ((p2.y - p1.y) / 2)
  };
}
