## Resize 尺寸控件

用于在给用户控制元素的大小尺寸

### 基础用法

:::demo

```html
<template>
    <div ref="containerElement" style="width: auto;height: 500px">
        <div ref="resizeElement" 
             style="background: #3a8ee6;position: relative" 
             :style="styleObj">
            <el-resize :resize-moving="getResizeMoving()" 
                       :resize-end="getResizeEnd()" 
                       :container-element="getContainerElement()" 
                       :resize-element="getResizeElement()"></el-resize>
        </div>
    </div>
</template>

<script>
    export default {
      data() {
        return {
          styleObj: {
            width: `100px`,
            height: `100px`,
            left: `50px`,
            top: `50px`  
          }
        }
      },
        
      methods: {
        getResizeElement() {
          return () => {
            return this.$refs.resizeElement;
          }
        },
          
        getContainerElement() {
          return () => {
            return this.$refs.containerElement;
          }
        },
        
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
            // do something here
            console.log("resize end");  
          }
        }  
      }  
    }
</script>
```

:::
