import customFetch from "./customFetch.js";

let prompts = [];
let jsonData;
const generateButton = document.querySelector("#generateButton");
const excelFileInput = document.getElementById("excel-file-input");

generateButton.addEventListener("click", runPrompts);
excelFileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) {
    alert("请选择一个文件！");
    return;
  }
  if (
    !file.type.match(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
  ) {
    alert("请上传正确的文件类型 (.xls 或 .xlsx)！");
    return;
  }

  const reader = new FileReader();
  reader.readAsArrayBuffer(file); // 修改为读取ArrayBuffer
  reader.onload = async (e) => {
    const buffer = e.target.result;
    const workbook = XLSX.read(buffer, { type: "buffer" }); // 修改为使用buffer
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    prompts = excelData;
    prompts = prompts.reduce((acc, curr) => acc.concat(curr), []);
    console.log("prompts", prompts);
    console.log(excelData);
  };
});
loadJSON();
async function loadJSON() {
  try {
    const response = await fetch("./assets/promptTemplate.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    jsonData = await response.json();
    console.log("Loaded JSON data:", jsonData);
  } catch (error) {
    console.error("Error loading JSON data:", error);
  }
}


async function postPromptToServer(promptData) {
  return customFetch("http://192.168.0.20:8188/prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(promptData),
  });
}
async function runPrompts() {
  const results = [];
  const baseUrl = "http://192.168.0.20:8188/view?filename=ComfyUI_";

  for (let i = 0; i < prompts.length; i++) {
    try {
      jsonData.prompt[6].inputs.text = prompts[i];

      // 发送请求并处理响应
      const serverResponse = await postPromptToServer(jsonData);
      console.log("Server response:", serverResponse);

      // 异步等待3秒，这里也可以考虑根据实际情况动态调整
      await delay(5000);
      const paddedIndex = (
        serverResponse.number > 0
          ? serverResponse.number
          : serverResponse.number + 1
      )
        .toString()
        .padStart(5, "0");
      const imageUrl = `${baseUrl}${paddedIndex}_.png&subfolder=&type=output`;
      const imageDataResponse = await fetch(imageUrl);

      if (imageDataResponse.ok) {
        results.push({
          imageUrl: imageUrl,
        });
      } else {
        results.push({
          imageUrl: imageUrl,
          error: `从索引处获取图像失败 ${i + 1}. 请手动检查.`,
        });
      }
      if (i % 100 === 0) {
        writeFile(results);
      }
      console.log("生成结果:", results);
    } catch (error) {
      console.error(`处理提示 ${i + 1} 时发生错误:`, error);
      // 即使当前请求失败，记录错误并继续处理下一个
      results.push({
        prompt: prompts[i],
        error: `处理提示 ${i + 1} 时发生错误: ${error.message}`,
      });
      console.log("生成结果:", results);
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeFile(data) {

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Results");

  // 添加表头
  worksheet.columns = [
    {  key: "imageUrl", width: 150 },
  ];

  // 添加行数据
  data.forEach((item) => {
    worksheet.addRow(item);
  });

  // 使用Blob保存Excel文件（适用于浏览器环境）
  workbook.xlsx.writeBuffer().then(function (buffer) {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "output.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  });
}