# 全自动图片压缩脚本

-   创建时间: 2018 年 9 月 4 日 17:00:51
-   更新时间: 2021-06-08 11:04:59
-   作者: chenhu.pei
-   邮箱: pch1024@outlook.com
-   脚本介绍:

```js
/**
 * 帮助文档
 * -------
 *
 * 获取帮助
 * 指令 -help
 *
 * 获取命令执行文件夹
 * 指令 -dir/-img
 * 参数 ./
 * 必填，待处理图像的目录或者文件
 *
 * 获取是否深度递归处理图片文件夹
 * 指令 -deep
 * 可选，默认不深度递归
 *
 * 命令行脚本参考示例
 * 
 * 常看帮助
 * > tinypng -help
 * 
 * 单文件处理
 * > tinypng -img ./public/test.png
 * 
 * 文件夹多文件处理
 * > tinypng -dir ./public
 * 
 * 文件夹多文件处理，深度查找处理
 * > tinypng -dir ./public -deep
 *  */
```

## 示例

执行命令：

> tinypng -dir ./public/ -deep

输出结果：

```bash
本次执行脚本的配置： {
  successCount: 0,
  files: [ 'public/deep/test.png', 'public/test.png' ],
  type: 'dir',
  pathname: './public/',
  DeepLoop: true,
  Exts: [ '.jpg', '.png' ],
  Max: 5200000
}
等待处理文件的数量: 2
压缩成功，优化比例: 0.00% ，原始大小: 58.77KB ，压缩大小: 58.77KB ,文件[1] ：public/test.png
压缩成功，优化比例: 0.00% ，原始大小: 58.77KB ，压缩大小: 58.77KB ,文件[2] ：public/deep/test.png
```