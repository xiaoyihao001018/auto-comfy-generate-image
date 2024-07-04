const fs = require("fs");
const filePath = "output.json";

// 读取并解析JSON文件
fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error("读取文件时出错:", err);
    return;
  }

  let jsonData = JSON.parse(data);
  let errorIndex = jsonData.findIndex((item) => item.error !== undefined);

  if (errorIndex > 0) {
    // 从第一个出现error的数组下标的前一位开始，删除error属性
    for (let i = errorIndex - 1; i < jsonData.length; i++) {
      delete jsonData[i].error;
    }
    // 从数组的最后一个元素开始，拿前一个元素的imageUrl，一直到出现error的位置
    for (let i = jsonData.length - 1; i > errorIndex; i--) {
      jsonData[i].imageUrl = jsonData[i - 1].imageUrl;
    }
  }

  // 将处理后的数据转换回JSON字符串
  const updatedData = JSON.stringify(jsonData, null, 2);

  // 保存修改后的JSON
  fs.writeFile("output-modified.json", updatedData, "utf8", (err) => {
    if (err) {
      console.error("写入文件时出错:", err);
    } else {
      console.log("文件已成功保存为 output-modified.json");
    }
  });
});
