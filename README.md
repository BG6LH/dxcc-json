# DXCC JSON Data Processing Tools

## Project Overview

This project is a specialized toolkit for processing ARRL DXCC (DX Century Club) entity data, capable of converting ARRL official text format DXCC entity lists into structured JSON format data, and providing data validation and visualization features.

## Project Features

- 🔄 **Data Conversion**: Convert ARRL DXCC text files to standardized JSON format
- 📊 **Multi-version Support**: Support for DXCC data from 2013, 2020, and 2022 versions
- 🔍 **Data Validation**: Provide web interface for validating and checking JSON data correctness
- 📋 **Complete Information**: Include prefix, entity name, continent, ITU/CQ zone, entity code and other complete information
- 🏷️ **Special Marking Processing**: Correctly handle various special markings and annotations
- 📝 **JSON Schema**: Provide complete data structure definition

## Project Structure

```
dxcc-json/
├── package.json                         # Node.js configuration file, containing project information and scripts
├── README.md                          # Project documentation
├── schema.json                         # JSON data structure definition
├── dxcc-txt2json.js                   # Main conversion tool
├── Prefix Cross References.md          # Prefix cross-reference documentation
│
├── txt/                               # Original text data files
│   ├── 1995_Current_Deleted.txt
│   ├── 2013_Current_Deleted.txt
│   ├── 2020 Current_Deleted.txt
│   └── 2022_Current_Deleted.txt
│
├── checker/                           # Web validation tools
│   ├── dxcc-json-checker.html        # Validation tool main page
│   ├── dxcc-json-checker.js          # Validation tool script
│   └── dxcc-json-checker.css         # Validation tool styles
│
└── Generated JSON files
    ├── dxcc_current_2013.json         # 2013 current entities
    ├── dxcc_current_2020.json         # 2020 current entities
    ├── dxcc_current_2022.json         # 2022 current entities
    ├── dxcc_current_deleted_2013.json # 2013 current + deleted entities
    ├── dxcc_current_deleted_2020.json # 2020 current + deleted entities
    ├── dxcc_current_deleted_2022.json # 2022 current + deleted entities
    ├── dxcc_deleted_2013.json         # 2013 deleted entities
    ├── dxcc_deleted_2020.json         # 2020 deleted entities
    └── dxcc_deleted_2022.json         # 2022 deleted entities
```

## Quick Start

### Requirements

- Node.js 14.0 or higher
- Modern browser with ES6 module support (for validation tools)

### Installation and Usage

1. **Clone the project**
   ```bash
   git clone <repository-url>
   cd dxcc-json
   ```

2. **Convert data files**
   ```bash
   # Convert all entities (current + deleted)
   node dxcc-txt2json.js txt/2022_Current_Deleted.txt --all
   
   # Convert current entities only
   node dxcc-txt2json.js txt/2022_Current_Deleted.txt --current
   
   # Convert deleted entities only
   node dxcc-txt2json.js txt/2022_Current_Deleted.txt --deleted
   
   # Specify output filename
   node dxcc-txt2json.js txt/2022_Current_Deleted.txt my_output.json --current
   ```

3. **Use validation tools**
   - Open `checker/dxcc-json-checker.html` in your browser
   - Upload generated JSON files for validation and viewing

## Tool Details

### Data Conversion Tool (dxcc-txt2json.js)

This is the core tool of the project, responsible for converting ARRL official text format DXCC lists into structured JSON data.

**Main Features:**
- Parse ARRL DXCC text file format
- Extract prefix, entity name, continent, ITU/CQ zone and other information
- Handle various special markings and annotations
- Generate standardized data compliant with JSON Schema
- Support three filtering modes: all, current, deleted

**Command Line Arguments:**
- `--all`: Include all entities (current and deleted)
- `--current`: Include current valid entities only
- `--deleted`: Include deleted entities only
- `--help`: Display help information

### Data Validation Tool (checker/)

Provides web interface for validating and viewing generated JSON data.

**Features:**
- File upload and drag-and-drop support
- JSON data structure validation
- Entity data table display
- Sorting and filtering functionality
- Responsive design, mobile device support

### JSON Schema (schema.json)

Defines the complete structure of generated JSON data, including:
- Metadata information (version, statistics, etc.)
- Entity data structure
- Annotation and special marking definitions
- Continent and zone code mappings

## Data Format Description

### JSON Data Structure

```json
{
  "metadata": {
    "title": "ARRL DXCC List",
    "edition": "February 2022",
    "totalEntities": 340,
    "description": "Current DXCC Entities",
    "filterType": "current",
    "notes": { /* Various annotations and descriptions */ },
    "continents": { /* Continent code mappings */ },
    "statistics": { /* Statistical information */ }
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
    // ... more entities
  ]
}
```

### Special Marking Description

- `*`: Indicates entities for which QSLs may be forwarded by the ARRL membership Outgoing QSL Service
- `#`: Indicates entities with which U.S. Amateurs may legally handle third-party message traffic
- `(number)`: Indicates special annotations, detailed descriptions in notes field

### Continent Codes

- `AF`: Africa
- `AN`: Antarctica
- `AS`: Asia
- `EU`: Europe
- `NA`: North America
- `OC`: Oceania
- `SA`: South America

## Version History

The project includes DXCC data for the following versions:

- **February 2022 Edition**: Current latest version, containing 340 current entities
- **2020 Edition**: Historical version data
- **2013 Edition**: Historical version data
- **1995 Edition**: Early historical data

## Technical Features

- **ES6 Modules**: Uses modern JavaScript module system
- **Command Line Tool**: Supports multiple parameters and options
- **Error Handling**: Comprehensive error detection and reporting mechanism
- **Data Validation**: Strict data format validation
- **Cross-platform**: Supports Windows, macOS, Linux

## Contributing Guidelines

Welcome to submit Issues and Pull Requests to improve the project. Before submitting code, please ensure:

1. Code complies with project coding standards
2. Add appropriate comments and documentation
3. Test the correctness of new features
4. Update relevant documentation

## License

This project follows an open source license. For specific license information, please check the LICENSE file in the project root directory.

## Author Information

- **Author**: BG6LH
- **Version**: 0.1.0
- **Updated**: June 2025

## Related Resources

- [ARRL DXCC Official Website](https://www.arrl.org/dxcc)
- [DXCC Rules and Instructions](https://www.arrl.org/dxcc-rules)
- [Amateur Radio Prefix Reference](https://www.arrl.org/country-lists-prefixes)

---

If you have any questions or suggestions, please contact the project maintainer through GitHub Issues.


## ⭐ Support the Project

This project was completed with the assistance of AI tools. I am trying to turn the needs I encounter in amateur radio activities into some interesting applications. If you are interested, you can leave me a message in the project. Your sponsorship is also the motivation for me to maintain this work. If this project helps you, please give it a ⭐!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/T6T01D9CDW){:target="_blank"}

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/jamflying){:target="_blank"}

