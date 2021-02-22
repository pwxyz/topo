

// 基于多边形规则生产对应坐标点

/* 参数  num: 几条边  startAngle:起始角度  以x正轴为0度，顺时针方向  最小边长 side
* 返回 { data: 坐标参数, maxR: 最大半径 }
*/
const polygon = ({ num, startAngle = 0, side = 30 }) => {
  if (num === 0) {
    return []
  }
  if (num === 1) {
    return [[0, 0, 0]]
  }
  let arr = []
  let perDeg = 360 / num
  let maxR = 0
  for (let i = 0; i < num; i++) {
    let sin = getFloorNum(Math.sin(perDeg * Math.PI / 180), 15)
    sin = sin === 0 ? 1 : sin
    let r = (side / 2) / sin
    if (r > maxR) {
      maxR = r
    }
    let coordinate = getCoordnate(i * perDeg + startAngle, r)
    arr.push(coordinate)
  }
  return { data: arr, maxR, side }
}

/**
 * 根据角度及半径求对应坐标 deg为角度 r为半径
 */
const getCoordnate = (deg, r) => {
  let y = -1 * Math.sin(deg * Math.PI / 180)
  // y = deg === 360 ? 0 : y
  y = getNumber(y * r)
  let x = Math.cos(deg * Math.PI / 180)
  // x = deg === 90 || deg === 270 ? 0 : x
  x = getNumber(x * r)

  // return { x, y, r: x * x + y * y }
  return [x, y, 0]
}


/**
 * 保留几位小数  向上取整
 */

const getNumber = (num, digit = 2) => {
  let x = Math.pow(10, digit)
  return Math.ceil(x * num) / x
}

const getFloorNum = (num, digit = 2) => {
  let x = Math.pow(10, digit)
  return Math.floor(x * num) / x
}

export default polygon