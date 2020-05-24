<template>
  <div class="hello">
    <a-radio-group v-model="rootId" @change="onIdTypeChange">
      <a-radio-button v-for="id in Object.keys(idTypes)" :value="id" :key="id">{{idTypes[id]}}</a-radio-button>
    </a-radio-group>
    <download-csv
      :fields="validFields"
      class="btn btn-default"
      :data="uniqueDataList"
      :name="csvName"
    >
      <a-button type="primary" icon="download">{{csvName}}</a-button>
    </download-csv>
    <div class="panel">
      <!-- <a-tabs
        :style="{
      width:200,
      heigth:900,
    }"
        :v-model="activeKey"
        :tab-position="'left'"
        size="small"
        @tabClick="onTabClick"
      >
        <a-tab-pane
          v-for="time in times"
          :key="`${time.start}-${time.end}`"
          :tab="`${time.start}-${time.end}`"
        ></a-tab-pane>
      </a-tabs>-->

      <a-radio-group v-model="activeKey" @change="onChange">
        <a-radio
          v-for="time in times"
          :value="`${time.start}-${time.end}`"
          :key="`${time.start}-${time.end}`"
        >{{`${time.start}-${time.end}`}}</a-radio>
      </a-radio-group>
      <div>
        <Table v-if="dataList && dataList.length" :dataList="dataList" />
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from "dayjs";
import Table from "./Table.vue";
const { Parser } = require("json2csv");

