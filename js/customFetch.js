export default function customFetch(url, options = {}) {
  /**
   * 默认配置
   */
  const defaultOptions = {
    method: options.method || "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  // 合并用户传入的options和默认配置
  const mergedOptions = { ...defaultOptions, ...options };

  // 处理GET请求时的params转换
  if (mergedOptions.method.toUpperCase() === "GET" && mergedOptions.params) {
    const paramsString = Object.keys(mergedOptions.params)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(
            mergedOptions.params[key]
          )}`
      )
      .join("&");
    url += `?${paramsString}`;
    delete mergedOptions.params; // 删除params，避免影响fetch的options
  }

  // 发起请求
  return fetch(url, mergedOptions)
    .then((response) => {
      // 检查响应状态
      if (!response.ok) {
        return response.json().then((error) => Promise.reject(error));
      }
      // 根据内容类型处理响应
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      } else {
        return response.text();
      }
    })
    .catch((error) => {
      // 统一处理错误
      console.error("Fetch Error:", error);
      throw error; // 重新抛出错误，以便外部可以继续处理
    });
}
