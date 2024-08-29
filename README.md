# 视频AI助手

## 简介

视频AI助手是一款用于YouTube和哔哩哔哩视频的浏览器扩展，提供AI助手功能，支持数学公式渲染。用户可以在观看视频时向AI助手提问，获取相关的回答。

## 功能

- 在YouTube和哔哩哔哩视频页面上添加AI助手按钮
- 记录和管理用户与AI助手的对话
- 支持数学公式渲染
- 自定义API端点和模型

## 安装

1. 克隆或下载此项目到本地。
2. 打开Chrome浏览器，进入扩展程序管理页面（`chrome://extensions/`）。
3. 打开右上角的“开发者模式”。
4. 点击“加载已解压的扩展程序”，选择项目文件夹。

## 使用方法

### 设置API密钥

1. 点击浏览器右上角的扩展程序图标，打开插件的设置页面。
2. 在“设置”标签页中，输入您的API密钥和其他相关设置。
3. 点击“保存设置”按钮。

### 向AI助手提问

1. 打开YouTube或哔哩哔哩视频页面。
2. 在视频控制栏中找到AI助手按钮，点击它。
3. 在弹出的对话框中输入您的问题，点击“提问”按钮。
4. AI助手会根据视频的当前时间戳和您的问题，提供相关的回答。

### 管理对话

- 在设置页面的“历史对话”标签中，可以查看和管理之前的对话记录。
- 点击某个对话记录，可以重新打开该对话。

## 文件说明

- `content.js`：主要逻辑文件，负责在视频页面上注入AI助手按钮和处理用户交互。
- `popup.js`：设置页面的逻辑文件，负责加载和保存用户设置。
- `background.js`：后台脚本，处理与Chrome存储和消息传递相关的操作。
- `manifest.json`：Chrome扩展的配置文件。
- `popup.html`：设置页面的HTML文件。
- `styles.css`：样式文件，定义了AI助手按钮和对话框的样式。

## 开发

### 依赖

- `marked.min.js`：Markdown解析库。
- `mathjax`：数学公式渲染库。

### 自定义API端点

在`popup.html`的设置页面中，可以自定义API端点和模型。

### 配置AI助教

1. 打开扩展程序的设置页面。
2. 在“设置”标签页中，您可以配置以下选项：
   - **API 密钥**：输入您的API密钥。
   - **AI 模型**：选择要使用的AI模型（例如：GPT-4o）。
   - **当前时间之前捕获时间（秒）**：设置在当前视频时间之前捕获的时间长度。
   - **当前时间之后捕获时间（秒）**：设置在当前视频时间之后捕获的时间长度。
   - **每隔多少秒捕获一帧**：设置捕获视频帧的时间间隔。
   - **API 端点**：输入自定义的API端点URL。

## 贡献

欢迎提交问题和贡献代码。请确保在提交PR之前，已经运行并通过了所有测试。

## 许可证

本项目基于MIT许可证开源。