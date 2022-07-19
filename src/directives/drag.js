/**
 * @author liujiahao
 * @date 2022/7/19
 */

import { on, off, once } from '../utils/dom';

/**
 * 拖曳移动功能核心函数
 * @param element {HTMLElement} 需要增加拖曳功能的 HTML 元素
 * @param dragMoving {Function} 拖曳移动过程中的接口函数
 * @param dragEnd {Function} 拖曳结束中的接口函数
 */
const dragFunc = function(element, dragMoving, dragEnd) {

  // mousedown 事件回调函数
  const handleMousedown = (event) => {
    // 事件阻止传递和默认行为
    event.stopPropagation();
    event.preventDefault();

    // 获取鼠标点击时的位置
    let x0 = event.clientX;
    let y0 = event.clientY;

    // mousemove 事件回调函数
    const handleMousemove = (ev) => {
      // 事件阻止传递和默认行为
      ev.stopPropagation();
      ev.preventDefault();

      // 获取鼠标移动长度
      let deltaX = ev.clientX - x0;
      let deltaY = ev.clientY - y0;
      // 重置鼠标的初始位置
      x0 = ev.clientX;
      y0 = ev.clientY;
      // 调用自定义传递进来的 dragMoving 函数
      dragMoving(deltaX, deltaY);
    };
    // 监听全局 mousemove 事件
    on(document, 'mousemove', handleMousemove);

    // mouseup 事件回调
    const handleMouseup = (ev) => {
      // 事件阻止传递和默认行为
      ev.stopPropagation();
      ev.preventDefault();
      // 调用自定义传递进来的 dragEnd 函数
      dragEnd();
      // 移除全局 mousemove 监听函数
      off(document, 'mousemove', handleMousemove);
    };
    // 监听一次性的 mouseup 事件，响应一次就销毁
    once(document, 'mouseup', handleMouseup);
  };
  // 绑定指定绑定元素的 mousedown 事件
  on(element, 'mousedown', handleMousedown);
};

export default {
  bind(el, binding) {
    // 获取外层传入的 dragMoving 和 dragEnd 函数
    const { dragMoving, dragEnd } = binding.value;
    // 为元素添加 drag 功能
    dragFunc(el, dragMoving, dragEnd);
  }
};
