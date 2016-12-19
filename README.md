# fis3-postpackager-mergejs
js文件后端加载器，分析后端模板文件中的js引用，并将这些js文件合并后插入到页面中。

# 安装
```
npm install fis3-postpackager-mergejs
```

# 使用
在后端模板文件中通过注释添加引用关系：
```html
<!--
    @require(some js);
    @require(other js);
-->
```
在你希望插入合并后的文件的地方，加上：
```html
<!-- REQUIRE_PLACEHOLDER -->
```
## require路径说明
require支持三种路径查找方式（相对当前模板文件路径）：

1. 当前目录，直接引用文件名即可：require(file name)；
2. 相对路径，如'./util/lib/jquery.js'，则在path配置的路径为根目录查找；
3. 绝对路径，如'/publi/js/jquery.js'，则在项目根目录查找。

# 配置说明
1. path 指定后端模板根目录
2. ext 指定模板文件后缀
3. debug 默认为false，配置是否在合并文件中加入源文件信息，如 'import from xxxx'
```javascript
fis.match('::package', {
    postpackager: fis.plugin('mergejs', {
      path: '/components',
      ext: '.hbs',
      debug: true
    })
});
```