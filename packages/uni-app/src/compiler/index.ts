export default () => [
  /* eslint-disable no-restricted-globals */
  ...require('@dcloudio/uni-cloud/lib/uni.plugin.js').default(),
  /* eslint-disable no-restricted-globals */
  ...require('@dcloudio/uni-push/lib/uni.plugin.js')(),
  /* eslint-disable no-restricted-globals */
  ...require('@dcloudio/uni-stat/lib/uni.plugin.js')(),
  /* eslint-disable no-restricted-globals */
  ...require('@dcloudio/uni-console/lib/uni.plugin.js')(),
]
