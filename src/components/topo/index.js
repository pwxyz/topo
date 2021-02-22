

import React from 'react'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import * as THREE from 'three';
import { get, flatten } from 'lodash'
import { initCameraPosition, initCameraLookAt, initLineColor, planInitCameraPosition, initSpriteColor, hoverSpriteColor } from './constants'

import img from './instance.png'

import polygon from './../../utils/polygon';
import { Form, Input, Button } from 'antd'


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
    height: 500,
    hoverSprite: false,
    selectSpriteUserData: {}
  }

  componentDidMount() {
    this.threeInit(this.getWidthAndHeight())

    window.addEventListener('mousemove', this.mouseMove);

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
    let material = new THREE.LineBasicMaterial({ color: initLineColor });
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

  getSpriteObj = (position = [0, 0, 0]) => {
    let spriteMap = new THREE.TextureLoader().load(img);
    let spriteMaterial = new THREE.SpriteMaterial({
      map: spriteMap,
      color: 0xffffff,
    })
    let sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(50, 50, 1);
    sprite.position.set(...this.getFinalPosition(position)
    );
    sprite.userData = {
      id: getRandomStr(),
      parents: [...get(this.state.selectSpriteUserData, 'userData.parents', []), get(this.state.selectSpriteUserData, 'userData.id')].filter(i => i)
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
    arr = num.map(i => get(polygon({ num: i, startAngle, side }), 'data'))
    console.log(arr)
    arr = flatten(arr)
    return arr
  }

  toggle = () => {
    this.controls.enableRotate = !this.controls.enableRotate
  }

  removeSomeSprite = () => {
    let id = get(this.state.selectSpriteUserData, 'userData.id')
    console.log(id)
    if (id) {
      let arrs = this.scene.children.filter(i => {
        let parents = get(i, 'userData.parents', [])
        return parents.includes(id)
      })
      for (let i = 0; i < arrs.length; i++) {
        this.scene.remove(arrs[i])
      }
    }
    else {
      let arrs = this.scene.children
      console.log(arrs)
      for (let i = 0; i < arrs.length; i++) {
        this.scene.remove(arrs[i])
      }
    }
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
    let group = new THREE.Group()
    let selectSpriteUserData = this.state.selectSpriteUserData
    if ('userData' in selectSpriteUserData) {
      group.parent = selectSpriteUserData
      group.position.set(get(selectSpriteUserData, 'position.x'), get(selectSpriteUserData, 'position.y'), get(selectSpriteUserData, 'position.z'))
    }
    group.name = get(selectSpriteUserData, 'userData.id', 'root')
    for (let i = 0; i < arr.length; i++) {
      let item = this.getSpriteObj(arr[i])
      // array.push(item)
      group.add(item)

    }
    this.scene.add(group)

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
      this.changeSpriteColor(get(arr, '0.object'), 'hover')
      this.setState({ selectSpriteUserData: get(arr, '0.object') })
      console.log(get(arr, '0.object'))
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
    console.log(this.scene)
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