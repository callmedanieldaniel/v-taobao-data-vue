<template>
  <a-table
    bordered
    :pagination="{
      defaultPageSize:100,
  }"
    :size="'small'"
    :columns="columns"
    :data-source="dataList"
  >
    <a slot="name" slot-scope="text">{{ text }}</a>
  </a-table>
</template>
<script>
const columns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    scopedSlots: { customRender: "name" }
  },
  {
    title: "Age",
    dataIndex: "age",
    key: "age",
    width: 80
  },
  {
    title: "Address",
    dataIndex: "address",
    key: "address 1",
    ellipsis: true
  },
  {
    title: "Long Column Long Column Long Column",
    dataIndex: "address",
    key: "address 2",
    ellipsis: true
  },
  {
    title: "Long Column Long Column",
    dataIndex: "address",
    key: "address 3",
    ellipsis: true
  },
  {
    title: "Long Column",
    dataIndex: "address",
    key: "address 4",
    ellipsis: true
  }
];

export default {
  props: ["dataList"],
  data() {
    return {
      columns
    };
  },
  mounted() {
    const first = this.dataList[0];
    const keys = Object.keys(first);
    this.columns = keys.map((k, i) => {
      return {
        title: k,
        dataIndex: k,
        key: k + i,
        ellipsis: true
      };
    });
  }
};
</script>