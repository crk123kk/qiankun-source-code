##### 这是关于 qiankun 源码阅读的相关 code

    模拟 qiankun 源码写的一个框架

    npm install
    npm run dev

##### qiankun 源码解读

    主要是封装了 single-spa的技术成为一个框架

    监听路由的变化从而切换不同的应用

    内部实现中使用了状态机的机制：需要管理各个不同的应用的状态，然后根据各个应用不同的状态进行应用切换

    设计到的知识点大致有：

        1、路由的API（hash\h5）以及对原始API的封装和改写

        2、promise的封装

        3、状态机机制
