<template>
  <div ref="containerElement" style="margin: 20px;">
<!--    <el-input v-model="input" placeholder="请输入内容"></el-input>-->
    <div ref="resizeElement" :style="styleObj" style="background: #3a8ee6;display: inline-block;position: relative">
      <el-resize :resize-moving="getResizeMoving()"
                 :resize-end="getResizeEnd()"
                 :size="'medium'"
                 :positions="['n', 's', 'w', 'e']"
                 :container-element="getContainerElement()"
                 :resize-element="getResizeElement()"></el-resize>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        input: 'Hello Element UI!',
        styleObj: {
          width: `100px`,
          height: `100px`,
          left: `300px`,
          top: `300px`
        }
      };
    },

    methods: {
      getResizeMoving() {
        return (position, size) => {
          this.styleObj.left = `${position.x}px`;
          this.styleObj.top = `${position.y}px`;
          this.styleObj.width = `${size.width}px`;
          this.styleObj.height = `${size.height}px`;
        }
      },

      getResizeEnd() {
        return () => {
          console.log("resize end");
        }
      },

      getResizeElement() {
        return () => {
          return this.$refs.resizeElement;
        }
      },

      getContainerElement() {
        return () => {
          return this.$refs.containerElement;
        }
      }


    }
  };
</script>
