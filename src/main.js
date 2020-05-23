import Vue from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import JsonCSV from 'vue-json-csv'

Vue.component('downloadCsv', JsonCSV)
Vue.use(Antd);
Vue.config.productionTip = false;

import axios from 'axios' // 引入axios 
import qs from 'qs' // 引入qs
Vue.prototype.$http = axios;
//添加请求拦截器
axios.interceptors.request.use(function (config) {
  config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
  if (config.method === 'post') { // post请求时，处理数据
    config.data = qs.stringify({
      ...config.data //后台数据接收这块需要以表单形式提交数据，而axios中post默认的提交是json数据,所以这里选用qs模块来处理数据，也有其他处理方式，但个人觉得这个方式最简单好用
    })
  }
  return config;
}, function (error) {
  // loadinginstace.close()
  return Promise.reject(error);
})
//添加响应拦截器
axios.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  return Promise.reject(error);
});



new Vue({
  render: h => h(App),
}).$mount('#app')