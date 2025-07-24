# DXCC JSON 数据处理工具

## 项目简介

本项目是一个专门用于处理 ARRL DXCC（DX Century Club）实体数据的工具集，能够将 ARRL 官方发布的文本格式 DXCC 实体列表转换为结构化的 JSON 格式数据，并提供数据验证和可视化功能。

## 项目特性

- 🔄 **数据转换**：将 ARRL DXCC 文本文件转换为标准化的 JSON 格式
- 📊 **多版本支持**：支持 2013、2020、2022 年版本的 DXCC 数据
- 🔍 **数据验证**：提供 Web 界面验证和检查 JSON 数据的正确性
- 📋 **完整信息**：包含前缀、实体名称、大洲、ITU/CQ 区域、实体代码等完整信息
- 🏷️ **特殊标记处理**：正确处理各种特殊标记和注释
- 📝 **JSON Schema**：提供完整的数据结构定义

## 项目结构

```
dxcc-json/
├── package.json                         # Node.js 配置文件，包含项目信息和脚本
├── README.md                          # 项目说明文档
├── schema.json                         # JSON 数据结构定义
├── dxcc-txt2json.js                   # 主要转换工具
├── Prefix Cross References.md          # 前缀交叉参考文档
│
├── txt/                               # 原始文本数据文件
│   ├── 1995_Current_Deleted.txt
│   ├── 2013_Current_Deleted.txt
│   ├── 2020 Current_Deleted.txt
│   └── 2022_Current_Deleted.txt
│
├── checker/                           # Web 验证工具
│   ├── dxcc-json-checker.html        # 验证工具主页面
│   ├── dxcc-json-checker.js          # 验证工具脚本
│   └── dxcc-json-checker.css         # 验证工具样式
│
└── 生成的 JSON 文件
    ├── dxcc_current_2013.json         # 2013年当前实体
    ├── dxcc_current_2020.json         # 2020年当前实体
    ├── dxcc_current_2022.json         # 2022年当前实体
    ├── dxcc_current_deleted_2013.json # 2013年当前+已删除实体
    ├── dxcc_current_deleted_2020.json # 2020年当前+已删除实体
    ├── dxcc_current_deleted_2022.json # 2022年当前+已删除实体
    ├── dxcc_deleted_2013.json         # 2013年已删除实体
    ├── dxcc_deleted_2020.json         # 2020年已删除实体
    └── dxcc_deleted_2022.json         # 2022年已删除实体
```

## 快速开始

### 环境要求

- Node.js 14.0 或更高版本
- 支持 ES6 模块的现代浏览器（用于验证工具）

### 安装和使用

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd dxcc-json
   ```

2. **转换数据文件**
   ```bash
   # 转换所有实体（当前+已删除）
   node dxcc-txt2json.js txt/2022_Current_Deleted.txt --all
   
   # 仅转换当前实体
   node dxcc-txt2json.js txt/2022_Current_Deleted.txt --current
   
   # 仅转换已删除实体
   node dxcc-txt2json.js txt/2022_Current_Deleted.txt --deleted
   
   # 指定输出文件名
   node dxcc-txt2json.js txt/2022_Current_Deleted.txt my_output.json --current
   ```

3. **使用验证工具**
   - 在浏览器中打开 `checker/dxcc-json-checker.html`
   - 上传生成的 JSON 文件进行验证和查看

## 工具详细说明

### 数据转换工具 (dxcc-txt2json.js)

这是项目的核心工具，负责将 ARRL 官方的文本格式 DXCC 列表转换为结构化的 JSON 数据。

**主要功能：**
- 解析 ARRL DXCC 文本文件格式
- 提取前缀、实体名称、大洲、ITU/CQ 区域等信息
- 处理各种特殊标记和注释
- 生成符合 JSON Schema 的标准化数据
- 支持三种过滤模式：全部、当前、已删除

**命令行参数：**
- `--all`：包含所有实体（当前和已删除）
- `--current`：仅包含当前有效实体
- `--deleted`：仅包含已删除实体
- `--help`：显示帮助信息

### 数据验证工具 (checker/)

提供 Web 界面用于验证和查看生成的 JSON 数据。

**功能特性：**
- 文件上传和拖拽支持
- JSON 数据结构验证
- 实体数据表格显示
- 排序和过滤功能
- 响应式设计，支持移动设备

### JSON Schema (schema.json)

定义了生成的 JSON 数据的完整结构，包括：
- 元数据信息（版本、统计信息等）
- 实体数据结构
- 注释和特殊标记定义
- 大洲和区域代码映射

## 数据格式说明

### JSON 数据结构

```json
{
  "metadata": {
    "title": "ARRL DXCC List",
    "edition": "February 2022",
    "totalEntities": 340,
    "description": "Current DXCC Entities",
    "filterType": "current",
    "notes": { /* 各种注释和说明 */ },
    "continents": { /* 大洲代码映射 */ },
    "statistics": { /* 统计信息 */ }
  },
  "entities": [
    {
      "prefix": "3A*",
      "entity": "Monaco",
      "continent": "EU",
      "ituZone": 27,
      "cqZone": 14,
      "entityCode": 260,
      "notes": ["qsl_service"],
      "isDeleted": false
    }
    // ... 更多实体
  ]
}
```

### 特殊标记说明

- `*`：表示可通过 ARRL 会员外发 QSL 服务转发 QSL 卡的实体
- `#`：表示美国业余无线电爱好者可以合法处理第三方消息流量的实体
- `(数字)`：表示特殊注释，详细说明见 notes 字段

### 大洲代码

- `AF`：非洲 (Africa)
- `AN`：南极洲 (Antarctica)
- `AS`：亚洲 (Asia)
- `EU`：欧洲 (Europe)
- `NA`：北美洲 (North America)
- `OC`：大洋洲 (Oceania)
- `SA`：南美洲 (South America)

## 版本历史

项目包含以下版本的 DXCC 数据：

- **2022年2月版**：当前最新版本，包含 340 个当前实体
- **2020年版**：历史版本数据
- **2013年版**：历史版本数据
- **1995年版**：早期历史数据

## 技术特性

- **ES6 模块**：使用现代 JavaScript 模块系统
- **命令行工具**：支持多种参数和选项
- **错误处理**：完善的错误检测和报告机制
- **数据验证**：严格的数据格式验证
- **跨平台**：支持 Windows、macOS、Linux

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。在提交代码前，请确保：

1. 代码符合项目的编码规范
2. 添加适当的注释和文档
3. 测试新功能的正确性
4. 更新相关文档

## 许可证

本项目遵循开源许可证，具体许可证信息请查看项目根目录下的 LICENSE 文件。

## 作者信息

- **作者**：BG6LH
- **版本**：0.1.0
- **更新日期**：2025年6月

## 相关资源

- [ARRL DXCC 官方网站](https://www.arrl.org/dxcc)
- [DXCC 规则和说明](https://www.arrl.org/dxcc-rules)
- [业余无线电前缀参考](https://www.arrl.org/country-lists-prefixes)

---

如有问题或建议，请通过 GitHub Issues 联系项目维护者。

---

## ⭐ 支持本项目

本项目在AI工具辅助下完成。我正在尝试把我在业余无线电活动中遇到的需求，做成一些有趣的应用。如果你有兴趣，可以在项目里给我留言。你的赞助，也是让我维持这些工作的动力。如果这个项目对你有帮助，请给它一个 ⭐！

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/T6T01D9CDW)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/jamflying)

