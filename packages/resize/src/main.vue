<template>
  <div class="el-resize">
    <div ref="nResize" :class="[`el-resize__item`, `is-n`, `el-resize__item--${size}`]"></div>

    <div ref="sResize" :class="[`el-resize__item`, `is-s`, `el-resize__item--${size}`]"></div>

    <div ref="wResize" :class="[`el-resize__item`, `is-w`, `el-resize__item--${size}`]"></div>

    <div ref="eResize" :class="[`el-resize__item`, `is-e`, `el-resize__item--${size}`]"></div>

    <div ref="nwResize" :class="[`el-resize__item`, `is-nw`, `el-resize__item--${size}`]"></div>

    <div ref="swResize" :class="[`el-resize__item`, `is-sw`, `el-resize__item--${size}`]"></div>

    <div ref="neResize" :class="[`el-resize__item`, `is-ne`, `el-resize__item--${size}`]"></div>

    <div ref="seResize" :class="[`el-resize__item`, `is-se`, `el-resize__item--${size}`]"></div>
  </div>
</template>

<script>
import { calculateRotatedPointCoordinate, getCenterPoint } from '../../../src/utils/math-utils';
import { on, off, once } from '../../../src/utils/dom';

export default {
  name: 'ElResize',

  props: {
    // 控制手柄是否显示，true: 显示；false: 不显示
    selected: {
      type: Boolean,
      default: true
    },
    // 控制显示各个方位的手柄有无
    positions: {
      type: Array,
      default: () => ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']
    },
    // 控制手柄的大小，取值：small、medium、large
    size: {
      type: String,
      default: 'medium'
    },
    // 是否允许拖曳改变大小
    resizable: {
      type: Boolean,
      default: true
    },
    // 宿主元素对缩放后的位置和大小处理的函数(箭头函数)
    resizeMoving: {
      type: Function,
      default: null
    },
    // 宿主元素对缩放结束后的函数(箭头函数)
    resizeEnd: {
      type: Function,
      default: null
    },
    // 拖曳缩放功能的宿主元素
    resizeElement: {
      type: Function,
      default: null
    },
    // 宿主元素所在的容器元素(可理解为定义范围的元素)
    containerElement: {
      type: Function,
      default: null
    }
  },

  data() {
    return {
      angleToCursor: [
        { start: 338, end: 23, cursor: 'nw-resize' },
        { start: 23, end: 68, cursor: 'n-resize' },
        { start: 68, end: 113, cursor: 'ne-resize' },
        { start: 113, end: 158, cursor: 'e-resize' },
        { start: 158, end: 203, cursor: 'se-resize' },
        { start: 203, end: 248, cursor: 's-resize' },
        { start: 248, end: 293, cursor: 'sw-resize' },
        { start: 293, end: 338, cursor: 'w-resize' }
      ],
      functionMap: {
        n: this.calculateTop,
        s: this.calculateBottom,
        w: this.calculateLeft,
        e: this.calculateRight,
        nw: this.calculateLeftTop,
        ne: this.calculateRightTop,
        sw: this.calculateLeftBottom,
        se: this.calculateRightBottom
      },
      elementInfos: [],
      initResizeToAngle: []
    };
  },

  mounted() {
    this.elementInfos = [
      { element: this.$refs.nResize, position: 'n' },
      { element: this.$refs.sResize, position: 's' },
      { element: this.$refs.wResize, position: 'w' },
      { element: this.$refs.eResize, position: 'e' },
      { element: this.$refs.nwResize, position: 'nw' },
      { element: this.$refs.neResize, position: 'ne' },
      { element: this.$refs.swResize, position: 'sw' },
      { element: this.$refs.seResize, position: 'se' }
    ];
    // 初始化小方框和其对应的 Cursor 的初始角度
    /* this.initResizeToAngle = new Map([
      [this.$refs.nwResize, 0],
      [this.$refs.nResize, 45],
      [this.$refs.neResize, 90],
      [this.$refs.eResize, 135],
      [this.$refs.seResize, 180],
      [this.$refs.sResize, 225],
      [this.$refs.swResize, 270],
      [this.$refs.wResize, 315]
    ]); */
    // 为各个手柄绑定事件
    this.subscribe(this.elementInfos);
  },

  methods: {
    /**
     * Resize 功能增强
     * @param elementInfos {Array<{element: HTMLElement, position: string}>}
     */
    subscribe(elementInfos) {

      elementInfos.forEach(elementInfo => {
        on(elementInfo.element, 'mousedown', this.getMousedownFunc(elementInfo.position));
      });

    },

    getMousedownFunc(position) {
      return (e) => {
        e.stopPropagation();
        e.preventDefault();
        // 获取 resizeElement 在屏幕中的位置
        const rect = this.resizeElement().getBoundingClientRect();
        // 获取 resizeElement 所在容器元素在屏幕中的位置
        const containerRect = this.containerElement().getBoundingClientRect();
        // 获取元素的中心点
        const center = {
          x: (rect.left + rect.width / 2) - containerRect.left,
          y: (rect.top + rect.height / 2) - containerRect.top
        };
        // 获取当前点击坐标
        const curPoint = {
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top
        };
        // 获取对称点坐标
        const symmetricPoint = {
          x: center.x - (curPoint.x - center.x),
          y: center.y - (curPoint.y - center.y)
        };
        // 获取对应 Element 的长宽比例
        const proportion = this.resizeElement().offsetWidth / this.resizeElement().offsetHeight;
        // 获取旋转角度
        const transform = this.resizeElement().style.transform;
        let rotate = 0;
        const regExp = /(-)?\d+([.]\d+)?(deg)/g;
        if (regExp.test(transform)) {
          rotate = parseFloat(transform.match(regExp)[0]);
        }
        // mousemove 回调函数
        const mousemoveFunc = (event) => {
          event.stopPropagation();
          event.preventDefault();
          const curPosition = {
            x: event.clientX - containerRect.left,
            y: event.clientY - containerRect.top
          };

          const pointInfo = {
            symmetricPoint,
            center,
            curPoint
          };

          this.functionMap[position](rotate, curPosition, proportion, pointInfo, this.resizeMoving);
        };
        on(document, 'mousemove', mousemoveFunc);

        // mouseup 回调函数
        const mouseupFunc = (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          this.resizeEnd();
          off(document, 'mousemove', mousemoveFunc);
        };
        once(document, 'mouseup', mouseupFunc);
      };
    },

    /**
     * 拖曳左上角
     * @param rotate {number} 旋转的角度
     * @param curPosition {{x: number, y: number}} Mousemove 产生的位置
     * @param proportion {number} resizeElement 对应的比例
     * @param pointInfo {{symmetricPoint: Object, center: Object, curPoint: Object}} symmetricPoint(对称点位置)、center(中点位置)、curPoint(Mousedown位置)
     * @param callback {Function} 将计算完的值进行设置的回调函数
     */
    calculateLeftTop(rotate, curPosition, proportion, pointInfo, callback) {
      const { symmetricPoint } = pointInfo;

      // 获取即时的中心点：top、left、right、bottom
      let newCenterPoint = getCenterPoint(curPosition, symmetricPoint);
      let newTopLeftPoint = calculateRotatedPointCoordinate(curPosition, newCenterPoint, -rotate);
      let newBottomRightPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);

      // 获取最新的 width 和 height
      let newWidth = newBottomRightPoint.x - newTopLeftPoint.x;
      let newHeight = newBottomRightPoint.y - newTopLeftPoint.y;

      // 等比例缩放
      {
        if (newWidth / newHeight > proportion) {
          newTopLeftPoint.x += Math.abs(newWidth - newHeight * proportion);
        } else {
          newTopLeftPoint.y += Math.abs(newHeight - newWidth / proportion);
        }

        // 由于现在求的未旋转前的坐标是没有按比例缩放宽高的坐标计算
        // 所以缩减了宽高之后，需要按照原来的中心店旋转回去，获取缩减宽高并旋转后对应的坐标
        // 然后这个坐标和对称点获取新的中心点，并重新计算未旋转前的坐标
        const rotatedTopLeftPoint = calculateRotatedPointCoordinate(newTopLeftPoint, newCenterPoint, rotate);
        newCenterPoint = getCenterPoint(rotatedTopLeftPoint, symmetricPoint);
        newTopLeftPoint = calculateRotatedPointCoordinate(rotatedTopLeftPoint, newCenterPoint, -rotate);
        newBottomRightPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);

        // 重新赋值最新的 width 和 height
        newWidth = newBottomRightPoint.x - newTopLeftPoint.x;
        newHeight = newBottomRightPoint.y - newTopLeftPoint.y;
      }

      callback({ x: newTopLeftPoint.x, y: newTopLeftPoint.y }, { width: newWidth, height: newHeight });

    },

    /**
     * 拖曳右上角
     * @param rotate {number} 旋转的角度
     * @param curPosition {{x: number, y: number}} Mousemove 产生的位置
     * @param proportion {number} resizeElement 对应的比例
     * @param pointInfo {{symmetricPoint: Object, center: Object, curPoint: Object}} symmetricPoint(对称点位置)、center(中点位置)、curPoint(Mousedown位置)
     * @param callback {Function} 将计算完的值进行设置的回调函数
     */
    calculateRightTop(rotate, curPosition, proportion, pointInfo, callback) {
      const { symmetricPoint } = pointInfo;
      let newCenterPoint = getCenterPoint(curPosition, symmetricPoint);
      let newTopRightPoint = calculateRotatedPointCoordinate(curPosition, newCenterPoint, -rotate);
      let newBottomLeftPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);

      let newWidth = newTopRightPoint.x - newBottomLeftPoint.x;
      let newHeight = newBottomLeftPoint.y - newTopRightPoint.y;

      {
        if (newWidth / newHeight > proportion) {
          newTopRightPoint.x -= Math.abs(newWidth - newHeight * proportion);
        } else {
          newTopRightPoint.y += Math.abs(newHeight - newWidth / proportion);
        }

        const rotatedTopRightPoint = calculateRotatedPointCoordinate(newTopRightPoint, newCenterPoint, rotate);
        newCenterPoint = getCenterPoint(rotatedTopRightPoint, symmetricPoint);
        newTopRightPoint = calculateRotatedPointCoordinate(rotatedTopRightPoint, newCenterPoint, -rotate);
        newBottomLeftPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);

        newWidth = newTopRightPoint.x - newBottomLeftPoint.x;
        newHeight = newBottomLeftPoint.y - newTopRightPoint.y;
      }

      callback({ x: newBottomLeftPoint.x, y: newTopRightPoint.y }, { width: newWidth, height: newHeight });
    },

    /**
     * 拖曳右下角
     * @param rotate {number} 旋转的角度
     * @param curPosition {{x: number, y: number}} Mousemove 产生的位置
     * @param proportion {number} resizeElement 对应的比例
     * @param pointInfo {{symmetricPoint: Object, center: Object, curPoint: Object}} symmetricPoint(对称点位置)、center(中点位置)、curPoint(Mousedown位置)
     * @param callback {Function} 将计算完的值进行设置的回调函数
     */
    calculateRightBottom(rotate, curPosition, proportion, pointInfo, callback) {

      const { symmetricPoint } = pointInfo;
      let newCenterPoint = getCenterPoint(curPosition, symmetricPoint);
      let newTopLeftPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);
      let newBottomRightPoint = calculateRotatedPointCoordinate(curPosition, newCenterPoint, -rotate);

      let newWidth = newBottomRightPoint.x - newTopLeftPoint.x;
      let newHeight = newBottomRightPoint.y - newTopLeftPoint.y;

      {
        if (newWidth / newHeight > proportion) {
          newBottomRightPoint.x -= Math.abs(newWidth - newHeight * proportion);
        } else {
          newBottomRightPoint.y -= Math.abs(newHeight - newWidth / proportion);
        }

        const rotatedBottomRightPoint = calculateRotatedPointCoordinate(newBottomRightPoint, newCenterPoint, rotate);
        newCenterPoint = getCenterPoint(rotatedBottomRightPoint, symmetricPoint);
        newTopLeftPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);
        newBottomRightPoint = calculateRotatedPointCoordinate(rotatedBottomRightPoint, newCenterPoint, -rotate);

        newWidth = newBottomRightPoint.x - newTopLeftPoint.x;
        newHeight = newBottomRightPoint.y - newTopLeftPoint.y;
      }

      callback({ x: newTopLeftPoint.x, y: newTopLeftPoint.y }, { width: newWidth, height: newHeight });
    },

    /**
     * 拖曳左下角
     * @param rotate {number} 旋转的角度
     * @param curPosition {{x: number, y: number}} Mousemove 产生的位置
     * @param proportion {number} resizeElement 对应的比例
     * @param pointInfo {{symmetricPoint: Object, center: Object, curPoint: Object}} symmetricPoint(对称点位置)、center(中点位置)、curPoint(Mousedown位置)
     * @param callback {Function} 将计算完的值进行设置的回调函数
     */
    calculateLeftBottom(rotate, curPosition, proportion, pointInfo, callback) {
      const { symmetricPoint } = pointInfo;
      let newCenterPoint = getCenterPoint(curPosition, symmetricPoint);
      let newTopRightPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);
      let newBottomLeftPoint = calculateRotatedPointCoordinate(curPosition, newCenterPoint, -rotate);

      let newWidth = newTopRightPoint.x - newBottomLeftPoint.x;
      let newHeight = newBottomLeftPoint.y - newTopRightPoint.y;

      {
        if (newWidth / newHeight > proportion) {
          newBottomLeftPoint.x += Math.abs(newWidth - newHeight * proportion);
        } else {
          newBottomLeftPoint.y -= Math.abs(newHeight - newWidth / proportion);
        }

        const rotatedBottomLeftPoint = calculateRotatedPointCoordinate(newBottomLeftPoint, newCenterPoint, rotate);
        newCenterPoint = getCenterPoint(rotatedBottomLeftPoint, symmetricPoint);
        newTopRightPoint = calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);
        newBottomLeftPoint = calculateRotatedPointCoordinate(rotatedBottomLeftPoint, newCenterPoint, -rotate);

        newWidth = newTopRightPoint.x - newBottomLeftPoint.x;
        newHeight = newBottomLeftPoint.y - newTopRightPoint.y;
      }

      callback({ x: newBottomLeftPoint.x, y: newTopRightPoint.y }, { width: newWidth, height: newHeight });
    },

    /**
     * 拖曳正上方
     * @param rotate {number} 旋转的角度
     * @param curPosition {{x: number, y: number}} Mousemove 产生的位置
     * @param proportion {number} resizeElement 对应的比例
     * @param pointInfo {{symmetricPoint: Object, center: Object, curPoint: Object}} symmetricPoint(对称点位置)、center(中点位置)、curPoint(Mousedown位置)
     * @param callback {Function} 将计算完的值进行设置的回调函数
     */
    calculateTop(rotate, curPosition, proportion, pointInfo, callback) {
      const { symmetricPoint, curPoint } = pointInfo;
      let rotatedCurPosition = calculateRotatedPointCoordinate(curPosition, curPoint, -rotate);
      let rotatedTopMiddlePoint = calculateRotatedPointCoordinate({
        x: curPoint.x,
        y: rotatedCurPosition.y
      }, curPoint, rotate);

      // 勾股定理
      let newHeight = Math.sqrt(Math.pow((rotatedTopMiddlePoint.x - symmetricPoint.x), 2) + Math.pow((rotatedTopMiddlePoint.y - symmetricPoint.y), 2));

      if (newHeight > 0) {
        const newCenter = {
          x: rotatedTopMiddlePoint.x - (rotatedTopMiddlePoint.x - symmetricPoint.x) / 2,
          y: rotatedTopMiddlePoint.y + (symmetricPoint.y - rotatedTopMiddlePoint.y) / 2
        };

        let newWidth = this.resizeElement().offsetWidth;

        callback({
          x: Math.round(newCenter.x - (newWidth / 2)),
          y: Math.round(newCenter.y - (newHeight / 2))
        }, { width: newWidth, height: newHeight });
      }
    },

    /**
     * 拖曳正右方
     * @param rotate {number} 旋转的角度
     * @param curPosition {{x: number, y: number}} Mousemove 产生的位置
     * @param proportion {number} resizeElement 对应的比例
     * @param pointInfo {{symmetricPoint: Object, center: Object, curPoint: Object}} symmetricPoint(对称点位置)、center(中点位置)、curPoint(Mousedown位置)
     * @param callback {Function} 将计算完的值进行设置的回调函数
     */
    calculateRight(rotate, curPosition, proportion, pointInfo, callback) {
      const { symmetricPoint, curPoint } = pointInfo;
      const rotatedCurPosition = calculateRotatedPointCoordinate(curPosition, curPoint, -rotate);
      const rotatedRightMiddlePoint = calculateRotatedPointCoordinate({
        x: rotatedCurPosition.x,
        y: curPoint.y
      }, curPoint, rotate);

      let newWidth = Math.sqrt(Math.pow((rotatedRightMiddlePoint.x - symmetricPoint.x), 2) + Math.pow((rotatedRightMiddlePoint.y - symmetricPoint.y), 2));
      if (newWidth > 0) {
        const newCenter = {
          x: rotatedRightMiddlePoint.x - (rotatedRightMiddlePoint.x - symmetricPoint.x) / 2,
          y: rotatedRightMiddlePoint.y + (symmetricPoint.y - rotatedRightMiddlePoint.y) / 2
        };

        let newHeight = this.resizeElement().offsetHeight;

        callback({
          x: Math.round(newCenter.x - (newWidth / 2)),
          y: Math.round(newCenter.y - (newHeight / 2))
        }, { width: newWidth, height: newHeight });
      }
    },

    /**
     * 拖曳正下方
     * @param rotate {number} 旋转的角度
     * @param curPosition {{x: number, y: number}} Mousemove 产生的位置
     * @param proportion {number} resizeElement 对应的比例
     * @param pointInfo {{symmetricPoint: Object, center: Object, curPoint: Object}} symmetricPoint(对称点位置)、center(中点位置)、curPoint(Mousedown位置)
     * @param callback {Function} 将计算完的值进行设置的回调函数
     */
    calculateBottom(rotate, curPosition, proportion, pointInfo, callback) {
      const { symmetricPoint, curPoint } = pointInfo;
      const rotatedCurPosition = calculateRotatedPointCoordinate(curPosition, curPoint, -rotate);
      const rotatedBottomMiddlePoint = calculateRotatedPointCoordinate({
        x: curPoint.x,
        y: rotatedCurPosition.y
      }, curPoint, rotate);

      const newHeight = Math.sqrt(Math.pow((rotatedBottomMiddlePoint.x - symmetricPoint.x), 2) + Math.pow((rotatedBottomMiddlePoint.y - symmetricPoint.y), 2));
      if (newHeight > 0) {
        const newCenter = {
          x: rotatedBottomMiddlePoint.x - (rotatedBottomMiddlePoint.x - symmetricPoint.x) / 2,
          y: rotatedBottomMiddlePoint.y + (symmetricPoint.y - rotatedBottomMiddlePoint.y) / 2
        };

        let newWidth = this.resizeElement().offsetWidth;

        callback({
          x: Math.round(newCenter.x - (newWidth / 2)),
          y: Math.round(newCenter.y - (newHeight / 2))
        }, { width: newWidth, height: newHeight });
      }
    },

    /**
     * 拖曳正左方
     * @param rotate {number} 旋转的角度
     * @param curPosition {{x: number, y: number}} Mousemove 产生的位置
     * @param proportion {number} resizeElement 对应的比例
     * @param pointInfo {{symmetricPoint: Object, center: Object, curPoint: Object}} symmetricPoint(对称点位置)、center(中点位置)、curPoint(Mousedown位置)
     * @param callback {Function} 将计算完的值进行设置的回调函数
     */
    calculateLeft(rotate, curPosition, proportion, pointInfo, callback) {
      const { symmetricPoint, curPoint } = pointInfo;
      const rotatedCurPosition = calculateRotatedPointCoordinate(curPosition, curPoint, -rotate);
      const rotatedLeftMiddlePoint = calculateRotatedPointCoordinate({
        x: rotatedCurPosition.x,
        y: curPoint.y
      }, curPoint, rotate);

      const newWidth = Math.sqrt(Math.pow((rotatedLeftMiddlePoint.x - symmetricPoint.x), 2) + Math.pow((rotatedLeftMiddlePoint.y - symmetricPoint.y), 2));
      if (newWidth > 0) {
        const newCenter = {
          x: rotatedLeftMiddlePoint.x - (rotatedLeftMiddlePoint.x - symmetricPoint.x) / 2,
          y: rotatedLeftMiddlePoint.y + (symmetricPoint.y - rotatedLeftMiddlePoint.y) / 2
        };

        let newHeight = this.resizeElement().offsetHeight;

        callback({
          x: Math.round(newCenter.x - (newWidth / 2)),
          y: Math.round(newCenter.y - (newHeight / 2))
        }, { width: newWidth, height: newHeight });
      }
    }
  }
};
</script>
