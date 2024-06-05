import parseBaseComponent from './component-base-parser'

import {
  isPage,
  initRelation
} from './util'


/**
 * 通用 parseComponent
 * 个别小程序平台有特殊处理，使用了 parseBaseComponent
 * @param {*} vueComponentOptions
 * @param {*} needVueOptions
 * @returns
 */
export default function parseComponent (vueComponentOptions, needVueOptions) {
  return parseBaseComponent(vueComponentOptions, {
    isPage,
    initRelation
  }, needVueOptions)
}
