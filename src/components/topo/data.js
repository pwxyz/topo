
const getRandomStr = () =>
  Math.random()
    .toString(36)
    .slice(-6);

const getData = () => {
  let lv0 = 1
  let lv1 = 10
  let lv2 = 60
  let lv3 = 550
  // let total = lv0 + lv1 + lv2 + lv3
  // let total = 3

  const getIdArr = (num) => Array.from({ length: num }, i => getRandomStr())
  let lv0IdArr = getIdArr(lv0)
  let lv1IdArr = getIdArr(lv1)
  let lv2IdArr = getIdArr(lv2)
  let lv3IdArr = getIdArr(lv3)
  console.log(lv0IdArr, lv1IdArr, lv2IdArr, lv3IdArr)
}
console.log('xx')

getData()
