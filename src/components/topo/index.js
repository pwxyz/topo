

import React from 'react'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import * as THREE from 'three';
import { get, flatten, last } from 'lodash'
import { initCameraPosition, initCameraLookAt, initLineColor, planInitCameraPosition, initSpriteColor, hoverSpriteColor } from './constants'

import img from './instance.png'

import polygon from './../../utils/polygon';
import { Form, Input, Button } from 'antd'


const initName = 'root'


const getRandomStr = () =>
  Math.random()
    .toString(36)
    .slice(-6);

class Topo extends React.Component {
  dom = null
  camera = null
  scene = null
  raycaster = null
  renderer = null
  mouse = null
  controls = null
  mapObj = null

  state = {
    num: [1],
    startAngle: 0,
    totalNum: 1,
    maxNum: 350,
    side: 300,
    height: 300,
    hoverSprite: false,
    selectSpriteUserData: {}
  }

  componentDidMount() {
    this.threeInit(this.getWidthAndHeight())

    window.addEventListener('mousemove', this.mouseMove);
    window.scene = this.scene
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.mouseMove);
  }

  getWidthAndHeight = () => {
    let width = this.dom.offsetWidth
    let height = this.dom.offsetHeight
    return { width, height }
  }

  setAxes = () => {
    this.setLine([-1000, 0, 0], [1000, 0, 0])
    this.setLine([0, -1000, 0], [0, 1000, 0])
  }

  setLine = (firstArr, lastArr) => {
    let material = new THREE.LineBasicMaterial({ color: initLineColor, side: THREE.DoubleSide });
    let geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(...firstArr))
    geometry.vertices.push(new THREE.Vector3(...lastArr))
    let line = new THREE.Line(geometry, material);
    this.scene.add(line)
  }

  getFinalPosition = (position) => {
    // let parentPositionObj = get(this.state.selectSpriteUserData, 'position', { x: 0, y: 0, z: 0 })

    // let needHeight = !!get(this.state.selectSpriteUserData, 'position')

    // let z = get(position, '2', 0) + get(parentPositionObj, 'z')
    // if (needHeight) {
    //   z = z - this.state.height
    // }
    // let arr = [get(position, '0', 0) + get(parentPositionObj, 'x'), get(position, '1', 0) + get(parentPositionObj, 'y'), z]
    // console.log(z, needHeight, get(position, '2', 0), get(parentPositionObj, 'z'))
    // return arr

    let needHeight = !!get(this.state.selectSpriteUserData, 'position')
    let z = get(position, '2', 0)
    if (needHeight) {
      z = z - this.state.height
    }
    return [get(position, '0'), get(position, '1'), z]
  }


  getPrents = () => {
    let arr = [...get(this.state.selectSpriteUserData, 'userData.parents', []), get(this.state.selectSpriteUserData, 'userData.id')].filter(i => i)
    if (!arr.length) {
      return [initName]
    }

    else return arr
  }

  resetSprite = () => {
    let parents = get(this.state.selectSpriteUserData, 'userData.parents', [])

    let arr = this.scene.children.filter(i => parents.includes(get(i, 'name')))

    //用于储存更新后ratio的值
    let ratioObj = {}


    //按父级长度排序  优先计算低层级的数据
    arr.sort((a, b) => parents.findIndex(i => get(a, 'name') === i) - parents.findIndex(i => get(b, 'name') === i))

    for (let i = 0; i < arr.length; i++) {

      //移除需要重置组中的线
      let lineArr = get(arr, `${i}.children`).filter(i => get(i, 'type') === 'Line')
      // lineArr.forEach(j => get(arr, i).remove(j))
      console.log(lineArr)
      get(arr, i).remove(...lineArr)

      // let ratio = (get(arr, `${i}.userData.maxR`) + get(arr, `${i}.userData.side`)) / get(arr, `${i}.userData.side`)

      let ratio = get(arr, `${i}.userData.ratio`, 2)

      let initRatio = (get(arr, `${i}.userData.maxR`) + get(arr, `${i}.userData.side`)) / get(arr, `${i}.userData.side`, 1)

      //找出子group倍数
      // let childGroupRatio = get(arr, `${i + 1}.userData.ratio`, 1)
      let childGroupRatio = get(ratioObj, get(arr, `${i}.name`), get(arr, `${i + 1}.userData.ratio`, 1))
      let newRatio = childGroupRatio * initRatio
      ratio = newRatio > ratio ? newRatio : ratio
      console.log(arr, ratio, parents)
      get(arr, `${i}`).userData = {
        ...get(arr, `${i}.userData`, {}),
        ratio
      }
      ratioObj[get(arr, `${i}.name`)] = ratio
      console.log(ratio, newRatio, get(arr, i), { ratioObj })
      let childLen = get(arr, `${i}.children.length`)
      for (let j = 0; j < childLen; j++) {
        let position = get(arr, `${i}.children.${j}.userData.position`, [0, 0, 0])
        // let newPositon = this.getFinalPosition(position).map((k, index) => {
        //   if (index === 2) {
        //     return k
        //   }
        //   else return k * ratio
        // })



        let newPositon = position.map((k, index) => {
          if (index === 2) {
            return k
          }
          else return k * ratio
          // return k * ratio
        })

        // console.log(newPositon, ratio, position, get(arr, `${i}.children.${j}`))
        get(arr, `${i}.children.${j}`).position.set(...newPositon)



        //重新绘制线
        let line = this.getLineObj([0, 0, 0], newPositon)
        get(arr, i).add(line)
      }
    }
    console.log(ratioObj)
  }

  getSpriteObj = (position = [0, 0, 0], arg = {}) => {
    let spriteMap = new THREE.TextureLoader().load(img);
    let spriteMaterial = new THREE.SpriteMaterial({
      map: spriteMap,
      color: 0xffffff,
      side: THREE.DoubleSide
    })
    let sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(50, 50, 1);
    let finalPostion = this.getFinalPosition(position)
    sprite.position.set(...finalPostion
    );
    let id = getRandomStr()
    sprite.name = id
    sprite.userData = {
      id,
      // parents: [...get(this.state.selectSpriteUserData, 'userData.parents', []), get(this.state.selectSpriteUserData, 'userData.id')].filter(i => i),
      parents: this.getPrents(),
      position: finalPostion,
      ...arg
    }
    // this.scene.add(sprite)
    return sprite
  }

  threeInit = (obj) => {
    this.camera = new THREE.PerspectiveCamera(50, get(obj, 'width', 1) / get(obj, 'height', 1), 1, 10000)
    this.camera.position.set(...planInitCameraPosition)
    this.camera.lookAt(...initCameraLookAt)

    this.scene = new THREE.Scene();
    this.mouse = new THREE.Vector2();
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(get(obj, 'width', 1), get(obj, 'height', 1));
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.dom.appendChild(this.renderer.domElement);

    this.dom.addEventListener('click', this.clickSprite)
    this.controls = new OrbitControls(this.camera, this.dom);

    // this.controls.enableRotate = false

    this.scene.background = new THREE.Color(0xffffff);

    let num = this.state.num
    let startAngle = this.state.startAngle

    this.renderImg(this.getSpriteArr({ num, startAngle, side: this.state.side }))

    this.setAxes()
    this.animate();

    this.raycaster = new THREE.Raycaster();

    this.raycaster.params.Line.threshold = 10; //线的检测精度

  }

  getSpriteArr = (obj) => {
    let num = get(obj, 'num', this.state.num)
    let startAngle = get(obj, 'startAngle', this.state.startAngle)
    let side = get(obj, 'side', this.state.side)
    let arr = []
    // arr = num.map(i => get(polygon({ num: i, startAngle, side }), 'data'))
    let x = num.map(i => polygon({ num: i, startAngle, side }))

    return flatten(x)
    // arr = flatten(arr)
    // return arr
  }

  toggle = () => {
    this.controls.enableRotate = !this.controls.enableRotate
  }

  removeSomeSprite = () => {
    let id = get(this.state.selectSpriteUserData, 'userData.id')

    if (id) {
      // let arrs = this.scene.children.filter(i => {
      //   let parents = get(i, 'userData.parents', [])
      //   return parents.includes(id)
      // })
      // for (let i = 0; i < arrs.length; i++) {
      //   this.scene.remove(arrs[i])
      // }
      console.log(id)
      let arrs = this.scene.children.filter(i => get(i, 'name') === id)
      for (let i = 0; i < arrs.length; i++) {
        this.scene.remove(arrs[i])
      }
    }
    // else {
    //   let arrs = this.scene.children

    //   for (let i = 0; i < arrs.length; i++) {
    //     this.scene.remove(arrs[i])
    //   }
    // }
  }

  // addGroupLine = (startPoint, endPoint) => this.getLineObj(startPoint, endPoint)

  getLineObj = (startPoint, endPoint) => {
    let material = new THREE.LineBasicMaterial({ color: initLineColor });
    let geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(...startPoint))
    geometry.vertices.push(new THREE.Vector3(...endPoint))
    let line = new THREE.Line(geometry, material);
    return line
  }

  getParent = () => {
    let parents = get(this.state.selectSpriteUserData, 'userData.parents', [])
    let arg = this.scene

    for (let i = 0; i < parents.length; i++) {
      let newArg = arg.children.find(j => get(j, 'name') === parents[i])
      console.log({ newArg })
      if (newArg) {
        arg = newArg
      }
    }
    console.log(parents, arg)
    return arg
  }

  renderImg = (arr) => {
    if (!arr) {
      arr = this.getSpriteArr()
    }
    // let arrs = this.scene.children.filter(i => i['type'] === 'Sprite')
    // for (let i = 0; i < arrs.length; i++) {
    //   this.scene.remove(arrs[i])
    // }


    this.removeSomeSprite()
    this.resetSprite()
    let group = new THREE.Group()
    let selectSpriteUserData = this.state.selectSpriteUserData
    if ('userData' in selectSpriteUserData) {
      group.parent = selectSpriteUserData
      group.position.set(get(selectSpriteUserData, 'position.x'), get(selectSpriteUserData, 'position.y'), get(selectSpriteUserData, 'position.z'))
    }

    group.name = get(selectSpriteUserData, 'userData.id', initName)
    let maxR = 0
    let arg = {}
    for (let i = 0; i < arr.length; i++) {
      let itemArr = get(arr[i], 'data')
      maxR = get(arr[i], 'maxR') > maxR ? get(arr[i], 'maxR') : maxR
      arg = arr[i]
      itemArr?.forEach(j => {
        let item = this.getSpriteObj(j, arr[i])
        if (get(selectSpriteUserData, 'userData.id')) {
          let line = this.getLineObj([0, 0, 0], this.getFinalPosition(j))
          group.add(line)
        }

        group.add(item)
      })
      // let item = this.getSpriteObj(get(arr[i], 'data'))
      // array.push(item)

      // group.add(item)

    }

    group.userData = {
      parents: this.getPrents(),
      ...arg,
      maxR
    }

    this.scene.add(group)
    // this.getParent().add(group)

  }

  animate = () => {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };

  changeConfig = (value) => {
    let obj = { ...value }

    obj['num'] = obj['num'].split(',').map(i => Number(i))
    // console.log(obj)
    for (let key in obj) {
      if (key === 'num') {
        // return
      }
      else {
        obj[key] = Number(obj[key])
      }

    }
    let totalNum = obj['num']?.reduce((a, b) => a + b)
    // console.log(obj)
    this.setState({ ...obj, totalNum })
    this.renderImg(this.getSpriteArr(obj))
  }

  mouseMove = (e) => {
    let arr = this.getSprite(e)
    this.setState({ hoverSprite: !!arr.length })
  }

  clickSprite = (e) => {
    let arr = this.getSprite(e)
    if (arr.length) {
      // arr.forEach(i => this.changeSpriteColor(get(i, 'object'), 'hover'))
      let arg = get(last(arr), 'object')
      this.changeSpriteColor(arg, 'hover')
      this.setState({ selectSpriteUserData: arg })
      // console.log(arg)
    }
    else {
      this.changeSpriteColor(this.state.selectSpriteUserData, 'common')
      this.setState({ selectSpriteUserData: {} })

    }

  }

  changeSpriteColor = (obj, state = 'common') => {
    let color = state === 'common' ? initSpriteColor : hoverSpriteColor;
    obj?.material?.color?.set(color);
    if (obj?.userData) {
      obj.userData = { ...get(obj, 'userData', {}), __lineState: state };
    }
  };

  getSprite = (e) => {
    let arg = this.getWidthAndHeight()
    this.mouse.x = (e.offsetX / get(arg, 'width')) * 2 - 1;
    this.mouse.y = -(e.offsetY / get(arg, 'height')) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    let intersects = this.raycaster.intersectObjects(this.scene.children, true);
    let arr = intersects.filter(i => get(i, 'object.type') === 'Sprite')
    // console.log(intersects)
    return arr
  }

  select = (totalNum) => {
    console.log(totalNum)
    this.setState({ totalNum })
  }

  render() {
    const { num, startAngle, side, maxNum, totalNum, hoverSprite, height } = this.state
    // 
    return (
      <div>
        <div ref={e => this.dom = e} style={{ position: 'relative', width: '100vw', height: '100vh', cursor: hoverSprite ? 'pointer' : 'inherit' }}  >

        </div>
        <div style={{ position: 'absolute', top: 20, right: 100, width: 300 }} >
          <Button onClick={this.toggle} >锁定视角</Button>
          <div style={{ overflow: 'scroll', display: 'flex', alignItems: 'center' }} >
            <div style={{ marginRight: 10, whiteSpace: 'nowrap' }} >最大值</div>
            {
              [...Array.from({ length: maxNum }, (i, len) => len + 1)].map((i, len) => <div key={i} onClick={() => this.select(i)} style={{ cursor: 'pointer', margin: 5, padding: '0 5px', color: totalNum === i ? 'blue' : 'inherit' }} >
                {i}
              </div>)
            }
          </div>
          <Form onFinish={this.changeConfig} initialValues={{
            num: num.join(','), startAngle, side, height
          }} >
            <Form.Item label="层级间距" name='height' >
              <Input />
            </Form.Item>
            <Form.Item label="数量" name='num' >
              <Input />
            </Form.Item>
            <Form.Item label="起始角度" name='startAngle' >
              <Input />
            </Form.Item>
            <Form.Item label="多边形边长" name='side' >
              <Input />
            </Form.Item>
            <Button htmlType='submit' >提交</Button>
          </Form>

        </div>
      </div>

    )
  }

}

export default Topo