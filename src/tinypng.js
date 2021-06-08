#!/usr/bin/env node

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
 * > node ./tinypng.js -help
 * > node ./tinypng.js -img ./public/test.png
 * > node ./tinypng.js -dir ./public -deep
 * > node ./tinypng.js -dir ./public -deep
 *  */

const fs = require("fs");
const path = require("path");
const https = require("https");
const URL = require("url").URL;
const EventEmitter = require("events");
const err = (msg) => new EventEmitter().emit("error", msg);

if (getHelp()) return false;
const isDir = process.argv.includes("-dir");
const isImg = process.argv.includes("-img");
const type = isDir ? "dir" : isImg ? "img" : "none"; // none 错误不处理 dir 文件夹多个图像 img 单图像文件

const conf = {
    successCount: 0,
    files: [],
    type: type,
    pathname: getEntryFolder(),
    DeepLoop: getDeepLoop(),
    Exts: [".jpg", ".png"],
    Max: 5200000 // 5MB == 5242848.754299136
};

fileFilter(conf.pathname);

console.log("本次执行脚本的配置：", conf);
console.log("等待处理文件的数量:", conf.files.length);

conf.files.forEach((img) => fileUpload(img));

//////////////////////////////// 工具函数

/**
 * 获取帮助命令
 * 指令 -help
 */
function getHelp() {
    let i = process.argv.findIndex((i) => i === "-help");
    if (i !== -1) {
        console.log(`
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
         * > node ./tinypng.js -help
         * > node ./tinypng.js -img ./public/test.png
         * > node ./tinypng.js -dir ./public -deep
         * > node ./tinypng.js -dir ./public -deep
         *  */`);
        return true;
    }
}

/**
 * 获取命令执行文件夹
 * 指令 -dir
 * 参数 ./
 * 必填，待处理的图片文件夹
 */
function getEntryFolder() {
    let i = process.argv.findIndex((i) => i === "-dir" || i === "-img");
    if (type === "none" || i === -1 || !process.argv[i + 1]) return err("命令执行获取有效路径：失败");
    return process.argv[i + 1];
}

/**
 * 获取是否深度递归处理图片文件夹
 * 指令 -deep
 * 可选，默认不深度递归
 */
function getDeepLoop() {
    return process.argv.findIndex((i) => i === "-deep") !== -1;
}

/**
 * 过滤待处理文件夹，得到待处理文件列表
 * @param {*} folder 待处理文件夹
 * @param {*} files 待处理文件列表
 */
function fileFilter(folder) {
    if (conf.type === "img") {
        conf.files.push(folder);
        return;
    }
    // 读取文件夹
    fs.readdirSync(folder).forEach((file) => {
        let fullFilePath = path.join(folder, file);
        // 读取文件信息
        let fileStat = fs.statSync(fullFilePath);
        // 过滤文件安全性/大小限制/后缀名
        if (fileStat.size <= conf.Max && fileStat.isFile() && conf.Exts.includes(path.extname(file)))
            conf.files.push(fullFilePath);
        // 是都要深度递归处理文件夹
        else if (conf.DeepLoop && fileStat.isDirectory()) fileFilter(fullFilePath);
    });
}

/**
 * TinyPng 远程压缩 HTTPS 请求的配置生成方法
 */

function getAjaxOptions() {
    return {
        method: "POST",
        hostname: "tinypng.com",
        path: "/web/shrink",
        headers: {
            rejectUnauthorized: false,
            "X-Forwarded-For": Array(4)
                .fill(1)
                .map(() => parseInt(Math.random() * 254 + 1))
                .join("."),
            "Postman-Token": Date.now(),
            "Cache-Control": "no-cache",
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent":
                "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
        }
    };
}

/**
 * TinyPng 远程压缩 HTTPS 请求
 * @param {string} img 待处理的文件
 * @success {
 *              "input": { "size": 887, "type": "image/png" },
 *              "output": { "size": 785, "type": "image/png", "width": 81, "height": 81, "ratio": 0.885, "url": "https://tinypng.com/web/output/7aztz90nq5p9545zch8gjzqg5ubdatd6" }
 *           }
 * @error  {"error": "Bad request", "message" : "Request is invalid"}
 */
function fileUpload(imgPath) {
    let req = https.request(getAjaxOptions(), (res) => {
        res.on("data", (buf) => {
            let obj = JSON.parse(buf.toString());
            if (obj.error) console.log(`压缩失败！\n 当前文件：${imgPath} \n ${obj.message}`);
            else fileUpdate(imgPath, obj);
        });
    });

    req.write(fs.readFileSync(imgPath), "binary");
    req.on("error", (e) => console.error(`请求错误! \n 当前文件：${imgPath} \n`, e));
    req.end();
}

// 该方法被循环调用,请求图片数据
function fileUpdate(entryImgPath, obj) {
    let options = new URL(obj.output.url);
    let req = https.request(options, (res) => {
        let body = "";
        res.setEncoding("binary");
        res.on("data", (data) => (body += data));
        res.on("end", () => {
            fs.writeFile(entryImgPath, body, "binary", (err) => {
                if (err) return console.error(err);
                conf.successCount++;
                let log = `压缩成功，`;
                log += `优化比例: ${((1 - obj.output.ratio) * 100).toFixed(2)}% ，`;
                log += `原始大小: ${(obj.input.size / 1024).toFixed(2)}KB ，`;
                log += `压缩大小: ${(obj.output.size / 1024).toFixed(2)}KB ,`;
                log += `文件[${conf.successCount}] ：${entryImgPath}`;
                console.log(log);
            });
        });
    });
    req.on("error", (e) => console.error(e));
    req.end();
}

// node ./tinypng.js -dir ./static/smp/m/course_task
