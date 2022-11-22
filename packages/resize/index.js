import Resize from './src/main';

/* istanbul ignore next */
Resize.install = function(Vue) {
  Vue.component(Resize.name, Resize);
};

export default Resize;