export default {
  name: "Index",
  components: {
    Table
  },
  data() {
    return {
      idTypes: {
        95: "直播",
        100: "短视频"
      },
      rootId: 95, //直播美食95， 短视频美食100
      activeKey: "",
      times: [],
      uniqueDataList: [],
      dataList: [],
      idInfoKv: {},
      timeDatas: {},
      validFields: [
        "nick",
        "粉丝数",
        "商业转化指数",
        "淘指数",
        "粉丝号召指数",
        "合作",
        "内容消费指数",
        "area",
        "avgScore",
        "服务评分",
        "签约机构"
        // "达人信息",
        // "id",
        // "时间段",
        // "change",
        // "序号",
        // "darenUrl",
        // "homePage",
        // "wirelessQr",
      ]
    };
  },
  props: {
    msg: String
  },
  mounted() {
    this.getTimes(this.rootId);
    // Make a request for a user with a given ID
  },
  computed: {
    csvName() {
      let timeDesc = "";
      // console.log("hhhhh", this.times);
      if (this.times && this.times.length > 0) {
        const list = this.times.sort((a, b) => a.startTime - b.startTime);
        let start = dayjs(list[0].startTime).format("YYYY/MM/DD");
        let end = dayjs(list[list.length - 1].endTime).format("YYYY/MM/DD");
        timeDesc = `${start}-${end}`;
      }
      return `${this.idTypes[this.rootId]}美食博主${timeDesc}.csv`;
    }
  },
  methods: {
    onChange(e) {
      this.onTabClick(e.target.value);
    },
    onIdTypeChange(e) {
      this.rootId = e.target.value;
      this.getTimes(this.rootId);
    },
    onTabClick(key) {
      // const t = this.times.filter(t => (this.activeKey = t.count))[0];
      // console.log(this.activeKey, this.rootId);
      this.activeKey = key;
      this.$nextTick(() => {
        this.dataList = this.timeDatas[key];
        console.log("dataList", this.dataList);
      });
    },
    getParams(kvs) {
      return Object.keys(kvs)
        .map(k => {
          return `${k}=${kvs[k]}`;
        })
        .join("&");
    },
    getTimes(id) { //获取可用来分析的时间段
      const self = this;
      const url = `http://tbd.wshang.com/api/list/publishdetail?id=${id}`;
      this.$http
        .get(url)
        .then(function(rs) {
          const list = rs.data.data.map(item => {
            return {
              start: dayjs(item.startTime).format("YYYY/MM/DD"),
              end: dayjs(item.endTime).format("YYYY/MM/DD"),
              ...item
            };
          });
          self.times = list.slice(0,4);
          // const time = self.times[0];
          self.times.forEach(t => {
            self.getDetail(self.rootId, t);
          });
        })
    },
    getDetail(id, t) { //获取某个时间段下的 各博主的各类数据（指数粉丝数等）
      const self = this;
      const end = this.getParams({
        page: 1,
        pageSize: 200,
        id: id,
        count: t.count
      });
      const url = `http://tbd.wshang.com/api/list/pageQuery?${end}`;
      const list = this.$http.get(url).then(function(rs) {
        const list = rs.data.data.contents;
        list.map(o => {
          o.id = o["达人信息"];
        });
        self.getNames({
          id,
          time: t,
          dataList: list,
          idList: list.map(o => {
            return o.id;
          })
        });
      });
      return list;
    },
    getNames({ time, idList, dataList }) {//获取博主个人信息：名字、个人地址等
      const self = this;
      const url = `http://tbd.wshang.com/api/daren/listdareninfo?darens=${idList.join(
        ","
      )}`;
      this.$http.get(url).then(function(rs) {
        const idNames = {};
        const kvs = rs.data.data;
        Object.keys(kvs).forEach(id => {
          const item = kvs[id];
          for (let i = 0; i < dataList.length; i++) {
            const _item = dataList[i];
            if (_item.id == id) {
              dataList[i] = {
                // 昵称: item.nick,
                ..._item,
                ...item
              };
              idNames[id] = _item.nick;
              return;
            }
          }
        });
        self.timeDatas[`${time.start}-${time.end}`] = dataList;
        if (Object.keys(self.timeDatas).length > self.times.length - 1) {
          self.transform(self.timeDatas);
        }
      });
    },
    transform(dataKv) {
      // 将各时间段的数据信息进行融合、转换
      // 除去无效数据，有效数据求平均
      let list = [];
      Object.keys(dataKv).map(k => {
        let datas = dataKv[k];
        datas.forEach(item => {
          item["时间段"] = k;
        });
        list = list.concat(datas);
      });
      list = list.sort((a, b) => {
        return a.id - b.id;
      });
      const idValues = {};
      list.map(item => {
        if (item) {
          if (idValues[item.id]) {
            idValues[item.id].push(item);
          } else {
            idValues[item.id] = [item];
          }
        }
      });
      const uniqueItems = Object.keys(idValues).map(id => {
        let values = idValues[id];
        const uniq = values[0];
        const sums = {商业转化指数:0 ,  粉丝数:0 ,  淘指数:0 ,  粉丝号召指数:0 ,  内容消费指数:0 ,  avgScore: 0};
        for (let i = 0; i < values.length; i++) {
          Object.keys(sums).forEach(k => {
            let v = values[i][k];
            let num = 0;
            if (v && v.toString().indexOf("万") > -1) {
              v = v.replace("万", "") * 10000;
              num = parseInt(v);
            } else {
              num = parseFloat(v);
            }
            if (!Number.isNaN(num)) {
              sums[k] += num;
            }
            values[i][k] = v;
          });
        }
        Object.keys(sums).forEach(k => {
          if (k !== "粉丝数") {
            let n = parseFloat(sums[k] / values.length).toFixed(1);
            if (n > 100) {
              n = ~~n;
            }
            uniq[k] = n;
          }
        });
        return uniq;
      });

    console.log('----',uniqueItems)
      this.uniqueDataList = uniqueItems;
      let json2csvParser = new Parser();
      let csv = json2csvParser.parse(uniqueItems);
      this.getProducts();
    },
    getProducts() {
      const item = this.uniqueDataList[0];
      // this.getSingleProducts(item.id);
    },

    async getSingleProducts(id) {
      const self = this;
      const url = `http://v.taobao.com/micromission/req/price/GetPriceListByLeafCatId.do?`;
      const list = this.$http
        .post(url, {
          darenId: id,
          currentPage: 1,
          pageSize: 10,
          catId: 0,
          _output_charset: "UTF-8",
          _input_charset: "UTF-8",
          _csrf: "fc547114-36f2-40d0-b425-3eb6ed75db9d"
        })
        .then(function(rs) {
          console.log("proces", rs);
        });
      return list;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.panel {
  width: 100%;
  height: 90%;
  overflow: scroll;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
