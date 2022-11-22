import { createTest, destroyVM } from '../util';
import Resize from 'packages/resize';

describe('Resize', () => {
  let vm;
  afterEach(() => {
    destroyVM(vm);
  });

  it('create', () => {
    vm = createTest(Resize, true);
    expect(vm.$el).to.exist;
  });
});

